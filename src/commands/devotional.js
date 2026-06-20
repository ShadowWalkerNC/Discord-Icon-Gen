const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
} = require('discord.js');
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '../../data/sigil.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS devotional_schedules (
        guild_id     TEXT NOT NULL,
        channel_id   TEXT NOT NULL,
        post_time    TEXT NOT NULL DEFAULT '08:00',
        timezone     TEXT NOT NULL DEFAULT 'America/New_York',
        role_ping    TEXT,
        custom_text  TEXT,
        use_verse    INTEGER NOT NULL DEFAULT 1,
        translation  TEXT NOT NULL DEFAULT 'de4e12af7f28f599-02',
        active       INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (guild_id)
    );
    CREATE TABLE IF NOT EXISTS devotional_queue (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id  TEXT NOT NULL,
        content   TEXT NOT NULL,
        author    TEXT,
        used      INTEGER NOT NULL DEFAULT 0
    );
`);

// Migrate: add translation column if upgrading from old schema
try { db.exec(`ALTER TABLE devotional_schedules ADD COLUMN translation TEXT NOT NULL DEFAULT 'de4e12af7f28f599-02'`); } catch (_) {}

const getSchedule  = db.prepare('SELECT * FROM devotional_schedules WHERE guild_id = ?');
const upsertSched  = db.prepare(`
    INSERT INTO devotional_schedules (guild_id, channel_id, post_time, timezone, role_ping, custom_text, use_verse, translation, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(guild_id) DO UPDATE SET
        channel_id  = excluded.channel_id,
        post_time   = excluded.post_time,
        timezone    = excluded.timezone,
        role_ping   = excluded.role_ping,
        custom_text = excluded.custom_text,
        use_verse   = excluded.use_verse,
        translation = excluded.translation,
        active      = 1
`);
const disableSched = db.prepare('UPDATE devotional_schedules SET active = 0 WHERE guild_id = ?');
const addQueue     = db.prepare('INSERT INTO devotional_queue (guild_id, content, author) VALUES (?, ?, ?)');
const getNextQueue = db.prepare('SELECT * FROM devotional_queue WHERE guild_id = ? AND used = 0 ORDER BY id ASC LIMIT 1');
const markUsed     = db.prepare('UPDATE devotional_queue SET used = 1 WHERE id = ?');
const listQueue    = db.prepare('SELECT * FROM devotional_queue WHERE guild_id = ? AND used = 0 ORDER BY id ASC');
const getAllActive  = db.prepare('SELECT * FROM devotional_schedules WHERE active = 1');

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
// API.Bible Bible IDs (free tier — no key needed for these public bibles)
const TRANSLATIONS = {
    kjv:  { id: 'de4e12af7f28f599-02', name: 'King James Version (KJV)' },
    niv:  { id: '06125adad2d5898a-01', name: 'New International Version (NIV)' },
    esv:  { id: '9879dbb7cfe39e4d-04', name: 'English Standard Version (ESV)' },
    nkjv: { id: '1fd99b0d9a5b0880-01', name: 'New King James Version (NKJV)' },
    nlt:  { id: '65eec8e0b60e656b-01', name: 'New Living Translation (NLT)' },
    msg:  { id: '65eec8e0b60e656b-02', name: 'The Message (MSG)' },
    amp:  { id: '9879dbb7cfe39e4d-02', name: 'Amplified Bible (AMP)' },
    web:  { id: '9879dbb7cfe39e4d-01', name: 'World English Bible (WEB)' },
};

const DEFAULT_TRANSLATION = TRANSLATIONS.kjv.id;

// Daily verse pool — covers popular devotional passages across books
const VERSE_POOL = [
    'JHN.3.16', 'PSA.23.1', 'PHP.4.13', 'JER.29.11', 'ROM.8.28',
    'PRO.3.5',  'ISA.40.31','MAT.11.28','PSA.46.1',  'HEB.11.1',
    'ROM.12.2', '1CO.13.4', 'EPH.2.8',  'PSA.119.105','GAL.5.22-23',
    'JOS.1.9',  'PSA.27.1', 'ISA.41.10','MAT.6.33',  'ROM.15.13',
    'PHP.4.6',  '2TI.1.7',  '1CO.10.13','JAM.1.17',  'HEB.4.16',
    'PSA.37.4', 'LUK.1.37', 'JHN.14.6', '1JN.4.4',   'NAH.1.7',
    'PRO.16.3', 'DEU.31.6', 'PSA.91.1', 'EXO.14.14', '2CO.12.9',
];

// ─── API.Bible FETCH ──────────────────────────────────────────────────────────
const BIBLE_API_KEY = process.env.BIBLE_API_KEY; // optional — falls back gracefully

async function apiBibleFetch(path) {
    const headers = { 'api-key': BIBLE_API_KEY ?? '' };
    const res = await fetch(`https://api.scripture.api.bible/v1${path}`, {
        headers,
        signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) throw new Error(`API.Bible ${res.status}`);
    return res.json();
}

// Strip HTML/JSON markup that API.Bible returns
function cleanVerseText(content) {
    return content
        ?.replace(/<[^>]+>/g, '')
        ?.replace(/\[\d+\]/g, '')
        ?.replace(/\s+/g, ' ')
        ?.trim() ?? '';
}

async function fetchVerseApiDotBible(translationId) {
    // Pick a random passage from pool
    const ref = VERSE_POOL[Math.floor(Math.random() * VERSE_POOL.length)];
    const data = await apiBibleFetch(`/bibles/${translationId}/passages/${ref}?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=false`);
    const text = cleanVerseText(data?.data?.content);
    if (!text) throw new Error('Empty verse content');
    return { text, reference: data.data.reference ?? ref.replace('.', ' ').replace('.', ':') };
}

async function fetchVerseFallback() {
    // Legacy fallback: bible-api.com
    const refs = ['john 3:16','psalm 23:1','philippians 4:13','jeremiah 29:11',
                  'romans 8:28','proverbs 3:5','isaiah 40:31','matthew 11:28'];
    const ref  = refs[Math.floor(Math.random() * refs.length)];
    const res  = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return { text: data.text?.trim(), reference: data.reference };
}

async function fetchVerse(translationId = DEFAULT_TRANSLATION) {
    if (BIBLE_API_KEY) {
        try { return await fetchVerseApiDotBible(translationId); } catch (_) {}
    }
    // No key or API.Bible failed — use free fallback
    try { return await fetchVerseFallback(); } catch (_) {}
    return {
        text: 'Trust in the LORD with all your heart, and do not lean on your own understanding.',
        reference: 'Proverbs 3:5',
    };
}

async function lookupVerse(reference, translationId = DEFAULT_TRANSLATION) {
    if (!BIBLE_API_KEY) {
        // Fallback to bible-api.com for direct lookup without key
        const res  = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return { text: data.text?.trim(), reference: data.reference };
    }
    // Search API.Bible for the passage
    const data = await apiBibleFetch(
        `/bibles/${translationId}/search?query=${encodeURIComponent(reference)}&limit=1`
    );
    const passage = data?.data?.passages?.[0] ?? data?.data?.verses?.[0];
    if (!passage) throw new Error('Verse not found');
    const text = cleanVerseText(passage.content ?? passage.text);
    return { text, reference: passage.reference ?? reference };
}

// ─── EMBED BUILDER ────────────────────────────────────────────────────────────
function translationName(id) {
    return Object.values(TRANSLATIONS).find(t => t.id === id)?.name ?? id;
}

function buildDevotionalEmbed(guild, verse, queueItem, schedule, isPreview = false) {
    const embed = new EmbedBuilder()
        .setTitle(`\uD83D\uDCD6 ${isPreview ? 'Preview — ' : ''}Daily Devotional`)
        .setColor('#F4C842')
        .setTimestamp();

    let desc = '';

    if (verse) {
        desc += `*"${verse.text}"*\n\n\u2014 **${verse.reference}**`;
        if (schedule?.translation)
            desc += ` *(${translationName(schedule.translation)})*`;
        desc += '\n\n';
    }

    if (queueItem) {
        desc += `\uD83D\uDCA1 **Reflection:**\n${queueItem.content}`;
        if (queueItem.author) desc += `\n\n\u2014 *${queueItem.author}*`;
    } else if (schedule?.custom_text) {
        desc += `\uD83D\uDCA1 **Reflection:**\n${schedule.custom_text}`;
    }

    if (!desc) desc = '\uD83D\uDE4F Take a moment to reflect and be grateful today.';

    embed.setDescription(desc);
    embed.setFooter({ text: `Sigil \u2022 Daily Devotional \u2022 ${guild.name}` });
    return embed;
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
function startScheduler(client) {
    setInterval(async () => {
        const now       = new Date();
        const schedules = getAllActive.all();

        for (const sched of schedules) {
            const localTime = new Date(now.toLocaleString('en-US', { timeZone: sched.timezone }));
            const localHHMM = `${String(localTime.getHours()).padStart(2,'0')}:${String(localTime.getMinutes()).padStart(2,'0')}`;
            if (localHHMM !== sched.post_time) continue;

            const guild   = await client.guilds.fetch(sched.guild_id).catch(() => null);
            if (!guild) continue;
            const channel = await guild.channels.fetch(sched.channel_id).catch(() => null);
            if (!channel) continue;

            const verse     = sched.use_verse ? await fetchVerse(sched.translation) : null;
            const queueItem = getNextQueue.get(sched.guild_id);
            if (queueItem) markUsed.run(queueItem.id);

            const embed   = buildDevotionalEmbed(guild, verse, queueItem, sched);
            const content = sched.role_ping ? `<@&${sched.role_ping}>` : undefined;

            await channel.send({ content, embeds: [embed] }).catch(err =>
                console.error(`[Devotional] Failed to post to ${sched.guild_id}:`, err.message)
            );
        }
    }, 60_000);
}

// ─── COMMAND ──────────────────────────────────────────────────────────────────
module.exports = {
    startScheduler,

    data: new SlashCommandBuilder()
        .setName('devotional')
        .setDescription('Manage daily devotional posts')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Set up the daily devotional schedule')
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').setRequired(true))
                .addStringOption(opt => opt.setName('translation').setDescription('Bible translation').setRequired(false)
                    .addChoices(
                        { name: 'King James Version (KJV)', value: 'kjv' },
                        { name: 'New International Version (NIV)', value: 'niv' },
                        { name: 'English Standard Version (ESV)', value: 'esv' },
                        { name: 'New King James Version (NKJV)', value: 'nkjv' },
                        { name: 'New Living Translation (NLT)', value: 'nlt' },
                        { name: 'The Message (MSG)', value: 'msg' },
                        { name: 'Amplified Bible (AMP)', value: 'amp' },
                        { name: 'World English Bible (WEB)', value: 'web' },
                    )
                )
                .addStringOption(opt => opt.setName('time').setDescription('Post time HH:MM 24h (e.g. 08:00)').setRequired(false))
                .addStringOption(opt => opt.setName('timezone').setDescription('Timezone (e.g. America/New_York)').setRequired(false))
                .addRoleOption(opt => opt.setName('ping').setDescription('Role to ping daily').setRequired(false))
                .addBooleanOption(opt => opt.setName('verse').setDescription('Include a Bible verse? (default true)').setRequired(false))
                .addStringOption(opt => opt.setName('reflection').setDescription('Default reflection text when queue is empty').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('lookup')
                .setDescription('Look up a specific Bible verse or passage')
                .addStringOption(opt => opt.setName('reference').setDescription('e.g. John 3:16, Psalm 23:1-6').setRequired(true))
                .addStringOption(opt => opt.setName('translation').setDescription('Translation to use').setRequired(false)
                    .addChoices(
                        { name: 'King James Version (KJV)', value: 'kjv' },
                        { name: 'New International Version (NIV)', value: 'niv' },
                        { name: 'English Standard Version (ESV)', value: 'esv' },
                        { name: 'New King James Version (NKJV)', value: 'nkjv' },
                        { name: 'New Living Translation (NLT)', value: 'nlt' },
                        { name: 'The Message (MSG)', value: 'msg' },
                        { name: 'Amplified Bible (AMP)', value: 'amp' },
                        { name: 'World English Bible (WEB)', value: 'web' },
                    )
                )
        )
        .addSubcommand(sub =>
            sub.setName('queue')
                .setDescription('Add a custom reflection to the devotional queue')
                .addStringOption(opt => opt.setName('content').setDescription('Reflection, quote, or message').setRequired(true).setMaxLength(800))
                .addStringOption(opt => opt.setName('author').setDescription('Attribution (optional)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List upcoming queued devotional reflections')
        )
        .addSubcommand(sub =>
            sub.setName('preview')
                .setDescription('Preview what today\'s devotional will look like')
        )
        .addSubcommand(sub =>
            sub.setName('post')
                .setDescription('Manually post the devotional right now')
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in (defaults to configured channel)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable the daily devotional schedule')
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (['setup','queue','post','disable'].includes(sub) &&
            !interaction.memberPermissions.has('ManageGuild')) {
            return interaction.reply({ content: '\u274C You need **Manage Server** to configure devotionals.', ephemeral: true });
        }

        // ── SETUP ─────────────────────────────────────────────────────────────
        if (sub === 'setup') {
            const channel    = interaction.options.getChannel('channel');
            const transKey   = interaction.options.getString('translation') ?? 'kjv';
            const transId    = TRANSLATIONS[transKey]?.id ?? DEFAULT_TRANSLATION;
            const time       = interaction.options.getString('time')       ?? '08:00';
            const timezone   = interaction.options.getString('timezone')   ?? 'America/New_York';
            const ping       = interaction.options.getRole('ping');
            const useVerse   = interaction.options.getBoolean('verse')     ?? true;
            const reflection = interaction.options.getString('reflection');

            if (!/^\d{2}:\d{2}$/.test(time))
                return interaction.reply({ content: '\u274C Time must be in HH:MM format (e.g. 08:00).', ephemeral: true });

            upsertSched.run(guildId, channel.id, time, timezone, ping?.id ?? null, reflection ?? null, useVerse ? 1 : 0, transId);

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('\uD83D\uDCD6 Devotional Schedule Saved')
                    .setColor('#57F287')
                    .setDescription(
                        `**Channel:** <#${channel.id}>\n` +
                        `**Time:** ${time} (${timezone})\n` +
                        `**Translation:** ${TRANSLATIONS[transKey].name}\n` +
                        `**Bible verse:** ${useVerse ? 'Yes' : 'No'}\n` +
                        (ping ? `**Ping:** <@&${ping.id}>\n` : '') +
                        (reflection ? `**Default reflection:** ${reflection}` : '')
                    )
                    .setFooter({ text: `Sigil \u2022 Devotional \u2022 ${interaction.guild.name}` })
                    .setTimestamp()],
                ephemeral: true,
            });
        }

        // ── LOOKUP ────────────────────────────────────────────────────────────
        if (sub === 'lookup') {
            await interaction.deferReply();
            const ref      = interaction.options.getString('reference');
            const transKey = interaction.options.getString('translation') ?? 'kjv';
            const transId  = TRANSLATIONS[transKey]?.id ?? DEFAULT_TRANSLATION;

            try {
                const verse = await lookupVerse(ref, transId);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`\uD83D\uDCD6 ${verse.reference}`)
                        .setDescription(`*"${verse.text}"*`)
                        .setColor('#F4C842')
                        .setFooter({ text: `Sigil \u2022 ${TRANSLATIONS[transKey]?.name ?? transKey} \u2022 ${interaction.guild.name}` })
                        .setTimestamp()],
                });
            } catch (e) {
                return interaction.editReply({ content: `\u274C Could not find that verse: \`${e.message}\`` });
            }
        }

        // ── QUEUE ─────────────────────────────────────────────────────────────
        if (sub === 'queue') {
            const content = interaction.options.getString('content');
            const author  = interaction.options.getString('author');
            addQueue.run(guildId, content, author ?? null);
            const count = listQueue.all(guildId).length;
            return interaction.reply({
                content: `\u2705 Reflection added to the queue. **${count}** item${count !== 1 ? 's' : ''} queued.`,
                ephemeral: true,
            });
        }

        // ── LIST ──────────────────────────────────────────────────────────────
        if (sub === 'list') {
            const items = listQueue.all(guildId);
            const desc  = items.length === 0
                ? '*Queue is empty. Use `/devotional queue` to add reflections.*'
                : items.map((item, i) =>
                    `**${i + 1}.** ${item.content.slice(0, 80)}${item.content.length > 80 ? '\u2026' : ''}${item.author ? ` \u2014 *${item.author}*` : ''}`
                  ).join('\n');
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('\uD83D\uDCD6 Devotional Queue')
                    .setDescription(desc)
                    .setColor('#5865F2')
                    .setFooter({ text: `Sigil \u2022 Devotional \u2022 ${interaction.guild.name}` })
                    .setTimestamp()],
                ephemeral: true,
            });
        }

        // ── PREVIEW ───────────────────────────────────────────────────────────
        if (sub === 'preview') {
            await interaction.deferReply({ ephemeral: true });
            const sched     = getSchedule.get(guildId);
            const verse     = sched?.use_verse ? await fetchVerse(sched.translation) : null;
            const queueItem = getNextQueue.get(guildId);
            const embed     = buildDevotionalEmbed(interaction.guild, verse, queueItem, sched, true);
            return interaction.editReply({ embeds: [embed] });
        }

        // ── POST ──────────────────────────────────────────────────────────────
        if (sub === 'post') {
            await interaction.deferReply({ ephemeral: true });
            const sched   = getSchedule.get(guildId);
            const chanOpt = interaction.options.getChannel('channel');
            const chanId  = chanOpt?.id ?? sched?.channel_id;

            if (!chanId)
                return interaction.editReply({ content: '\u274C No channel configured. Run `/devotional setup` first.' });

            const channel = await interaction.guild.channels.fetch(chanId).catch(() => null);
            if (!channel)
                return interaction.editReply({ content: '\u274C Channel not found.' });

            const verse     = sched?.use_verse !== 0 ? await fetchVerse(sched?.translation) : null;
            const queueItem = getNextQueue.get(guildId);
            if (queueItem) markUsed.run(queueItem.id);

            const embed   = buildDevotionalEmbed(interaction.guild, verse, queueItem, sched);
            const content = sched?.role_ping ? `<@&${sched.role_ping}>` : undefined;

            await channel.send({ content, embeds: [embed] });
            return interaction.editReply({ content: `\u2705 Devotional posted to <#${chanId}>.` });
        }

        // ── DISABLE ───────────────────────────────────────────────────────────
        if (sub === 'disable') {
            disableSched.run(guildId);
            return interaction.reply({ content: '\u2705 Daily devotional schedule disabled.', ephemeral: true });
        }
    },
};
