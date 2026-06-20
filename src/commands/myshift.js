const {
    SlashCommandBuilder, EmbedBuilder,
} = require('discord.js');
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '../../data/sigil.db'));
db.exec(`
    CREATE TABLE IF NOT EXISTS shift_links (
        discord_id  TEXT PRIMARY KEY,
        staff_name  TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scheduler_config (
        guild_id        TEXT PRIMARY KEY,
        api_url         TEXT NOT NULL,
        bridge_key      TEXT NOT NULL,
        post_channel    TEXT,
        post_time       TEXT NOT NULL DEFAULT '07:00',
        timezone        TEXT NOT NULL DEFAULT 'America/New_York'
    );
`);

const linkUser      = db.prepare('INSERT OR REPLACE INTO shift_links (discord_id, staff_name) VALUES (?,?)');
const getLink       = db.prepare('SELECT staff_name FROM shift_links WHERE discord_id = ?');
const upsertConfig  = db.prepare(`INSERT OR REPLACE INTO scheduler_config (guild_id, api_url, bridge_key, post_channel, post_time, timezone) VALUES (?,?,?,?,?,?)`);
const getConfig     = db.prepare('SELECT * FROM scheduler_config WHERE guild_id = ?');
const getAllConfigs  = db.prepare('SELECT * FROM scheduler_config WHERE post_channel IS NOT NULL');

// Fetch schedules from Sylvia Ross (or any compatible scheduler)
async function fetchSchedules(apiUrl, bridgeKey) {
    const res = await fetch(`${apiUrl}/api/discord/schedules`, {
        headers: { 'x-bridge-key': bridgeKey },
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Scheduler API returned ${res.status}`);
    return res.json(); // array of { staffName, role, date, shiftStart, shiftEnd, notes }
}

function weekRange() {
    const now   = new Date();
    const day   = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end   = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = d => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(end) };
}

// Daily auto-post scheduler
async function startMyShiftScheduler(client) {
    setInterval(async () => {
        const now     = new Date();
        const configs = getAllConfigs.all();
        for (const cfg of configs) {
            const local = new Date(now.toLocaleString('en-US', { timeZone: cfg.timezone }));
            const hhmm  = `${String(local.getHours()).padStart(2,'0')}:${String(local.getMinutes()).padStart(2,'0')}`;
            if (hhmm !== cfg.post_time) continue;

            const guild   = await client.guilds.fetch(cfg.guild_id).catch(() => null);
            if (!guild) continue;
            const channel = await guild.channels.fetch(cfg.post_channel).catch(() => null);
            if (!channel) continue;

            let schedules;
            try { schedules = await fetchSchedules(cfg.api_url, cfg.bridge_key); }
            catch (e) {
                console.error(`[MyShift] Auto-post fetch failed (${cfg.guild_id}):`, e.message);
                continue;
            }

            const today = new Date().toISOString().slice(0, 10);
            const todayShifts = schedules.filter(s => s.date === today);
            if (todayShifts.length === 0) continue;

            const lines = todayShifts
                .sort((a, b) => a.shiftStart.localeCompare(b.shiftStart))
                .map(s => `\`${s.shiftStart}–${s.shiftEnd}\` **${s.staffName}** (${s.role})${s.notes ? ` — *${s.notes}*` : ''}`);

            const embed = new EmbedBuilder()
                .setTitle(`\uD83D\uDDD3\uFE0F Today's Schedule — ${today}`)
                .setDescription(lines.join('\n'))
                .setColor('#5865F2')
                .setFooter({ text: `Sigil • Scheduler Bridge • ${guild.name}` })
                .setTimestamp();

            await channel.send({ embeds: [embed] }).catch(err =>
                console.error(`[MyShift] Auto-post send failed:`, err.message)
            );
        }
    }, 60_000);
}

module.exports = {
    startMyShiftScheduler,

    data: new SlashCommandBuilder()
        .setName('myshift')
        .setDescription('View your shifts from the connected scheduler')
        .addSubcommand(sub =>
            sub.setName('link')
                .setDescription('Link your Discord account to your scheduler name')
                .addStringOption(opt => opt.setName('name').setDescription('Your name exactly as it appears in the schedule (e.g. Nate)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('week')
                .setDescription('Show your shifts for the current week')
        )
        .addSubcommand(sub =>
            sub.setName('today')
                .setDescription('Show your shift today')
        )
        .addSubcommand(sub =>
            sub.setName('roster')
                .setDescription('Show today\'s full roster for all staff')
        )
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Connect a Sylvia Ross / compatible scheduler to Discord (Admin only)')
                .addStringOption(opt => opt.setName('url').setDescription('Your scheduler server URL (e.g. http://192.168.1.10:3000)').setRequired(true))
                .addStringOption(opt => opt.setName('key').setDescription('Your DISCORD_BRIDGE_KEY from the scheduler .env').setRequired(true))
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel for daily schedule auto-post').setRequired(false))
                .addStringOption(opt => opt.setName('time').setDescription('Auto-post time HH:MM 24h (default 07:00)').setRequired(false))
                .addStringOption(opt => opt.setName('timezone').setDescription('Timezone (e.g. America/New_York)').setRequired(false))
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const userId  = interaction.user.id;

        // ── SETUP ────────────────────────────────────────────────────────────
        if (sub === 'setup') {
            if (!interaction.memberPermissions.has('ManageGuild'))
                return interaction.reply({ content: '\u274C You need **Manage Server** to configure the scheduler bridge.', ephemeral: true });

            const url      = interaction.options.getString('url').replace(/\/$/, '');
            const key      = interaction.options.getString('key');
            const channel  = interaction.options.getChannel('channel');
            const time     = interaction.options.getString('time') ?? '07:00';
            const timezone = interaction.options.getString('timezone') ?? 'America/New_York';

            // Test connection
            await interaction.deferReply({ ephemeral: true });
            try {
                const schedules = await fetchSchedules(url, key);
                upsertConfig.run(guildId, url, key, channel?.id ?? null, time, timezone);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('\u2705 Scheduler Connected')
                        .setColor('#57F287')
                        .setDescription(
                            `**URL:** \`${url}\`\n` +
                            `**Records found:** ${schedules.length} shift entries\n` +
                            (channel ? `**Daily post:** <#${channel.id}> at **${time}** (${timezone})` : '*No auto-post channel set.*')
                        )
                        .setFooter({ text: 'Sigil • Scheduler Bridge' })],
                });
            } catch (e) {
                return interaction.editReply({
                    content: `\u274C Could not reach the scheduler.\n\`\`\`${e.message}\`\`\`\nMake sure the scheduler server is running, the URL is correct, and the bridge endpoint is added to \`server.js\`. See the **SCHEDULER_INTEGRATION.md** guide.`,
                });
            }
        }

        // ── LINK ─────────────────────────────────────────────────────────────
        if (sub === 'link') {
            const name = interaction.options.getString('name').trim();
            linkUser.run(userId, name);
            return interaction.reply({
                content: `\u2705 Linked your Discord account to **${name}** in the schedule. Use \`/myshift week\` or \`/myshift today\` to view your shifts.`,
                ephemeral: true,
            });
        }

        // ── Require config for remaining subcommands ──────────────────────────
        const cfg = getConfig.get(guildId);
        if (!cfg)
            return interaction.reply({ content: '\u274C No scheduler connected. Ask an admin to run \`/myshift setup\`.', ephemeral: true });

        await interaction.deferReply({ ephemeral: sub !== 'roster' });

        let schedules;
        try { schedules = await fetchSchedules(cfg.api_url, cfg.bridge_key); }
        catch (e) {
            return interaction.editReply({ content: `\u274C Scheduler unreachable: \`${e.message}\`` });
        }

        // ── TODAY ────────────────────────────────────────────────────────────
        if (sub === 'today') {
            const link = getLink.get(userId);
            if (!link) return interaction.editReply({ content: 'You haven\'t linked your name yet. Run `/myshift link name:YourName` first.' });

            const today  = new Date().toISOString().slice(0, 10);
            const shifts = schedules.filter(s =>
                s.date === today && s.staffName.toLowerCase() === link.staff_name.toLowerCase()
            );

            if (shifts.length === 0)
                return interaction.editReply({ content: `\uD83D\uDDD3\uFE0F You have no shifts today (${today}).` });

            const lines = shifts.map(s =>
                `\u23F0 **${s.shiftStart} – ${s.shiftEnd}** | ${s.role}${s.notes ? ` | *${s.notes}*` : ''}`
            );

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle(`\uD83D\uDDD3\uFE0F Your Shift Today — ${today}`)
                    .setDescription(lines.join('\n'))
                    .setColor('#57F287')
                    .setFooter({ text: `Sigil • Linked as: ${link.staff_name}` })
                    .setTimestamp()],
            });
        }

        // ── WEEK ─────────────────────────────────────────────────────────────
        if (sub === 'week') {
            const link = getLink.get(userId);
            if (!link) return interaction.editReply({ content: 'You haven\'t linked your name yet. Run `/myshift link name:YourName` first.' });

            const { start, end } = weekRange();
            const shifts = schedules
                .filter(s =>
                    s.staffName.toLowerCase() === link.staff_name.toLowerCase() &&
                    s.date >= start && s.date <= end
                )
                .sort((a, b) => a.date.localeCompare(b.date));

            if (shifts.length === 0)
                return interaction.editReply({ content: `\uD83D\uDDD3\uFE0F No shifts found for you this week (${start} – ${end}).` });

            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const lines = shifts.map(s => {
                const d = new Date(s.date + 'T00:00:00');
                return `**${days[d.getDay()]} ${s.date}** — \`${s.shiftStart}–${s.shiftEnd}\` ${s.role}${s.notes ? ` | *${s.notes}*` : ''}`;
            });

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle(`\uD83D\uDDD3\uFE0F Your Week — ${start} to ${end}`)
                    .setDescription(lines.join('\n'))
                    .setColor('#5865F2')
                    .setFooter({ text: `Sigil • Linked as: ${link.staff_name}` })
                    .setTimestamp()],
            });
        }

        // ── ROSTER ───────────────────────────────────────────────────────────
        if (sub === 'roster') {
            const today  = new Date().toISOString().slice(0, 10);
            const shifts = schedules
                .filter(s => s.date === today)
                .sort((a, b) => a.shiftStart.localeCompare(b.shiftStart));

            if (shifts.length === 0)
                return interaction.editReply({ content: `No shifts scheduled for today (${today}).` });

            const lines = shifts.map(s =>
                `\`${s.shiftStart}–${s.shiftEnd}\` **${s.staffName}** (${s.role})${s.notes ? ` — *${s.notes}*` : ''}`
            );

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle(`\uD83D\uDDD3\uFE0F Today's Full Roster — ${today}`)
                    .setDescription(lines.join('\n'))
                    .setColor('#5865F2')
                    .setFooter({ text: `Sigil • Scheduler Bridge` })
                    .setTimestamp()],
            });
        }
    },
};
