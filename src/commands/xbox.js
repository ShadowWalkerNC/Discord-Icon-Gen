'use strict';
const { SlashCommandBuilder } = require('discord.js');
const path = require('path');

// Lazy-load the xbox service to avoid ES module parse at startup
let _impl = null;
function getImpl() {
    if (!_impl) _impl = require(path.join(__dirname, '..', 'services', 'xbox.js'));
    return _impl;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xbox')
        .setDescription('Look up Xbox achievements and gamertag stats.')
        .addStringOption(o => o.setName('gamertag').setDescription('Xbox gamertag').setRequired(true)),
    async execute(interaction) {
        try {
            const impl = getImpl();
            if (typeof impl.execute === 'function') return impl.execute(interaction);
            await interaction.reply({ content: '❌ Xbox service is not available.', ephemeral: true });
        } catch (err) {
            console.error('[xbox] execute error:', err.message);
            try {
                await interaction.reply({ content: '❌ Xbox service failed to load.', ephemeral: true });
            } catch (_) {}
        }
    },
};
