const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const {
    createPoll, setPollMessageId, getPoll, updatePollVotes, closePoll, getActiveGuildPolls,
} = require('../utils/db.js');

const OPTION_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

function parseDuration(s) {
    const match = s.trim().toLowerCase().match(/^(\d+)\s*(m(?:in(?:utes?)?)?|h(?:ours?)?|d(?:ays?)?)$/);
    if (!match) return null;
    const n = parseInt(match[1], 10);
    const unit = match[2][0];
    const ms = unit === 'm' ? n * 60_000 : unit === 'h' ? n * 3_600_000 : n * 86_400_000;
    if (ms < 60_000 || ms > 7 * 86_400_000) return null;
    return ms;
}

function buildPollEmbed(poll, closed = false) {
    const totalVotes = Object.values(poll.votes).reduce((a, v) => a + v.length, 0);
    const endsTs = Math.floor(new Date(poll.ends_at).getTime() / 1000);
    const lines = poll.options.map((opt, i) => {
        const count = (poll.votes[i] ?? []).length;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        return `${OPTION_EMOJIS[i]} **${opt}**\n\`${bar}\` ${count} vote${count !== 1 ? 's' : ''} (${pct}%)`;
    });
    const embed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setDescription(lines.join('\n\n'))
        .setColor(closed ? '#888888' : '#5865F2')
        .setFooter({ text: `Poll ID: ${poll.id} • ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}${closed ? ' — CLOSED' : ''}` });
    if (!closed) embed.addFields({ name: '⏰ Ends', value: `<t:${endsTs}:R>`, inline: true });
    if (closed && totalVotes > 0) {
        const maxVotes = Math.max(...poll.options.map((_, i) => (poll.votes[i] ?? []).length));
        const winners = poll.options.filter((_, i) => (poll.votes[i] ?? []).length === maxVotes);
        embed.addFields({ name: '🏆 Winner', value: winners.map(w => `**${w}**`).join(', '), inline: false });
    }
    return embed;
}

function buildVoteRows(pollId, options, disabled = false) {
    const rows = [];
    for (let i = 0; i < options.length; i += 5) {
        const row = new ActionRowBuilder();
        for (let j = i; j < Math.min(i + 5, options.length); j++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${pollId}_${j}`)
                    .setLabel(`${OPTION_EMOJIS[j]} ${options[j]}`.slice(0, 80))
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled)
            );
        }
        rows.push(row);
    }
    return rows;
}

async function finalizePoll(client, poll) {
    closePoll(poll.id);
    try {
        const channel = await client.channels.fetch(poll.channel_id);
        const message = await channel.messages.fetch(poll.message_id);
        const embed = buildPollEmbed(poll, true);
        const rows = buildVoteRows(poll.id, poll.options, true);
        await message.edit({ embeds: [embed], components: rows });
        await channel.send({
            embeds: [new EmbedBuilder()
                .setTitle('📊 Poll Closed')
                .setDescription(`**${poll.question}** has ended.`)
                .setColor('#43B581')
                .setFooter({ text: `Poll ID: ${poll.id}` })
                .setTimestamp()],
        });
    } catch (err) {
        console.error(`[Poll] Failed to finalize poll #${poll.id}:`, err.message);
    }
}

module.exports.finalizePoll = finalizePoll;

module.exports.data = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create and manage polls')
    .addSubcommand(sub => sub
        .setName('create')
        .setDescription('Create a new poll')
        .addStringOption(opt => opt.setName('question').setDescription('The poll question').setRequired(true))
        .addStringOption(opt => opt.setName('options').setDescription('Options separated by | (e.g. Yes|No|Maybe)').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('How long the poll runs (e.g. 10m, 2h, 1d). Max 7 days.').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('end')
        .setDescription('End an active poll early')
        .addIntegerOption(opt => opt.setName('id').setDescription('Poll ID to end').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('list')
        .setDescription('List all active polls in this server')
    );

module.exports.execute = async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'create') {
        const question = interaction.options.getString('question').trim();
        const optionsRaw = interaction.options.getString('options');
        const durationStr = interaction.options.getString('duration');
        const options = optionsRaw.split('|').map(o => o.trim()).filter(Boolean);
        if (options.length < 2) return interaction.reply({ content: '❌ Please provide at least 2 options separated by `|`.', ephemeral: true });
        if (options.length > 10) return interaction.reply({ content: '❌ Maximum 10 options allowed.', ephemeral: true });
        const durationMs = parseDuration(durationStr);
        if (!durationMs) return interaction.reply({ content: '❌ Invalid duration. Use formats like `10m`, `2h`, `1d`. Min 1 minute, max 7 days.', ephemeral: true });
        const endsAt = new Date(Date.now() + durationMs).toISOString();
        const result = createPoll(guildId, interaction.channel.id, question, options, endsAt, interaction.user.id);
        const pollId = result.lastInsertRowid;
        const poll = { id: pollId, question, options, votes: {}, ends_at: endsAt, closed: 0 };
        const embed = buildPollEmbed(poll);
        const rows = buildVoteRows(pollId, options);
        const msg = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
        setPollMessageId(pollId, msg.id);
        const maxCollectorMs = Math.min(durationMs, 14.5 * 60_000);
        const collector = msg.createMessageComponentCollector({ time: maxCollectorMs });
        collector.on('collect', async btn => {
            if (!btn.customId.startsWith(`poll_vote_${pollId}_`)) return;
            const optIndex = parseInt(btn.customId.split('_').pop(), 10);
            const fresh = getPoll(pollId);
            if (!fresh || fresh.closed) return btn.reply({ content: 'This poll has already closed.', ephemeral: true });
            const votes = fresh.votes;
            for (const key of Object.keys(votes)) votes[key] = votes[key].filter(uid => uid !== btn.user.id);
            if (!votes[optIndex]) votes[optIndex] = [];
            votes[optIndex].push(btn.user.id);
            updatePollVotes(pollId, votes);
            await msg.edit({ embeds: [buildPollEmbed({ ...fresh, votes })], components: rows });
            await btn.reply({ content: `✅ Your vote for **${options[optIndex]}** has been recorded.`, ephemeral: true });
        });
        collector.on('end', async () => {
            const final = getPoll(pollId);
            if (final && !final.closed) await finalizePoll(interaction.client, final);
        });
        return;
    }

    if (sub === 'end') {
        const pollId = interaction.options.getInteger('id');
        const poll = getPoll(pollId);
        if (!poll) return interaction.reply({ content: `❌ No poll found with ID **${pollId}**.`, ephemeral: true });
        if (poll.guild_id !== guildId) return interaction.reply({ content: '❌ That poll does not belong to this server.', ephemeral: true });
        if (poll.closed) return interaction.reply({ content: '❌ That poll is already closed.', ephemeral: true });
        const isMod = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
        if (poll.created_by !== interaction.user.id && !isMod) return interaction.reply({ content: '❌ Only the poll creator or a moderator can end this poll early.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        await finalizePoll(interaction.client, poll);
        return interaction.editReply({ content: `✅ Poll **#${pollId}** has been closed.` });
    }

    if (sub === 'list') {
        const active = getActiveGuildPolls(guildId);
        if (!active.length) return interaction.reply({ content: 'No active polls in this server.', ephemeral: true });
        const embed = new EmbedBuilder()
            .setTitle('📊 Active Polls')
            .setColor('#5865F2')
            .setFooter({ text: `Sigil • ${active.length} active poll${active.length !== 1 ? 's' : ''}` })
            .setTimestamp();
        for (const p of active.slice(0, 10)) {
            const total = Object.values(p.votes).reduce((a, v) => a + v.length, 0);
            const endsTs = Math.floor(new Date(p.ends_at).getTime() / 1000);
            embed.addFields({ name: `#${p.id} — ${p.question}`, value: `${p.options.length} options • ${total} vote${total !== 1 ? 's' : ''} • Ends <t:${endsTs}:R>`, inline: false });
        }
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
