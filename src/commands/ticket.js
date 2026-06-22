'use strict';

const guard = require('../utils/packageGuard');

// _ticket_impl.js is optional — full ticket system lives there when installed.
// Falls back to a stub command if the impl file isn't present.
const impl = (() => { try { return require('./_ticket_impl'); } catch { return null; } })();

if (impl) {
    module.exports = {
        data: impl.data,
        async autocomplete(i) { return impl.autocomplete?.(i); },
        async execute(i) {
            if (await guard(i, 'tickets')) return;
            return impl.execute(i);
        },
    };
} else {
    const { SlashCommandBuilder } = require('discord.js');
    module.exports = {
        data: new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Open a support ticket'),
        async execute(interaction) {
            if (await guard(interaction, 'tickets')) return;
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: '🎟️ Ticket system is initializing. Please try again in a moment.' });
        },
    };
}
