'use strict';
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getAutoRoles, addAutoRole, removeAutoRole } = require('../utils/db.js');

const data = new SlashCommandBuilder()
    .setName('levelroles')
    .setDescription('Configure roles awarded when members reach a level')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
        sub.setName('add')
           .setDescription('Award a role when a member reaches a level')
           .addIntegerOption(o => o.setName('level').setDescription('Level that triggers the role').setMinValue(1).setRequired(true))
           .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('remove')
           .setDescription('Remove a level-role reward')
           .addIntegerOption(o => o.setName('level').setDescription('Level of the reward').setMinValue(1).setRequired(true))
           .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('list')
           .setDescription('List all configured level-role rewards'));

async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
        const all = getAutoRoles(interaction.guildId)
            .filter(r => r.trigger.startsWith('level:'))
            .sort((a, b) => {
                const la = parseInt(a.trigger.split(':')[1], 10);
                const lb = parseInt(b.trigger.split(':')[1], 10);
                return la - lb;
            });

        if (!all.length) {
            return interaction.editReply({ content: 'No level-role rewards configured yet. Use `/levelroles add` to set one up.' });
        }

        const lines = all.map(r => {
            const lvl = r.trigger.split(':')[1];
            return `Level **${lvl}** → <@&${r.role_id}>`;
        });

        const embed = new EmbedBuilder()
            .setTitle('Level-Role Rewards')
            .setDescription(lines.join('\n'))
            .setColor('#39FF14')
            .setFooter({ text: `${all.length} reward(s) configured` });

        return interaction.editReply({ embeds: [embed] });
    }

    const level = interaction.options.getInteger('level');
    const role  = interaction.options.getRole('role');
    const key   = `level:${level}`;

    if (sub === 'add') {
        const me = await interaction.guild.members.fetchMe();
        if (role.position >= me.roles.highest.position) {
            return interaction.editReply({ content: `I cannot assign **${role.name}** — it is at or above my highest role.` });
        }
        addAutoRole(interaction.guildId, role.id, key);
        return interaction.editReply({ content: `Done. Members will receive <@&${role.id}> when they reach level **${level}**.` });
    }

    if (sub === 'remove') {
        const changes = removeAutoRole(interaction.guildId, role.id, key);
        if (!changes) {
            return interaction.editReply({ content: `No reward found for <@&${role.id}> at level **${level}**.` });
        }
        return interaction.editReply({ content: `Removed: <@&${role.id}> will no longer be awarded at level **${level}**.` });
    }
}

module.exports = { data, execute };
