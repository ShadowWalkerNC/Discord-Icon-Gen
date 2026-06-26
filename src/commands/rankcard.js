'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_rankcard_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankcard')
        .setDescription('Generate a rank card for a member.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'community')) {
            return interaction.reply({ content: '📦 The **Community** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
