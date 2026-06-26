'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_profilecard_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profilecard')
        .setDescription('Generate a personal profile card image.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'nitrofree')) {
            return interaction.reply({ content: '📦 The **Nitro-Free** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
