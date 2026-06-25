'use strict';
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getXP, setXP, getConfig, setConfig } = require('../utils/db.js');
const { calculateLevel } = require('../utils/xp.js');

const data = new SlashCommandBuilder()
    .setName('xpadmin')
    .setDescription('Admin XP management commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('set')
           .setDescription('Set a user's XP to a specific value')
           .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
           .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setMinValue(0).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('add')
           .setDescription('Add XP to a user')
           .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
           .addIntegerOption(o => o.setName('amount').setDescription('XP to add').setMinValue(1).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('remove')
           .setDescription('Remove XP from a user')
           .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
           .addIntegerOption(o => o.setName('amount').setDescription('XP to remove').setMinValue(1).setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('reset')
           .setDescription('Reset a user's XP to zero')
           .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('config')
           .setDescription('Configure the XP system')
           .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable XP earning').setRequired(false))
           .addIntegerOption(o => o.setName('rate').setDescription('Base XP per message (default 15)').setMinValue(1).setMaxValue(500).setRequired(false))
           .addIntegerOption(o => o.setName('cooldown').setDescription('Cooldown between XP grants in seconds (default 60)').setMinValue(5).setMaxValue(3600).setRequired(false))
           .addChannelOption(o => o.setName('channel').setDescription('Channel to post level-up notifications').setRequired(false)));

async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'config') {
        const enabled  = interaction.options.getBoolean('enabled');
        const rate     = interaction.options.getInteger('rate');
        const cooldown = interaction.options.getInteger('cooldown');
        const channel  = interaction.options.getChannel('channel');

        const updates = {};
        if (enabled  !== null) updates.xp_enabled  = enabled ? 1 : 0;
        if (rate     !== null) updates.xp_rate     = rate;
        if (cooldown !== null) updates.xp_cooldown = cooldown;
        if (channel  !== null) updates.xp_channel  = channel.id;

        if (!Object.keys(updates).length) {
            const cfg = getConfig(interaction.guildId);
            const embed = new EmbedBuilder()
                .setTitle('XP Configuration')
                .setColor('#39FF14')
                .addFields(
                    { name: 'Enabled',   value: cfg.xp_enabled ? 'Yes' : 'No',          inline: true },
                    { name: 'Rate',      value: String(cfg.xp_rate ?? 15),               inline: true },
                    { name: 'Cooldown',  value: `${cfg.xp_cooldown ?? 60}s`,             inline: true },
                    { name: 'Channel',   value: cfg.xp_channel ? `<#${cfg.xp_channel}>` : 'None', inline: true },
                );
            return interaction.editReply({ embeds: [embed] });
        }

        setConfig(interaction.guildId, updates);
        return interaction.editReply({ content: 'XP configuration updated.' });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount') ?? 0;
    const row    = getXP(interaction.guildId, target.id);

    let newXp;
    if (sub === 'set')    newXp = amount;
    if (sub === 'add')    newXp = row.xp + amount;
    if (sub === 'remove') newXp = Math.max(0, row.xp - amount);
    if (sub === 'reset')  newXp = 0;

    const lvl = calculateLevel(newXp);
    setXP(interaction.guildId, target.id, newXp, lvl.level);

    const embed = new EmbedBuilder()
        .setTitle('XP Updated')
        .setColor('#39FF14')
        .addFields(
            { name: 'User',      value: `<@${target.id}>`, inline: true },
            { name: 'Action',    value: sub.charAt(0).toUpperCase() + sub.slice(1), inline: true },
            { name: 'New XP',    value: String(newXp),     inline: true },
            { name: 'New Level', value: String(lvl.level), inline: true },
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

module.exports = { data, execute };
