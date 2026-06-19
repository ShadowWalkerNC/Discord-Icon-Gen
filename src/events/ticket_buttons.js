const { Events } = require('discord.js');
const { getTicket, getTicketByThread, getConfig } = require('../utils/db.js');
const { openTicket, doCloseTicket, sendTranscript } = require('../commands/ticket.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        const { customId } = interaction;

        // Open ticket from panel button
        if (customId === 'ticket_open') {
            const config = getConfig(interaction.guild.id);
            return openTicket(interaction, interaction.guild.id, config, 'Support request');
        }

        // Close ticket button: ticket_close_<id>
        if (customId.startsWith('ticket_close_')) {
            const ticketId = parseInt(customId.split('_')[2], 10);
            const ticket   = getTicket(ticketId);
            if (!ticket || ticket.status !== 'open')
                return interaction.reply({ content: '\u274c This ticket is already closed.', ephemeral: true });
            const config = getConfig(interaction.guild.id);
            return doCloseTicket(interaction, ticket, 'Closed via button', config);
        }

        // Transcript button: ticket_transcript_<id>
        if (customId.startsWith('ticket_transcript_')) {
            const ticketId = parseInt(customId.split('_')[2], 10);
            const ticket   = getTicket(ticketId);
            if (!ticket)
                return interaction.reply({ content: '\u274c Ticket not found.', ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            return sendTranscript(interaction, ticket, interaction.channel);
        }
    },
};
