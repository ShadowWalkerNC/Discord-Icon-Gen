'use strict';
const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const {
    createGiveaway, setGiveawayMessageId, getGiveaway,
    toggleGiveawayEntry, endGiveaway, getActiveGuildGiveaways,
} = require('../utils/db.js');

const data = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create and manage giveaways')
    .addSubcommand(sub =>
        sub.setName('start')
           .setDescription('Start a new giveaway')
           .addStringOption(o => o.setName('prize').setDescription('What is being given away').setRequired(true))
           .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 1h, 30m, 2d (default 24h)').setRequired(false))
           .addIntegerOption(o => o.setName('winners').setDescription('Number of winners (default 1)').setMinValue(1).setMaxValue(20).setRequired(false))
           .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (defaults to current)').setRequired(false)))
    .addSubcommand(sub =>
        sub.setName('end')
           .setDescription('End a giveaway early and pick winners')
           .addIntegerOption(o => o.setName('id').setDescription('Giveaway ID').setMinValue(1).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('reroll')
           .setDescription('Reroll winners for a finished giveaway')
           .addIntegerOption(o => o.setName('id').setDescription('Giveaway ID').setMinValue(1).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('list')
           .setDescription('List active giveaways in this server'));

function parseDuration(str) {
    const match = str?.match(/^(\d+)(m|h|d)$/i);
    if (!match) return 24 * 60 * 60 * 1000;
    const val  = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === 'm') return val * 60 * 1000;
    if (unit === 'h') return val * 60 * 60 * 1000;
    if (unit === 'd') return val * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
}

function pickWinners(entries, count) {
    const pool = [...entries];
    const chosen = [];
    while (chosen.length < count && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
    }
    return chosen;
}

function buildEmbed(giveaway, ended = false) {
    const endsTs = Math.floor(new Date(giveaway.ends_at).getTime() / 1000);
    const embed  = new EmbedBuilder()
        .setTitle(ended ? `🎁 ENDED — ${giveaway.prize}` : `🎁 GIVEAWAY — ${giveaway.prize}`)
        .setColor(ended ? '#888888' : '#39FF14')
        .addFields(
            { name: 'Winners',  value: String(giveaway.winner_count),             inline: true },
            { name: 'Entries',  value: String(giveaway.entries.length),           inline: true },
            { name: 'Hosted by', value: `<@${giveaway.host_id}>`,                 inline: true },
            { name: ended ? 'Ended' : 'Ends', value: `<t:${endsTs}:R>`,          inline: true },
        )
        .setFooter({ text: `Giveaway ID: ${giveaway.id}` })
        .setTimestamp();

    if (ended && giveaway.winners.length) {
        embed.addFields({ name: 'Winners', value: giveaway.winners.map(id => `<@${id}>`).join(', ') });
    }
    return embed;
}

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
        await interaction.deferReply({ ephemeral: true });
        const prize      = interaction.options.getString('prize').trim();
        const dur        = parseDuration(interaction.options.getString('duration') ?? '');
        const winCount   = interaction.options.getInteger('winners') ?? 1;
        const channel    = interaction.options.getChannel('channel') ?? interaction.channel;
        const endsAt     = new Date(Date.now() + dur).toISOString();

        const result = createGiveaway(interaction.guildId, channel.id, prize, winCount, endsAt, interaction.user.id);
        const gid    = result.lastInsertRowid;
        const ga     = getGiveaway(gid);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway:enter:${gid}`)
                .setLabel('Enter Giveaway')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎁')
        );

        const msg = await channel.send({ embeds: [buildEmbed(ga)], components: [row] });
        setGiveawayMessageId(gid, msg.id);

        await interaction.editReply({ content: `Giveaway #${gid} started in ${channel}!` });
        return;
    }

    if (sub === 'end') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({ content: 'You need Manage Messages permission to end giveaways.' });
        }
        const id = interaction.options.getInteger('id');
        const ga = getGiveaway(id);
        if (!ga || ga.guild_id !== interaction.guildId) {
            return interaction.editReply({ content: `Giveaway #${id} not found.` });
        }
        if (ga.ended) return interaction.editReply({ content: `Giveaway #${id} already ended.` });

        const winners = pickWinners(ga.entries, ga.winner_count);
        endGiveaway(id, winners);
        const updated = getGiveaway(id);

        try {
            const ch  = await interaction.guild.channels.fetch(ga.channel_id);
            const msg = await ch.messages.fetch(ga.message_id);
            await msg.edit({ embeds: [buildEmbed(updated, true)], components: [] });
            if (winners.length) {
                await ch.send({ content: `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${ga.prize}**!` });
            } else {
                await ch.send({ content: `😔 No valid entries for **${ga.prize}**.` });
            }
        } catch { /* message may be deleted */ }

        return interaction.editReply({ content: `Giveaway #${id} ended. Winners: ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'None'}` });
    }

    if (sub === 'reroll') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({ content: 'You need Manage Messages permission to reroll giveaways.' });
        }
        const id = interaction.options.getInteger('id');
        const ga = getGiveaway(id);
        if (!ga || ga.guild_id !== interaction.guildId) {
            return interaction.editReply({ content: `Giveaway #${id} not found.` });
        }
        if (!ga.ended) return interaction.editReply({ content: `Giveaway #${id} has not ended yet. Use \`/giveaway end\` first.` });

        const winners = pickWinners(ga.entries, ga.winner_count);
        endGiveaway(id, winners);

        try {
            const ch = await interaction.guild.channels.fetch(ga.channel_id);
            if (winners.length) {
                await ch.send({ content: `🎉 Reroll! New winners: ${winners.map(id => `<@${id}>`).join(', ')} — **${ga.prize}**` });
            }
        } catch { /* ignore */ }

        return interaction.editReply({ content: `Rerolled. New winners: ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'None'}` });
    }

    if (sub === 'list') {
        await interaction.deferReply({ ephemeral: true });
        const active = getActiveGuildGiveaways(interaction.guildId);
        if (!active.length) return interaction.editReply({ content: 'No active giveaways.' });
        const lines = active.map(ga => `**#${ga.id}** — ${ga.prize} (${ga.winner_count} winner(s), ends <t:${Math.floor(new Date(ga.ends_at).getTime() / 1000)}:R>)`);
        const embed = new EmbedBuilder()
            .setTitle('Active Giveaways')
            .setDescription(lines.join('\n'))
            .setColor('#39FF14');
        return interaction.editReply({ embeds: [embed] });
    }
}

module.exports = { data, execute };
