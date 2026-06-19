const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits,
} = require('discord.js');

// In-memory ticket store: threadId -> { userId, subject, staffRole, opened, guild }
const tickets = new Map();

function buildOpenEmbed(user, subject, staffRole) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Opened')
        .setColor('#5865F2')
        .setTimestamp();

    let desc = `Hey <@${user.id}>, your ticket has been created!\n\n`;
    if (subject) desc += `**Subject:** ${subject}\n\n`;
    desc += 'Please describe your issue in detail and a staff member will be with you shortly.';
    if (staffRole) desc += `\n\n<@&${staffRole}> has been notified.`;

    embed.setDescription(desc);
    embed.setFooter({ text: 'Sigil \u2022 Support Ticket' });
    return embed;
}

function buildCloseEmbed(user, subject, openedAt) {
    const duration = openedAt ? Math.round((Date.now() - openedAt) / 60000) : null;
    return new EmbedBuilder()
        .setTitle('\uD83D\uDD12 Ticket Closed')
        .setColor('#ED4245')
        .setDescription(
            `This ticket has been closed.\n\n` +
            `**Opened by:** <@${user}>\n` +
            (subject ? `**Subject:** ${subject}\n` : '') +
            (duration !== null ? `**Duration:** ${duration} minute${duration !== 1 ? 's' : ''}` : '')
        )
        .setFooter({ text: 'Sigil \u2022 Support Ticket' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Open a private support ticket thread')
        .addStringOption(opt =>
            opt.setName('subject').setDescription('Brief description of your issue').setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('staff').setDescription('Staff role to notify (overrides server default)').setRequired(false)
        ),

    // Also expose a panel command so admins can post a persistent ticket button
    panelData: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Post a persistent ticket panel button in this channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt =>
            opt.setName('title').setDescription('Panel title').setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('description').setDescription('Panel description').setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('staff').setDescription('Default staff role to notify on new tickets').setRequired(false)
        ),

    async execute(interaction) {
        const subject   = interaction.options.getString('subject');
        const staffRole = interaction.options.getRole('staff');
        const guild     = interaction.guild;
        const user      = interaction.user;

        // Check if user already has an open ticket
        const existing = [...tickets.values()].find(
            t => t.userId === user.id && t.guildId === guild.id
        );
        if (existing) {
            return interaction.reply({
                content: `\u274C You already have an open ticket: <#${existing.threadId}>`,
                ephemeral: true,
            });
        }

        // Create private thread in current channel
        let thread;
        try {
            thread = await interaction.channel.threads.create({
                name: `ticket-${user.username}-${Date.now().toString().slice(-4)}`,
                type: ChannelType.PrivateThread,
                invitable: false,
                reason: `Support ticket for ${user.tag}`,
            });
        } catch (err) {
            console.error('[Ticket] Failed to create thread:', err.message);
            return interaction.reply({
                content: '\u274C Could not create a ticket thread. Make sure I have the **Create Private Threads** permission.',
                ephemeral: true,
            });
        }

        // Add the user to the thread
        await thread.members.add(user.id).catch(() => {});

        // Build open embed + close button
        const embed = buildOpenEmbed(user, subject, staffRole?.id);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_close_${thread.id}`)
                .setLabel('\uD83D\uDD12 Close Ticket')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`ticket_transcript_${thread.id}`)
                .setLabel('\uD83D\uDCCB Save Transcript')
                .setStyle(ButtonStyle.Secondary),
        );

        const content = staffRole ? `<@&${staffRole.id}>` : undefined;
        await thread.send({ content, embeds: [embed], components: [row] });

        tickets.set(thread.id, {
            threadId: thread.id,
            userId: user.id,
            guildId: guild.id,
            subject,
            staffRoleId: staffRole?.id ?? null,
            opened: Date.now(),
        });

        await interaction.reply({
            content: `\u2705 Your ticket has been created: <#${thread.id}>`,
            ephemeral: true,
        });
    },

    async executePanelCommand(interaction) {
        const title       = interaction.options.getString('title') ?? 'Support Tickets';
        const description = interaction.options.getString('description') ?? 'Click the button below to open a private support ticket. A staff member will assist you shortly.';
        const staffRole   = interaction.options.getRole('staff');

        const embed = new EmbedBuilder()
            .setTitle(`\uD83C\uDFAB ${title}`)
            .setDescription(description)
            .setColor('#5865F2')
            .setFooter({ text: 'Sigil \u2022 Support' })
            .setTimestamp();

        // Encode optional staffRoleId into customId
        const roleSegment = staffRole ? staffRole.id : 'none';
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_open_${roleSegment}`)
                .setLabel('\uD83C\uDFAB Open a Ticket')
                .setStyle(ButtonStyle.Primary),
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '\u2705 Ticket panel posted.', ephemeral: true });
    },

    async handleButton(interaction) {
        const id = interaction.customId;
        if (!id.startsWith('ticket_')) return false;

        const parts  = id.split('_');
        const action = parts[1]; // open | close | transcript

        // ── Panel open button ─────────────────────────────────────
        if (action === 'open') {
            const staffRoleId = parts[2] !== 'none' ? parts[2] : null;
            const guild = interaction.guild;
            const user  = interaction.user;

            const existing = [...tickets.values()].find(
                t => t.userId === user.id && t.guildId === guild.id
            );
            if (existing) {
                return interaction.reply({
                    content: `\u274C You already have an open ticket: <#${existing.threadId}>`,
                    ephemeral: true,
                });
            }

            let thread;
            try {
                thread = await interaction.channel.threads.create({
                    name: `ticket-${user.username}-${Date.now().toString().slice(-4)}`,
                    type: ChannelType.PrivateThread,
                    invitable: false,
                    reason: `Support ticket for ${user.tag}`,
                });
            } catch (err) {
                console.error('[Ticket] Panel open failed:', err.message);
                return interaction.reply({
                    content: '\u274C Could not create a ticket thread. Check my permissions.',
                    ephemeral: true,
                });
            }

            await thread.members.add(user.id).catch(() => {});

            const embed = buildOpenEmbed(user, null, staffRoleId);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${thread.id}`)
                    .setLabel('\uD83D\uDD12 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_transcript_${thread.id}`)
                    .setLabel('\uD83D\uDCCB Save Transcript')
                    .setStyle(ButtonStyle.Secondary),
            );

            const content = staffRoleId ? `<@&${staffRoleId}>` : undefined;
            await thread.send({ content, embeds: [embed], components: [row] });

            tickets.set(thread.id, {
                threadId: thread.id,
                userId: user.id,
                guildId: guild.id,
                subject: null,
                staffRoleId,
                opened: Date.now(),
            });

            return interaction.reply({
                content: `\u2705 Your ticket has been created: <#${thread.id}>`,
                ephemeral: true,
            });
        }

        // ── Close button ─────────────────────────────────────────
        if (action === 'close') {
            const threadId = parts.slice(2).join('_');
            const data     = tickets.get(threadId);
            const thread   = interaction.channel;
            const userId   = interaction.user.id;

            const isOwner = data?.userId === userId;
            const isMod   = interaction.memberPermissions?.has('ManageThreads');

            if (!isOwner && !isMod) {
                return interaction.reply({
                    content: '\u274C Only the ticket owner or a staff member can close this ticket.',
                    ephemeral: true,
                });
            }

            const closeEmbed = buildCloseEmbed(
                data?.userId ?? userId,
                data?.subject,
                data?.opened
            );

            await interaction.update({
                embeds: [closeEmbed],
                components: [], // remove buttons
            });

            // Archive and lock the thread after a short delay
            setTimeout(async () => {
                await thread.setArchived(true).catch(() => {});
                await thread.setLocked(true).catch(() => {});
            }, 5000);

            tickets.delete(threadId);
            return true;
        }

        // ── Transcript button ─────────────────────────────────────
        if (action === 'transcript') {
            const threadId = parts.slice(2).join('_');
            const thread   = interaction.channel;

            const isMod = interaction.memberPermissions?.has('ManageThreads');
            const data  = tickets.get(threadId);
            const isOwner = data?.userId === interaction.user.id;

            if (!isOwner && !isMod) {
                return interaction.reply({
                    content: '\u274C Only the ticket owner or a staff member can save the transcript.',
                    ephemeral: true,
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Fetch up to 100 messages
            let messages;
            try {
                messages = await thread.messages.fetch({ limit: 100 });
            } catch (err) {
                return interaction.editReply({ content: '\u274C Failed to fetch messages.' });
            }

            const lines = [...messages.values()]
                .reverse()
                .map(m => {
                    const ts = new Date(m.createdTimestamp).toISOString();
                    const content = m.content || (m.embeds.length ? '[Embed]' : '[Attachment]');
                    return `[${ts}] ${m.author.tag}: ${content}`;
                })
                .join('\n');

            const buffer = Buffer.from(lines, 'utf8');
            await interaction.editReply({
                content: '\uD83D\uDCCB Transcript saved:',
                files: [{ attachment: buffer, name: `transcript-${threadId.slice(-6)}.txt` }],
            });
            return true;
        }

        return false;
    },
};
