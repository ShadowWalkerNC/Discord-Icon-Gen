'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getXP, getUserRank, getConfig } = require('../utils/db.js');
const { calculateLevel } = require('../utils/xp.js');

const data = new SlashCommandBuilder()
    .setName('xprank')
    .setDescription('View your XP rank on this server')
    .addUserOption(o =>
        o.setName('user')
         .setDescription('User to look up (defaults to yourself)')
         .setRequired(false));

async function execute(interaction) {
    await interaction.deferReply();

    const cfg = getConfig(interaction.guildId);
    if (!cfg.xp_enabled) {
        return interaction.editReply({ content: 'The XP system is not enabled on this server.' });
    }

    const target = interaction.options.getUser('user') ?? interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const row    = getXP(interaction.guildId, target.id);
    const rank   = getUserRank(interaction.guildId, target.id);
    const lvl    = calculateLevel(row.xp);

    const pct  = lvl.requiredXp > 0 ? Math.floor((lvl.currentXp / lvl.requiredXp) * 100) : 0;
    const bar  = buildBar(pct);

    const embed = new EmbedBuilder()
        .setTitle(`XP Rank — ${member?.displayName ?? target.username}`)
        .setThumbnail(target.displayAvatarURL({ extension: 'png', size: 128 }))
        .setColor('#39FF14')
        .addFields(
            { name: 'Rank',        value: `#${rank}`,               inline: true },
            { name: 'Level',       value: String(lvl.level),        inline: true },
            { name: 'Total XP',    value: String(row.xp),           inline: true },
            { name: 'Progress',    value: `${lvl.currentXp} / ${lvl.requiredXp} XP  (${pct}%)\n${bar}`, inline: false },
        )
        .setFooter({ text: 'Sigil XP' })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

function buildBar(pct, len = 20) {
    const filled = Math.round((pct / 100) * len);
    return '█'.repeat(filled) + '░'.repeat(len - filled);
}

module.exports = { data, execute };
