const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const { getConfig, setConfig, createTicket, getTicket, getTicketByThread, closeTicket, getGuildTickets } = require('../utils/db.js');
const { sendLog } = require('../utils/logger.js');

module.exports.data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system')
    .addSubcommand(sub => sub
        .setName('open')
        .setDescription('Open a support ticket')
        .addStringOption(opt => opt.setName('reason').setDescription('Brief reason for the ticket').setRequired(false))
    )
    .addSubcommand(sub => sub
        .setName('close')
        .setDescription('Close the current ticket')
        .addStringOption(opt => opt.setName('reason').setDescription('Closing reason').setRequired(false))
    )
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('transcript')
        .setDescription('Save a transcript of the current ticket')
    )
    .addSubcommand(sub => sub
        .setName('panel')
        .setDescription('Post a ticket opening panel to a channel')
        .addChannelOption(opt => opt
            .setName('channel')
            .setDescription('Channel to post the panel in')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(opt => opt.setName('title').setDescription('Panel title').setRequired(false))
        .addStringOption(opt => opt.setName('description').setDescription('Panel description').setRequired(false))
    )
    .addSubcommand(sub => sub
        .setName('setup')
        .setDescription('Configure ticket settings')
        .addChannelOption(opt => opt
            .setName('category')
            .setDescription('Category to create ticket threads under')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addRoleOption(opt => opt.setName('support_role').setDescription('Role that can see all tickets').setRequired(false))
        .addChannelOption(opt => opt
            .setName('log_channel')
            .setDescription('Channel to log ticket openings and closings')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub => sub
        .setName('list')
        .setDescription('List open tickets in this server')
    )
    .setDefaultMemberPermissions(null);

module.exports.execute = async function execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const config  = getConfig(guildId);

    // ── setup ─────────────────────────────────────────────────────────────
    if (sub === 'setup') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
            return interaction.reply({ content: '\u274c You need **Manage Server** to configure tickets.', ephemeral: true });

        const category   = interaction.options.getChannel('category');
        const role       = interaction.options.getRole('support_role');
        const logChannel = interaction.options.getChannel('log_channel');
        const updates    = {};
        if (category)   updates.ticket_category_id  = category.id;
        if (role)       updates.ticket_support_role  = role.id;
        if (logChannel) updates.ticket_log_channel   = logChannel.id;

        if (!Object.keys(updates).length)
            return interaction.reply({ content: '\u274c Provide at least one option to configure.', ephemeral: true });

        setConfig(guildId, updates);
        const lines = [];
        if (category)   lines.push(`Category: <#${category.id}>`);
        if (role)       lines.push(`Support Role: <@&${role.id}>`);
        if (logChannel) lines.push(`Log Channel: <#${logChannel.id}>`);
        return interaction.reply({
            embeds: [new EmbedBuilder().setTitle('\u2705 Ticket Settings Saved').setDescription(lines.join('\n')).setColor('#43B581').setTimestamp()],
            ephemeral: true,
        });
    }

    // ── panel ─────────────────────────────────────────────────────────────
    if (sub === 'panel') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
            return interaction.reply({ content: '\u274c You need **Manage Server** to post a panel.', ephemeral: true });

        const channel     = interaction.options.getChannel('channel');
        const title       = interaction.options.getString('title')       ?? '\ud83c\udfab Support Tickets';
        const description = interaction.options.getString('description') ?? 'Click the button below to open a support ticket. Our team will be with you shortly.';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#5865F2')
            .setFooter({ text: 'Sigil Ticket System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_open').setLabel('\ud83c\udfab Open Ticket').setStyle(ButtonStyle.Primary)
        );

        await channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: `\u2705 Ticket panel posted in <#${channel.id}>.`, ephemeral: true });
    }

    // ── open ──────────────────────────────────────────────────────────────
    if (sub === 'open') {
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        return openTicket(interaction, guildId, config, reason);
    }

    // ── close ─────────────────────────────────────────────────────────────
    if (sub === 'close') {
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const ticket = getTicketByThread(interaction.channelId);
        if (!ticket)
            return interaction.reply({ content: '\u274c This channel is not a ticket thread.', ephemeral: true });
        if (ticket.guild_id !== guildId)
            return interaction.reply({ content: '\u274c Ticket not found in this server.', ephemeral: true });
        const isMod = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
        if (ticket.user_id !== interaction.user.id && !isMod)
            return interaction.reply({ content: '\u274c Only the ticket owner or a moderator can close this ticket.', ephemeral: true });
        return doCloseTicket(interaction, ticket, reason, config);
    }

    // ── add ───────────────────────────────────────────────────────────────
    if (sub === 'add') {
        const ticket = getTicketByThread(interaction.channelId);
        if (!ticket) return interaction.reply({ content: '\u274c This is not a ticket thread.', ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
            return interaction.reply({ content: '\u274c You need **Manage Messages** to add users.', ephemeral: true });
        const user   = interaction.options.getUser('user');
        const thread = interaction.channel;
        await thread.members.add(user.id);
        return interaction.reply({ content: `\u2705 Added <@${user.id}> to this ticket.`, ephemeral: true });
    }

    // ── remove ────────────────────────────────────────────────────────────
    if (sub === 'remove') {
        const ticket = getTicketByThread(interaction.channelId);
        if (!ticket) return interaction.reply({ content: '\u274c This is not a ticket thread.', ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
            return interaction.reply({ content: '\u274c You need **Manage Messages** to remove users.', ephemeral: true });
        const user   = interaction.options.getUser('user');
        const thread = interaction.channel;
        await thread.members.remove(user.id);
        return interaction.reply({ content: `\u2705 Removed <@${user.id}> from this ticket.`, ephemeral: true });
    }

    // ── transcript ────────────────────────────────────────────────────────
    if (sub === 'transcript') {
        const ticket = getTicketByThread(interaction.channelId);
        if (!ticket) return interaction.reply({ content: '\u274c This is not a ticket thread.', ephemeral: true });
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
            return interaction.reply({ content: '\u274c You need **Manage Messages** to save transcripts.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        return sendTranscript(interaction, ticket, interaction.channel);
    }

    // ── list ──────────────────────────────────────────────────────────────
    if (sub === 'list') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages))
            return interaction.reply({ content: '\u274c You need **Manage Messages** to list tickets.', ephemeral: true });
        const tickets = getGuildTickets(guildId, 'open');
        if (!tickets.length)
            return interaction.reply({ content: 'No open tickets in this server.', ephemeral: true });
        const embed = new EmbedBuilder()
            .setTitle('\ud83c\udfab Open Tickets')
            .setColor('#5865F2')
            .setFooter({ text: `${tickets.length} open ticket${tickets.length !== 1 ? 's' : ''}` })
            .setTimestamp();
        for (const t of tickets.slice(0, 10)) {
            embed.addFields({ name: `#${t.id} \u2014 ${t.subject}`, value: `<@${t.user_id}>${t.thread_id ? ` \u2022 <#${t.thread_id}>` : ''}`, inline: false });
        }
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

// ── helpers ───────────────────────────────────────────────────────────────

async function openTicket(interaction, guildId, config, reason) {
    const existing = getGuildTickets(guildId, 'open').find(t => t.user_id === interaction.user.id);
    if (existing)
        return interaction.reply({
            content: `\u274c You already have an open ticket${existing.thread_id ? ` \u2192 <#${existing.thread_id}>` : ''}.`,
            ephemeral: true,
        });

    await interaction.deferReply({ ephemeral: true });

    const subject = reason.slice(0, 100);
    const result  = createTicket(guildId, interaction.user.id, subject);
    const ticketId = result.lastInsertRowid;

    // Find a suitable parent channel for the thread
    let parentChannel = interaction.channel;
    if (config.ticket_category_id) {
        const cat = interaction.guild.channels.cache.get(config.ticket_category_id);
        if (cat) {
            // Find or create a #tickets text channel under the category
            let ch = interaction.guild.channels.cache.find(c => c.parentId === cat.id && c.type === ChannelType.GuildText);
            if (!ch) {
                ch = await interaction.guild.channels.create({
                    name: 'tickets',
                    type: ChannelType.GuildText,
                    parent: cat.id,
                });
            }
            parentChannel = ch;
        }
    }

    const thread = await parentChannel.threads.create({
        name: `ticket-${ticketId}-${interaction.user.username}`,
        type: ChannelType.PrivateThread,
        invitable: false,
        reason: `Ticket #${ticketId} opened by ${interaction.user.tag}`,
    });

    // Store thread ID
    const { setTicketThreadId } = require('../utils/db.js');
    setTicketThreadId(ticketId, thread.id);

    // Add the user
    await thread.members.add(interaction.user.id);

    // Add support role members if configured
    if (config.ticket_support_role) {
        const role = interaction.guild.roles.cache.get(config.ticket_support_role);
        if (role) {
            for (const [, member] of role.members) {
                await thread.members.add(member.id).catch(() => {});
            }
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`\ud83c\udfab Ticket #${ticketId}`)
        .setDescription(`Welcome <@${interaction.user.id}>! Support will be with you shortly.\n\n**Subject:** ${subject}`)
        .setColor('#5865F2')
        .setFooter({ text: 'Use /ticket close to close this ticket' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_close_${ticketId}`).setLabel('\ud83d\udd12 Close Ticket').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`ticket_transcript_${ticketId}`).setLabel('\ud83d\udcdc Transcript').setStyle(ButtonStyle.Secondary)
    );

    await thread.send({ embeds: [embed], components: [row] });

    // Log it
    if (config.ticket_log_channel) {
        const logCh = interaction.guild.channels.cache.get(config.ticket_log_channel);
        if (logCh) {
            await logCh.send({
                embeds: [new EmbedBuilder()
                    .setTitle('\ud83c\udfab Ticket Opened')
                    .addFields(
                        { name: 'User',    value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                        { name: 'Ticket',  value: `<#${thread.id}>`, inline: true },
                        { name: 'Subject', value: subject }
                    )
                    .setColor('#43B581')
                    .setTimestamp()],
            }).catch(() => {});
        }
    }

    return interaction.editReply({ content: `\u2705 Ticket opened \u2192 <#${thread.id}>` });
}

async function doCloseTicket(interaction, ticket, reason, config) {
    await interaction.deferReply({ ephemeral: true });

    const thread = interaction.guild.channels.cache.get(ticket.thread_id);
    closeTicket(ticket.id, reason, interaction.user.id);

    // Send transcript first if thread exists
    if (thread) {
        await sendTranscript(interaction, ticket, thread, true);
        await thread.send({
            embeds: [new EmbedBuilder()
                .setTitle('\ud83d\udd12 Ticket Closed')
                .setDescription(`Closed by <@${interaction.user.id}>\n**Reason:** ${reason}`)
                .setColor('#F04747')
                .setTimestamp()],
        }).catch(() => {});
        await thread.setLocked(true).catch(() => {});
        await thread.setArchived(true).catch(() => {});
    }

    // Log close
    if (config.ticket_log_channel) {
        const logCh = interaction.guild.channels.cache.get(config.ticket_log_channel);
        if (logCh) {
            await logCh.send({
                embeds: [new EmbedBuilder()
                    .setTitle('\ud83d\udd12 Ticket Closed')
                    .addFields(
                        { name: 'Ticket',  value: `#${ticket.id} \u2014 ${ticket.subject}`, inline: true },
                        { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason',  value: reason }
                    )
                    .setColor('#F04747')
                    .setTimestamp()],
            }).catch(() => {});
        }
    }

    return interaction.editReply({ content: `\u2705 Ticket **#${ticket.id}** closed.` });
}

async function sendTranscript(interaction, ticket, thread, silent = false) {
    try {
        const messages = [];
        let lastId;
        while (true) {
            const fetched = await thread.messages.fetch({ limit: 100, before: lastId });
            if (!fetched.size) break;
            messages.push(...fetched.values());
            lastId = fetched.last()?.id;
            if (fetched.size < 100) break;
        }
        messages.reverse();

        const lines = messages
            .filter(m => !m.author.bot || m.embeds.length === 0)
            .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`);

        const transcript = lines.join('\n') || 'No messages found.';
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = { attachment: buffer, name: `ticket-${ticket.id}-transcript.txt` };

        const config = getConfig(thread.guild?.id ?? ticket.guild_id);
        const logCh  = config.ticket_log_channel
            ? thread.guild?.channels.cache.get(config.ticket_log_channel)
            : null;

        const payload = {
            embeds: [new EmbedBuilder()
                .setTitle(`\ud83d\udcdc Transcript \u2014 Ticket #${ticket.id}`)
                .setDescription(`**Subject:** ${ticket.subject}\n**User:** <@${ticket.user_id}>`)
                .setColor('#5865F2')
                .setTimestamp()],
            files: [attachment],
        };

        if (logCh) await logCh.send(payload).catch(() => {});

        // DM user
        try {
            const user = await thread.client.users.fetch(ticket.user_id);
            await user.send(payload);
        } catch {}

        if (!silent) await interaction.editReply({ content: '\u2705 Transcript saved and sent.' });
    } catch (err) {
        console.error('[Ticket] Transcript error:', err.message);
        if (!silent) await interaction.editReply({ content: '\u274c Failed to generate transcript.' });
    }
}

module.exports.openTicket         = openTicket;
module.exports.doCloseTicket      = doCloseTicket;
module.exports.sendTranscript     = sendTranscript;
