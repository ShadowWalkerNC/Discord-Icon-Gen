const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '../../data/sigil.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id    TEXT NOT NULL,
        title       TEXT NOT NULL,
        date        TEXT NOT NULL,
        start_time  TEXT NOT NULL,
        end_time    TEXT NOT NULL,
        role_req    TEXT,
        claimed_by  TEXT,
        msg_id      TEXT,
        channel_id  TEXT,
        created_by  TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shift_config (
        guild_id    TEXT NOT NULL PRIMARY KEY,
        channel_id  TEXT NOT NULL,
        roster_time TEXT NOT NULL DEFAULT '06:00',
        timezone    TEXT NOT NULL DEFAULT 'America/New_York'
    );
`);

const insertShift    = db.prepare(`INSERT INTO shifts (guild_id, title, date, start_time, end_time, role_req, created_by) VALUES (?,?,?,?,?,?,?)`);
const getShift       = db.prepare('SELECT * FROM shifts WHERE id = ?');
const claimShift     = db.prepare('UPDATE shifts SET claimed_by = ? WHERE id = ? AND claimed_by IS NULL');
const dropShift      = db.prepare('UPDATE shifts SET claimed_by = NULL WHERE id = ? AND claimed_by = ?');
const setMsgId       = db.prepare('UPDATE shifts SET msg_id = ?, channel_id = ? WHERE id = ?');
const getOpenShifts  = db.prepare('SELECT * FROM shifts WHERE guild_id = ? AND claimed_by IS NULL AND date >= ? ORDER BY date ASC, start_time ASC LIMIT 10');
const getAllShifts    = db.prepare('SELECT * FROM shifts WHERE guild_id = ? AND date = ? ORDER BY start_time ASC');
const deleteShift    = db.prepare('DELETE FROM shifts WHERE id = ? AND guild_id = ?');
const upsertConfig   = db.prepare(`INSERT INTO shift_config (guild_id, channel_id, roster_time, timezone) VALUES (?,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET channel_id=excluded.channel_id, roster_time=excluded.roster_time, timezone=excluded.timezone`);
const getConfig      = db.prepare('SELECT * FROM shift_config WHERE guild_id = ?');
const getAllConfigs   = db.prepare('SELECT * FROM shift_config');

function today() {
    return new Date().toISOString().slice(0, 10);
}

function buildShiftEmbed(shift, guild) {
    const claimed  = shift.claimed_by;
    const embed = new EmbedBuilder()
        .setTitle(`\uD83D\uDDD3\uFE0F ${shift.title}`)
        .setColor(claimed ? '#FFA500' : '#57F287')
        .setTimestamp();

    let desc = `\uD83D\uDCC5 **Date:** ${shift.date}\n`;
    desc    += `\u23F0 **Time:** ${shift.start_time} \u2013 ${shift.end_time}\n`;
    if (shift.role_req) desc += `\uD83C\uDFF7\uFE0F **Required role:** <@&${shift.role_req}>\n`;
    desc    += `\n${claimed ? `\uD83D\uDFE0 **Claimed by:** <@${claimed}>` : '\uD83D\uDFE2 **Status: Open \u2014 unclaimed**'}`;

    embed.setDescription(desc);
    embed.setFooter({ text: `Sigil \u2022 Shift #${shift.id} \u2022 ${guild?.name ?? 'Server'}` });
    return embed;
}

function buildButtons(shiftId, claimed = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`shift_claim_${shiftId}`)
            .setLabel('\uD83D\uDFE2 Claim Shift')
            .setStyle(ButtonStyle.Success)
            .setDisabled(claimed),
        new ButtonBuilder()
            .setCustomId(`shift_drop_${shiftId}`)
            .setLabel('\uD83D\uDD34 Drop Shift')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!claimed),
        new ButtonBuilder()
            .setCustomId(`shift_delete_${shiftId}`)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Secondary),
    );
}

// Daily roster scheduler
function startShiftScheduler(client) {
    setInterval(async () => {
        const now     = new Date();
        const configs = getAllConfigs.all();
        for (const cfg of configs) {
            const localTime = new Date(now.toLocaleString('en-US', { timeZone: cfg.timezone }));
            const hhmm = `${String(localTime.getHours()).padStart(2,'0')}:${String(localTime.getMinutes()).padStart(2,'0')}`;
            if (hhmm !== cfg.roster_time) continue;

            const guild   = await client.guilds.fetch(cfg.guild_id).catch(() => null);
            if (!guild) continue;
            const channel = await guild.channels.fetch(cfg.channel_id).catch(() => null);
            if (!channel) continue;

            const todayStr = today();
            const shifts   = getAllShifts.all(cfg.guild_id, todayStr);

            if (shifts.length === 0) continue;

            const lines = shifts.map(s =>
                `${s.start_time}\u2013${s.end_time} \u2014 **${s.title}** \u2014 ${s.claimed_by ? `<@${s.claimed_by}>` : '\uD83D\uDFE2 *Open*'}`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`\uD83D\uDDD3\uFE0F Today's Shift Roster \u2014 ${todayStr}`)
                .setDescription(lines)
                .setColor('#5865F2')
                .setFooter({ text: `Sigil \u2022 Shift Roster \u2022 ${guild.name}` })
                .setTimestamp();

            await channel.send({ embeds: [embed] }).catch(err =>
                console.error(`[Shift] Roster post failed for ${cfg.guild_id}:`, err.message)
            );
        }
    }, 60_000);
}

module.exports = {
    startShiftScheduler,

    data: new SlashCommandBuilder()
        .setName('shift')
        .setDescription('Manage staff shifts')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a new shift posting')
                .addStringOption(opt => opt.setName('title').setDescription('Shift title (e.g. Sunday Morning Host)').setRequired(true))
                .addStringOption(opt => opt.setName('date').setDescription('Date (YYYY-MM-DD)').setRequired(true))
                .addStringOption(opt => opt.setName('start').setDescription('Start time (e.g. 09:00)').setRequired(true))
                .addStringOption(opt => opt.setName('end').setDescription('End time (e.g. 13:00)').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('Required role to claim this shift').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in (defaults to current)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('open')
                .setDescription('List all open (unclaimed) upcoming shifts')
        )
        .addSubcommand(sub =>
            sub.setName('roster')
                .setDescription('Show all shifts for a specific date')
                .addStringOption(opt => opt.setName('date').setDescription('Date (YYYY-MM-DD, defaults to today)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('config')
                .setDescription('Configure daily roster auto-post')
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel for daily roster').setRequired(true))
                .addStringOption(opt => opt.setName('time').setDescription('Post time HH:MM 24h (default 06:00)').setRequired(false))
                .addStringOption(opt => opt.setName('timezone').setDescription('Timezone (e.g. America/Chicago)').setRequired(false))
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'create') {
            if (!interaction.memberPermissions.has('ManageEvents')) {
                return interaction.reply({ content: '\u274C You need **Manage Events** to create shifts.', ephemeral: true });
            }

            const title   = interaction.options.getString('title');
            const date    = interaction.options.getString('date');
            const start   = interaction.options.getString('start');
            const end     = interaction.options.getString('end');
            const roleReq = interaction.options.getRole('role');
            const target  = interaction.options.getChannel('channel') ?? interaction.channel;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
                return interaction.reply({ content: '\u274C Date must be in YYYY-MM-DD format.', ephemeral: true });
            if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end))
                return interaction.reply({ content: '\u274C Times must be in HH:MM format.', ephemeral: true });

            const info = insertShift.run(guildId, title, date, start, end, roleReq?.id ?? null, interaction.user.id);
            const shiftId = info.lastInsertRowid;
            const shift   = getShift.get(shiftId);

            const embed = buildShiftEmbed(shift, interaction.guild);
            const row   = buildButtons(shiftId, false);

            let msg;
            try {
                msg = await target.send({ embeds: [embed], components: [row] });
            } catch (err) {
                console.error('[Shift] Failed to post:', err.message);
                return interaction.reply({ content: `\u274C Could not post to <#${target.id}>.`, ephemeral: true });
            }

            setMsgId.run(msg.id, target.id, shiftId);

            return interaction.reply({
                content: `\u2705 Shift **#${shiftId}** posted to <#${target.id}>.`,
                ephemeral: true,
            });
        }

        if (sub === 'open') {
            const shifts = getOpenShifts.all(guildId, today());
            if (shifts.length === 0)
                return interaction.reply({ content: '\uD83D\uDFE2 No open shifts found.', ephemeral: true });

            const desc = shifts.map(s =>
                `**#${s.id}** \u2014 ${s.title} | ${s.date} ${s.start_time}\u2013${s.end_time}${s.role_req ? ` | <@&${s.role_req}>` : ''}`
            ).join('\n');

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('\uD83D\uDFE2 Open Shifts')
                    .setDescription(desc)
                    .setColor('#57F287')
                    .setFooter({ text: `Sigil \u2022 Shifts \u2022 ${interaction.guild.name}` })
                    .setTimestamp()],
                ephemeral: true,
            });
        }

        if (sub === 'roster') {
            const dateStr = interaction.options.getString('date') ?? today();
            const shifts  = getAllShifts.all(guildId, dateStr);

            if (shifts.length === 0)
                return interaction.reply({ content: `No shifts found for **${dateStr}**.`, ephemeral: true });

            const lines = shifts.map(s =>
                `${s.start_time}\u2013${s.end_time} \u2014 **${s.title}** \u2014 ${s.claimed_by ? `<@${s.claimed_by}>` : '\uD83D\uDFE2 *Open*'}`
            ).join('\n');

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(`\uD83D\uDDD3\uFE0F Shift Roster \u2014 ${dateStr}`)
                    .setDescription(lines)
                    .setColor('#5865F2')
                    .setFooter({ text: `Sigil \u2022 Shifts \u2022 ${interaction.guild.name}` })
                    .setTimestamp()],
            });
        }

        if (sub === 'config') {
            if (!interaction.memberPermissions.has('ManageGuild'))
                return interaction.reply({ content: '\u274C You need **Manage Server** to configure shifts.', ephemeral: true });

            const channel  = interaction.options.getChannel('channel');
            const time     = interaction.options.getString('time') ?? '06:00';
            const timezone = interaction.options.getString('timezone') ?? 'America/New_York';

            upsertConfig.run(guildId, channel.id, time, timezone);

            return interaction.reply({
                content: `\u2705 Daily roster will post to <#${channel.id}> at **${time}** (${timezone}).`,
                ephemeral: true,
            });
        }
    },

    async handleButton(interaction) {
        const id = interaction.customId;
        if (!id.startsWith('shift_')) return false;

        const parts   = id.split('_');
        const action  = parts[1];
        const shiftId = parseInt(parts[2]);
        const shift   = getShift.get(shiftId);

        if (!shift) return interaction.reply({ content: 'This shift no longer exists.', ephemeral: true });

        const userId = interaction.user.id;
        const member = interaction.member;

        if (action === 'claim') {
            if (shift.claimed_by)
                return interaction.reply({ content: '\uD83D\uDFE0 This shift has already been claimed.', ephemeral: true });

            if (shift.role_req && !member.roles.cache.has(shift.role_req))
                return interaction.reply({ content: `\u274C You need the <@&${shift.role_req}> role to claim this shift.`, ephemeral: true });

            const result = claimShift.run(userId, shiftId);
            if (result.changes === 0)
                return interaction.reply({ content: '\uD83D\uDFE0 Someone just claimed this shift.', ephemeral: true });

            const updated = getShift.get(shiftId);
            const embed   = buildShiftEmbed(updated, interaction.guild);
            await interaction.update({ embeds: [embed], components: [buildButtons(shiftId, true)] });
            return true;
        }

        if (action === 'drop') {
            if (shift.claimed_by !== userId && !interaction.memberPermissions?.has('ManageEvents'))
                return interaction.reply({ content: '\u274C You can only drop your own shift.', ephemeral: true });

            dropShift.run(userId, shiftId);
            const updated = getShift.get(shiftId);
            const embed   = buildShiftEmbed(updated, interaction.guild);
            await interaction.update({ embeds: [embed], components: [buildButtons(shiftId, false)] });
            return true;
        }

        if (action === 'delete') {
            if (!interaction.memberPermissions?.has('ManageEvents'))
                return interaction.reply({ content: '\u274C Only managers can delete shifts.', ephemeral: true });

            deleteShift.run(shiftId, shift.guild_id);
            await interaction.update({
                embeds: [new EmbedBuilder().setTitle('\uD83D\uDDD1\uFE0F Shift Deleted').setColor('#555555').setDescription('This shift has been removed.')],
                components: [],
            });
            return true;
        }

        return false;
    },
};
