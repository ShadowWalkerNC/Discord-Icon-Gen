'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_brand_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brand')
        .setDescription('Manage and preview your server brand kit.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'branding')) {
            return interaction.reply({ content: '📦 The **Branding** package is not enabled on this server. An admin can enable it via `/sigilconfig packages`.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
