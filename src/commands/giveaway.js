const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');

// store: msgId -> { prize, host, endsAt, winnersCount, entries: Set, roleReq, channel, guild, ended }
const giveawayStore = new Map();

function parseTime(str) {
    if (!str) return null;
    const s = str.toLowerCase();
    const match = s.match(/(\d+)\s*(d(?:ays?)?|h(?:ours?)?|m(?:in(?:utes?)?)?|s(?:ec(?:onds?)?)?)/);
    if (!match) return null;
    const n = parseInt(match[1]);
    const u = match[2][0];
    if (u === 'd') return n * 86_400_000;
    if (u === 'h') return n * 3_600_000;
    if (u === 'm') return n * 60_000;
    if (u === 's') return n * 1_000;
    return null;
}

function timeLeft(endsAt) {
    const ms = endsAt - Date.now();
    if (ms <= 0) return 'Ended';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function pickWinners(entries, count) {
    const arr = [...entries];
    const winners = [];
    const pool    = [...arr];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
    }
    return winners;
}

function buildEmbed(data, ended = false, winners = []) {
    const embed = new EmbedBuilder()
        .setTitle(`\uD83C\uDF89 ${data.prize}`)
        .setColor(ended ? '#555555' : '#FEE75C')
        .setTimestamp(new Date(data.endsAt));

    let desc = '';
    if (ended) {
        desc = winners.length > 0
            ? `\uD83C\uDFC6 **Winner${winners.length > 1 ? 's' : ''}:** ${winners.map(w => `<@${w}>`).join(', ')}\n`
            : '\u274C No valid entries — no winner.\n';
    } else {
        desc += `\u23F0 **Ends:** <t:${Math.floor(data.endsAt / 1000)}:R> (${timeLeft(data.endsAt)})\n`;
    }
    desc += `\uD83C\uDFAB **Entries:** ${data.entries.size}\n`;
    desc += `\uD83C\uDFC5 **Winners:** ${data.winnersCount}\n`;
    if (data.roleReq) desc += `\uD83C\uDFF7\uFE0F **Required role:** <@&${data.roleReq}>\n`;
    desc += `\uD83D\uDC64 **Hosted by:** <@${data.host}>`;
    if (ended) desc += '\n\n*This giveaway has ended.*';

    embed.setDescription(desc);
    embed.setFooter({ text: `Sigil \u2022 Giveaway \u2022 ${data.guild.name}` });
    return embed;
}

function buildButtons(msgId, ended = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`gw_enter_${msgId}`)
            .setLabel('\uD83C\uDF89 Enter')
            .setStyle(ButtonStyle.Success)
            .setDisabled(ended),
        new ButtonBuilder()
            .setCustomId(`gw_leave_${msgId}`)
            .setLabel('\u274C Leave')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(ended),
        new ButtonBuilder()
            .setCustomId(`gw_end_${msgId}`)
            .setLabel('End Now')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(ended),
    );
}

async function endGiveaway(msgId, client) {
    const data = giveawayStore.get(msgId);
    if (!data || data.ended) return;
    data.ended = true;

    const winners = pickWinners(data.entries, data.winnersCount);
    data.winners  = winners;

    const embed = buildEmbed(data, true, winners);
    try {
        await data.message.edit({ embeds: [embed], components: [buildButtons(msgId, true)] });
        if (winners.length > 0) {
            await data.message.reply({
                content: `\uD83C\uDF89 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${data.prize}**!`,
            });
        } else {
            await data.message.reply({ content: '\u274C No entries — no winner for this giveaway.' });
        }
    } catch (e) {
        console.error('[Giveaway] End error:', e.message);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('How long (e.g. 1h, 30m, 2d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners (default 1)').setRequired(false).setMinValue(1).setMaxValue(20))
                .addRoleOption(opt => opt.setName('role').setDescription('Required role to enter').setRequired(false))
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').setRequired(false))
                .addRoleOption(opt => opt.setName('ping').setDescription('Role to ping').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Reroll the winner of a giveaway')
                .addStringOption(opt => opt.setName('message_id').setDescription('Message ID of the ended giveaway').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all active giveaways in this server')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'start') {
            if (!interaction.memberPermissions.has('ManageGuild'))
                return interaction.reply({ content: '\u274C You need **Manage Server** to start giveaways.', ephemeral: true });

            const prize    = interaction.options.getString('prize');
            const durStr   = interaction.options.getString('duration');
            const durMs    = parseTime(durStr);
            const winners  = interaction.options.getInteger('winners') ?? 1;
            const roleReq  = interaction.options.getRole('role');
            const target   = interaction.options.getChannel('channel') ?? interaction.channel;
            const ping     = interaction.options.getRole('ping');

            if (!durMs)
                return interaction.reply({ content: '\u274C Invalid duration. Use formats like `1h`, `30m`, `2d`.', ephemeral: true });
            if (durMs < 10_000)
                return interaction.reply({ content: '\u274C Minimum duration is 10 seconds.', ephemeral: true });

            const endsAt = Date.now() + durMs;
            const data   = {
                prize, endsAt, host: interaction.user.id,
                winnersCount: winners,
                roleReq: roleReq?.id ?? null,
                entries: new Set(),
                guild: interaction.guild,
                ended: false,
                winners: [],
            };

            const embed = buildEmbed(data);
            let msg;
            try {
                msg = await target.send({
                    content: ping ? `<@&${ping.id}> \uD83C\uDF89` : '\uD83C\uDF89 **GIVEAWAY** \uD83C\uDF89',
                    embeds:  [embed],
                    components: [buildButtons('placeholder')],
                });
            } catch (e) {
                return interaction.reply({ content: `\u274C Could not post to <#${target.id}>.`, ephemeral: true });
            }

            data.message = msg;
            giveawayStore.set(msg.id, data);
            await msg.edit({ components: [buildButtons(msg.id)] }).catch(() => {});

            // Auto end timer
            setTimeout(() => endGiveaway(msg.id, interaction.client), durMs);

            // Live countdown update every minute if > 2min
            if (durMs > 120_000) {
                const interval = setInterval(async () => {
                    const d = giveawayStore.get(msg.id);
                    if (!d || d.ended) { clearInterval(interval); return; }
                    const upEmbed = buildEmbed(d);
                    await msg.edit({ embeds: [upEmbed] }).catch(() => clearInterval(interval));
                }, 60_000);
            }

            return interaction.reply({
                content: `\u2705 Giveaway started in <#${target.id}>! Ends in **${durStr}**.`,
                ephemeral: true,
            });
        }

        if (sub === 'reroll') {
            if (!interaction.memberPermissions.has('ManageGuild'))
                return interaction.reply({ content: '\u274C You need **Manage Server** to reroll.', ephemeral: true });

            const msgId = interaction.options.getString('message_id');
            const data  = giveawayStore.get(msgId);

            if (!data || !data.ended)
                return interaction.reply({ content: '\u274C Giveaway not found or not yet ended. Make sure to use the message ID of an ended giveaway.', ephemeral: true });

            const newWinners = pickWinners(data.entries, data.winnersCount);
            data.winners     = newWinners;

            if (newWinners.length === 0)
                return interaction.reply({ content: '\u274C No entries to reroll from.', ephemeral: true });

            await interaction.reply({
                content: `\uD83C\uDF89 **Reroll!** New winner${newWinners.length > 1 ? 's' : ''}: ${newWinners.map(w => `<@${w}>`).join(', ')} — congratulations!`,
            });
        }

        if (sub === 'list') {
            const active = [...giveawayStore.entries()]
                .filter(([, d]) => !d.ended && d.guild.id === interaction.guild.id);

            if (active.length === 0)
                return interaction.reply({ content: '\uD83C\uDF89 No active giveaways right now.', ephemeral: true });

            const lines = active.map(([id, d]) =>
                `**${d.prize}** — ${d.entries.size} entries — ends <t:${Math.floor(d.endsAt / 1000)}:R>\n\u2514 [Jump](https://discord.com/channels/${d.guild.id}/${d.message.channelId}/${id})`
            );

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('\uD83C\uDF89 Active Giveaways')
                    .setDescription(lines.join('\n\n'))
                    .setColor('#FEE75C')
                    .setFooter({ text: `Sigil \u2022 Giveaways \u2022 ${interaction.guild.name}` })
                    .setTimestamp()],
                ephemeral: true,
            });
        }
    },

    async handleButton(interaction) {
        const id = interaction.customId;
        if (!id.startsWith('gw_')) return false;

        const parts  = id.split('_');
        const action = parts[1];
        const msgId  = parts.slice(2).join('_');
        const data   = giveawayStore.get(msgId);

        if (!data) return interaction.reply({ content: 'This giveaway is no longer active.', ephemeral: true });
        if (data.ended) return interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });

        const userId = interaction.user.id;
        const member = interaction.member;

        if (action === 'enter') {
            if (data.roleReq && !member.roles.cache.has(data.roleReq))
                return interaction.reply({ content: `\u274C You need the <@&${data.roleReq}> role to enter.`, ephemeral: true });
            if (data.entries.has(userId))
                return interaction.reply({ content: 'You are already entered!', ephemeral: true });

            data.entries.add(userId);
            const embed = buildEmbed(data);
            await interaction.update({ embeds: [embed], components: [buildButtons(msgId)] });
            await interaction.followUp({ content: `\uD83C\uDF89 You've entered the **${data.prize}** giveaway! Good luck!`, ephemeral: true });
            return true;
        }

        if (action === 'leave') {
            if (!data.entries.has(userId))
                return interaction.reply({ content: 'You are not entered in this giveaway.', ephemeral: true });
            data.entries.delete(userId);
            const embed = buildEmbed(data);
            await interaction.update({ embeds: [embed], components: [buildButtons(msgId)] });
            await interaction.followUp({ content: '\u2705 You have left the giveaway.', ephemeral: true });
            return true;
        }

        if (action === 'end') {
            const isMod = interaction.memberPermissions?.has('ManageGuild');
            if (userId !== data.host && !isMod)
                return interaction.reply({ content: '\u274C Only the host or a manager can end this early.', ephemeral: true });
            await interaction.deferUpdate();
            await endGiveaway(msgId, interaction.client);
            return true;
        }

        return false;
    },
};
