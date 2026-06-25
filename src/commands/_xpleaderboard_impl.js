'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getConfig } = require('../utils/db.js');
const { calculateLevel } = require('../utils/xp.js');

const data = new SlashCommandBuilder()
    .setName('xpleaderboard')
    .setDescription('View the XP leaderboard for this server')
    .addIntegerOption(o =>
        o.setName('limit')
         .setDescription('Number of users to show (1–25, default 10)')
         .setMinValue(1)
         .setMaxValue(25)
         .setRequired(false));

async function execute(interaction) {
    await interaction.deferReply();

    const cfg = getConfig(interaction.guildId);
    if (!cfg.xp_enabled) {
        return interaction.editReply({ content: 'The XP system is not enabled on this server.' });
    }

    const limit = interaction.options.getInteger('limit') ?? 10;
    const rows  = getLeaderboard(interaction.guildId, limit);

    if (!rows.length) {
        return interaction.editReply({ content: 'No XP data yet. Members earn XP by chatting.' });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines  = await Promise.all(rows.map(async (row, i) => {
        const lvl    = calculateLevel(row.xp);
        let   name   = `<@${row.user_id}>`;
        try {
            const m = await interaction.guild.members.fetch(row.user_id);
            name = m.displayName;
        } catch { /* user left guild */ }
        const prefix = medals[i] ?? `**${i + 1}.**`;
        return `${prefix} ${name} — Level ${lvl.level}  (${row.xp} XP)`;
    }));

    const embed = new EmbedBuilder()
        .setTitle(`XP Leaderboard — ${interaction.guild.name}`)
        .setDescription(lines.join('\n'))
        .setColor('#39FF14')
        .setFooter({ text: `Top ${rows.length} members` })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

module.exports = { data, execute };
