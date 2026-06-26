'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_welcomecard_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomecard')
        .setDescription('Generate a welcome card for new members.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'community')) {
            return interaction.reply({ content: '📦 The **Community** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
