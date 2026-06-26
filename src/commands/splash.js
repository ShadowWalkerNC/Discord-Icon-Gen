'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_splash_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('splash')
        .setDescription('Generate a server splash screen.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'nitrofree')) {
            return interaction.reply({ content: '📦 The **Nitro-Free** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
