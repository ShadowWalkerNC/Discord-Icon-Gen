'use strict';
const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits,
} = require('discord.js');
const {
    createTicket, setTicketThreadId, getTicketByThread,
    closeTicket, getGuildTickets, getConfig,
} = require('../utils/db.js');

const data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket system')
    .addSubcommand(sub =>
        sub.setName('open')
           .setDescription('Open a new support ticket')
           .addStringOption(o => o.setName('subject').setDescription('Brief description of your issue').setRequired(false)))
    .addSubcommand(sub =>
        sub.setName('close')
           .setDescription('Close the current ticket')
           .addStringOption(o => o.setName('reason').setDescription('Reason for closing').setRequired(false)))
    .addSubcommand(sub =>
        sub.setName('list')
           .setDescription('List tickets in this server')
           .addStringOption(o =>
               o.setName('status')
                .setDescription('Filter by status')
                .addChoices(
                    { name: 'Open',   value: 'open' },
                    { name: 'Closed', value: 'closed' },
                )
                .setRequired(false)))
    .addSubcommand(sub =>
        sub.setName('config')
           .setDescription('Configure the ticket system')
           .addChannelOption(o => o.setName('category').setDescription('Category for ticket threads').setRequired(false))
           .addRoleOption(o => o.setName('support_role').setDescription('Role that can see all tickets').setRequired(false))
           .addChannelOption(o => o.setName('log_channel').setDescription('Channel to log ticket activity').setRequired(false)));

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'open') {
        await interaction.deferReply({ ephemeral: true });
        const cfg     = getConfig(interaction.guildId);
        const subject = (interaction.options.getString('subject') ?? 'Support request').slice(0, 100);

        const ticket = createTicket(interaction.guildId, interaction.user.id, subject);
        const id     = ticket.lastInsertRowid;

        const threadName = `ticket-${String(id).padStart(4, '0')}-${interaction.user.username}`.slice(0, 100);

        const createOpts = {
            name:                 threadName,
            type:                 ChannelType.PrivateThread,
            invitable:            false,
            reason:               `Ticket #${id} opened by ${interaction.user.tag}`,
        };

        let thread;
        try {
            thread = await interaction.channel.threads.create(createOpts);
        } catch {
            return interaction.editReply({ content: 'Failed to create a ticket thread. Make sure I have permission to create private threads in this channel.' });
        }

        setTicketThreadId(id, thread.id);
        await thread.members.add(interaction.user.id).catch(() => {});

        if (cfg.ticket_support_role) {
            const role = await interaction.guild.roles.fetch(cfg.ticket_support_role).catch(() => null);
            if (role) {
                const members = role.members;
                for (const [, member] of members) {
                    await thread.members.add(member.id).catch(() => {});
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${id}`)
            .setDescription(`**Subject:** ${subject}\n\nDescribe your issue and a staff member will assist you.`)
            .setColor('#39FF14')
            .addFields(
                { name: 'Opened by', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Status',    value: 'Open',                       inline: true },
            )
            .setTimestamp();

        const closeBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket:close:${id}`)
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

        await thread.send({ embeds: [embed], components: [closeBtn] });
        await interaction.editReply({ content: `Your ticket has been opened: ${thread}` });
        return;
    }

    if (sub === 'close') {
        await interaction.deferReply({ ephemeral: true });
        const ticket = getTicketByThread(interaction.channelId);
        if (!ticket) {
            return interaction.editReply({ content: 'This command must be used inside a ticket thread.' });
        }
        if (ticket.status === 'closed') {
            return interaction.editReply({ content: 'This ticket is already closed.' });
        }

        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        closeTicket(ticket.id, reason, interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticket.id} Closed`)
            .setDescription(`**Reason:** ${reason}`)
            .setColor('#888888')
            .addFields({ name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: 'Ticket closed.' });

        setTimeout(async () => {
            await interaction.channel.setArchived(true).catch(() => {});
        }, 5000);

        const cfg = getConfig(interaction.guildId);
        if (cfg.ticket_log_channel) {
            try {
                const logCh = await interaction.guild.channels.fetch(cfg.ticket_log_channel);
                await logCh.send({ embeds: [embed] });
            } catch { /* ignore */ }
        }
        return;
    }

    if (sub === 'list') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({ content: 'You need Manage Messages permission to list tickets.' });
        }
        const status  = interaction.options.getString('status') ?? null;
        const tickets = getGuildTickets(interaction.guildId, status);
        if (!tickets.length) {
            return interaction.editReply({ content: `No ${status ?? ''} tickets found.`.trim() });
        }
        const lines = tickets.slice(0, 25).map(t =>
            `**#${t.id}** — ${t.subject} — ${t.status} — <@${t.user_id}>${
                t.thread_id ? ` — <#${t.thread_id}>` : ''
            }`
        );
        const embed = new EmbedBuilder()
            .setTitle('Tickets')
            .setDescription(lines.join('\n'))
            .setColor('#39FF14')
            .setFooter({ text: tickets.length > 25 ? `Showing 25 of ${tickets.length}` : `${tickets.length} ticket(s)` });
        return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'config') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.editReply({ content: 'You need Manage Server permission to configure tickets.' });
        }
        const { setConfig } = require('../utils/db.js');
        const category    = interaction.options.getChannel('category');
        const supportRole = interaction.options.getRole('support_role');
        const logChannel  = interaction.options.getChannel('log_channel');

        const updates = {};
        if (category)    updates.ticket_category_id  = category.id;
        if (supportRole) updates.ticket_support_role  = supportRole.id;
        if (logChannel)  updates.ticket_log_channel   = logChannel.id;

        if (!Object.keys(updates).length) {
            const cfg = getConfig(interaction.guildId);
            const embed = new EmbedBuilder()
                .setTitle('Ticket Configuration')
                .setColor('#39FF14')
                .addFields(
                    { name: 'Support Role',  value: cfg.ticket_support_role ? `<@&${cfg.ticket_support_role}>` : 'None', inline: true },
                    { name: 'Log Channel',   value: cfg.ticket_log_channel  ? `<#${cfg.ticket_log_channel}>`  : 'None', inline: true },
                );
            return interaction.editReply({ embeds: [embed] });
        }

        setConfig(interaction.guildId, updates);
        return interaction.editReply({ content: 'Ticket configuration updated.' });
    }
}

module.exports = { data, execute };
