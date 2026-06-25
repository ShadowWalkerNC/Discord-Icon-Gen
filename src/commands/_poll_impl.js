'use strict';
const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const {
    createPoll, setPollMessageId, getPollByMessageId,
    updatePollVotes, closePoll, getActiveGuildPolls,
} = require('../utils/db.js');

const data = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create and manage polls')
    .addSubcommand(sub =>
        sub.setName('create')
           .setDescription('Create a new poll')
           .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
           .addStringOption(o => o.setName('options').setDescription('Comma-separated options (2–10)').setRequired(true))
           .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 1h, 30m, 2d (default 24h)').setRequired(false))
           .addChannelOption(o => o.setName('channel').setDescription('Channel to post the poll in (defaults to current)').setRequired(false)))
    .addSubcommand(sub =>
        sub.setName('end')
           .setDescription('End an active poll early')
           .addIntegerOption(o => o.setName('id').setDescription('Poll ID').setMinValue(1).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('list')
           .setDescription('List active polls in this server'));

function parseDuration(str) {
    const match = str?.match(/^(\d+)(m|h|d)$/i);
    if (!match) return 24 * 60 * 60 * 1000;
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === 'm') return val * 60 * 1000;
    if (unit === 'h') return val * 60 * 60 * 1000;
    if (unit === 'd') return val * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
}

function buildPollEmbed(question, options, votes, closed) {
    const totalVotes = Object.values(votes).flat().length;
    const lines = options.map((opt, i) => {
        const count  = (votes[String(i)] ?? []).length;
        const pct    = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
        const bar    = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        return `**${i + 1}. ${opt}**\n${bar} ${count} vote(s) (${pct}%)`;
    });
    return new EmbedBuilder()
        .setTitle(closed ? `[CLOSED] ${question}` : question)
        .setDescription(lines.join('\n\n'))
        .setColor(closed ? '#888888' : '#39FF14')
        .setFooter({ text: `${totalVotes} total vote(s)${closed ? ' • Poll ended' : ''}` })
        .setTimestamp();
}

function buildPollButtons(options, pollId, disabled = false) {
    const rows = [];
    for (let i = 0; i < Math.min(options.length, 10); i += 5) {
        const row = new ActionRowBuilder();
        options.slice(i, i + 5).forEach((opt, j) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll:${pollId}:${i + j}`)
                    .setLabel(opt.slice(0, 80))
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled)
            );
        });
        rows.push(row);
    }
    return rows;
}

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
        await interaction.deferReply({ ephemeral: true });

        const question = interaction.options.getString('question').trim();
        const rawOpts  = interaction.options.getString('options').split(',').map(s => s.trim()).filter(Boolean);
        if (rawOpts.length < 2 || rawOpts.length > 10) {
            return interaction.editReply({ content: 'Please provide between 2 and 10 comma-separated options.' });
        }

        const dur      = parseDuration(interaction.options.getString('duration') ?? '');
        const endsAt   = new Date(Date.now() + dur).toISOString();
        const channel  = interaction.options.getChannel('channel') ?? interaction.channel;

        const result = createPoll(interaction.guildId, channel.id, question, rawOpts, endsAt, interaction.user.id);
        const pollId = result.lastInsertRowid;

        const embed   = buildPollEmbed(question, rawOpts, {}, false);
        const buttons = buildPollButtons(rawOpts, pollId);

        const msg = await channel.send({ embeds: [embed], components: buttons });
        setPollMessageId(pollId, msg.id);

        await interaction.editReply({ content: `Poll #${pollId} posted in ${channel}.` });
        return;
    }

    if (sub === 'end') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({ content: 'You need Manage Messages permission to end polls.' });
        }
        const { getPoll } = require('../utils/db.js');
        const id   = interaction.options.getInteger('id');
        const poll = getPoll(id);
        if (!poll || poll.guild_id !== interaction.guildId) {
            return interaction.editReply({ content: `Poll #${id} not found in this server.` });
        }
        if (poll.closed) return interaction.editReply({ content: `Poll #${id} is already closed.` });

        closePoll(id);
        try {
            const ch  = await interaction.guild.channels.fetch(poll.channel_id);
            const msg = await ch.messages.fetch(poll.message_id);
            await msg.edit({
                embeds:     [buildPollEmbed(poll.question, poll.options, poll.votes, true)],
                components: buildPollButtons(poll.options, id, true),
            });
        } catch { /* message may be deleted */ }
        return interaction.editReply({ content: `Poll #${id} has been closed.` });
    }

    if (sub === 'list') {
        await interaction.deferReply({ ephemeral: true });
        const active = getActiveGuildPolls(interaction.guildId);
        if (!active.length) return interaction.editReply({ content: 'No active polls.' });
        const lines = active.map(p => `**#${p.id}** — ${p.question} (ends <t:${Math.floor(new Date(p.ends_at).getTime() / 1000)}:R>)`);
        const embed = new EmbedBuilder()
            .setTitle('Active Polls')
            .setDescription(lines.join('\n'))
            .setColor('#39FF14');
        return interaction.editReply({ embeds: [embed] });
    }
}

module.exports = { data, execute };
