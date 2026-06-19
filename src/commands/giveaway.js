const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require('discord.js');
const {
    createGiveaway,
    setGiveawayMessageId,
    getGiveaway,
    getActiveGuildGiveaways,
    toggleGiveawayEntry,
    endGiveaway,
} = require('../utils/db.js');

function parseDuration(s) {
    const match = s.trim().toLowerCase().match(/^(\d+)\s*(m(?:in(?:utes?)?)?|h(?:ours?)?|d(?:ays?)?)$/);
    if (!match) return null;
    const n = parseInt(match[1], 10);
    const unit = match[2][0];
    const ms = unit === 'm' ? n * 60_000 : unit === 'h' ? n * 3_600_000 : n * 86_400_000;
    if (ms < 60_000 || ms > 30 * 86_400_000) return null;
    return ms;
}

function pickWinners(entries, winnerCount, excluded = []) {
    const pool = entries.filter(id => !excluded.includes(id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(winnerCount, shuffled.length));
}

function buildGiveawayEmbed(giveaway, ended = false) {
    const endsTs = Math.floor(new Date(giveaway.ends_at).getTime() / 1000);
    const entries = giveaway.entries?.length ?? 0;
    const winners = giveaway.winners?.length ?? 0;

    const embed = new EmbedBuilder()
        .setTitle(`🎉 Giveaway: ${giveaway.prize}`)
        .setColor(ended ? '#888888' : '#F5A623')
        .addFields(
            { name: '🏆 Winners', value: `${giveaway.winner_count}`, inline: true },
            { name: '👥 Entries', value: `${entries}`, inline: true },
            { name: '🎙️ Host', value: `<@${giveaway.host_id}>`, inline: true },
        )
        .setFooter({
            text: ended
                ? `Giveaway ID: ${giveaway.id} • ENDED • ${winners} winner${winners !== 1 ? 's' : ''}`
                : `Giveaway ID: ${giveaway.id} • Click the button to enter`,
        })
        .setTimestamp();

    if (ended) {
        embed.setDescription(
            giveaway.winners?.length
                ? `**Winners:** ${giveaway.winners.map(id => `<@${id}>`).join(', ')}`
                : '*No valid entries. No winners could be chosen.*'
        );
    } else {
        embed.setDescription(`Ends <t:${endsTs}:R>\n\nClick **🎉 Enter Giveaway** below to join.`);
    }

    return embed;
}

function buildGiveawayRows(giveawayId, disabled = false) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_enter_${giveawayId}`)
                .setLabel('🎉 Enter Giveaway')
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled)
        ),
    ];
}

async function finalizeGiveaway(client, giveaway, reroll = false) {
    const excluded = reroll ? (giveaway.winners ?? []) : [];
    const winners = pickWinners(giveaway.entries ?? [], giveaway.winner_count, excluded);

    if (!reroll) {
        endGiveaway(giveaway.id, winners);
    }

    try {
        const channel = await client.channels.fetch(giveaway.channel_id);
        const message = await channel.messages.fetch(giveaway.message_id);

        const finalState = {
            ...giveaway,
            ended: 1,
            winners: reroll ? winners : winners,
        };

        if (!reroll) {
            await message.edit({
                embeds: [buildGiveawayEmbed(finalState, true)],
                components: buildGiveawayRows(giveaway.id, true),
            });
        }

        if (winners.length) {
            await channel.send({
                content: reroll
                    ? `🔄 **Giveaway Reroll:** ${winners.map(id => `<@${id}>`).join(', ')} won **${giveaway.prize}**!`
                    : `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`,
            });
        } else {
            await channel.send({
                content: reroll
                    ? `🔄 Giveaway reroll for **${giveaway.prize}** found no eligible entries.`
                    : `No valid entries for giveaway **${giveaway.prize}**.`,
            });
        }
    } catch (err) {
        console.error(`[Giveaway] Failed to finalize giveaway #${giveaway.id}:`, err.message);
    }

    return winners;
}

module.exports.finalizeGiveaway = finalizeGiveaway;

module.exports.data = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start and manage giveaways')
    .addSubcommand(sub => sub
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(opt => opt.setName('prize').setDescription('Prize name').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('e.g. 10m, 2h, 1d').setRequired(true))
        .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand(sub => sub
        .setName('end')
        .setDescription('End an active giveaway early')
        .addIntegerOption(opt => opt.setName('id').setDescription('Giveaway ID').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('reroll')
        .setDescription('Reroll a finished giveaway')
        .addIntegerOption(opt => opt.setName('id').setDescription('Giveaway ID').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('list')
        .setDescription('List active giveaways in this server')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

module.exports.execute = async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'start') {
        const prize = interaction.options.getString('prize').trim();
        const durationStr = interaction.options.getString('duration');
        const winnerCount = interaction.options.getInteger('winners');
        const durationMs = parseDuration(durationStr);

        if (!durationMs) {
            return interaction.reply({
                content: '❌ Invalid duration. Use formats like `10m`, `2h`, `1d`. Min 1 minute, max 30 days.',
                ephemeral: true,
            });
        }

        const endsAt = new Date(Date.now() + durationMs).toISOString();
        const result = createGiveaway(guildId, interaction.channel.id, prize, winnerCount, endsAt, interaction.user.id);
        const giveawayId = result.lastInsertRowid;
        const giveaway = {
            id: giveawayId,
            guild_id: guildId,
            channel_id: interaction.channel.id,
            prize,
            winner_count: winnerCount,
            ends_at: endsAt,
            host_id: interaction.user.id,
            entries: [],
            winners: [],
            ended: 0,
        };

        const msg = await interaction.reply({
            embeds: [buildGiveawayEmbed(giveaway, false)],
            components: buildGiveawayRows(giveawayId, false),
            fetchReply: true,
        });

        setGiveawayMessageId(giveawayId, msg.id);

        const maxCollectorMs = Math.min(durationMs, 14.5 * 60_000);
        const collector = msg.createMessageComponentCollector({ time: maxCollectorMs });

        collector.on('collect', async btn => {
            if (btn.customId !== `giveaway_enter_${giveawayId}`) return;
            const fresh = getGiveaway(giveawayId);
            if (!fresh || fresh.ended) {
                return btn.reply({ content: 'This giveaway has already ended.', ephemeral: true });
            }

            const entered = toggleGiveawayEntry(giveawayId, btn.user.id);
            const updated = getGiveaway(giveawayId);
            await msg.edit({
                embeds: [buildGiveawayEmbed(updated, false)],
                components: buildGiveawayRows(giveawayId, false),
            });

            return btn.reply({
                content: entered
                    ? `✅ You entered **${fresh.prize}**.`
                    : `↩️ You left **${fresh.prize}**.`,
                ephemeral: true,
            });
        });

        collector.on('end', async () => {
            const final = getGiveaway(giveawayId);
            if (final && !final.ended) await finalizeGiveaway(interaction.client, final);
        });

        return;
    }

    if (sub === 'end') {
        const id = interaction.options.getInteger('id');
        const giveaway = getGiveaway(id);
        if (!giveaway) return interaction.reply({ content: `❌ No giveaway found with ID **${id}**.`, ephemeral: true });
        if (giveaway.guild_id !== guildId) return interaction.reply({ content: '❌ That giveaway does not belong to this server.', ephemeral: true });
        if (giveaway.ended) return interaction.reply({ content: '❌ That giveaway has already ended.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        await finalizeGiveaway(interaction.client, giveaway);
        return interaction.editReply({ content: `✅ Giveaway **#${id}** has been ended.` });
    }

    if (sub === 'reroll') {
        const id = interaction.options.getInteger('id');
        const giveaway = getGiveaway(id);
        if (!giveaway) return interaction.reply({ content: `❌ No giveaway found with ID **${id}**.`, ephemeral: true });
        if (giveaway.guild_id !== guildId) return interaction.reply({ content: '❌ That giveaway does not belong to this server.', ephemeral: true });
        if (!giveaway.ended) return interaction.reply({ content: '❌ That giveaway is still active.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        const winners = await finalizeGiveaway(interaction.client, giveaway, true);
        return interaction.editReply({
            content: winners.length
                ? `✅ Rerolled giveaway **#${id}**.`
                : `⚠️ No eligible reroll entries for giveaway **#${id}**.`,
        });
    }

    if (sub === 'list') {
        const active = getActiveGuildGiveaways(guildId);
        if (!active.length) return interaction.reply({ content: 'No active giveaways in this server.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('🎉 Active Giveaways')
            .setColor('#F5A623')
            .setFooter({ text: `Sigil • ${active.length} active giveaway${active.length !== 1 ? 's' : ''}` })
            .setTimestamp();

        for (const g of active.slice(0, 10)) {
            const endsTs = Math.floor(new Date(g.ends_at).getTime() / 1000);
            embed.addFields({
                name: `#${g.id} — ${g.prize}`,
                value: `${g.entries.length} entries • ${g.winner_count} winner${g.winner_count !== 1 ? 's' : ''} • Ends <t:${endsTs}:R>`,
                inline: false,
            });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
