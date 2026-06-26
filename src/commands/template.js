'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_template_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('template')
        .setDescription('Apply or save a branding template.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'branding')) {
            return interaction.reply({ content: '📦 The **Branding** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
