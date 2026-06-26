'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_texteffect_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('texteffect')
        .setDescription('Apply a text effect to a message image.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'nitrofree')) {
            return interaction.reply({ content: '📦 The **Nitro-Free** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
