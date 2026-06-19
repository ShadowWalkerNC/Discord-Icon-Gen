const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addScheduledPost, getScheduledPosts, deleteScheduledPost } = require('../utils/db.js');

const PAGE_SIZE = 5;

// ── Time parser ───────────────────────────────────────────────────────────────
/**
 * Parse a human time string into a Date.
 * Supports:
 *   - ISO / standard: "2026-06-20 15:00", "2026-06-20T15:00"
 *   - Relative:       "in 2 hours", "in 30 minutes", "in 1 day"
 *   - Named:          "tomorrow 9am", "tomorrow 14:30"
 *   - Time today:     "15:00", "3pm", "9:30am"
 * Returns null if unparseable.
 */
function parseWhen(input) {
    const s   = input.trim().toLowerCase();
    const now = new Date();

    // in X minutes / hours / days
    const relMatch = s.match(/^in\s+(\d+)\s*(minute|minutes|min|hour|hours|hr|day|days)$/);
    if (relMatch) {
        const n    = parseInt(relMatch[1], 10);
        const unit = relMatch[2];
        const ms   = unit.startsWith('m') ? n * 60_000
                   : unit.startsWith('h') ? n * 3_600_000
                   : n * 86_400_000;
        return new Date(now.getTime() + ms);
    }

    // tomorrow [time]
    if (s.startsWith('tomorrow')) {
        const base = new Date(now);
        base.setDate(base.getDate() + 1);
        const timePart = s.replace('tomorrow', '').trim();
        if (!timePart) { base.setHours(9, 0, 0, 0); return base; }
        return applyTimePart(base, timePart);
    }

    // ISO-ish: 2026-06-20 15:00 or 2026-06-20T15:00
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[t ]?(\d{2}):(\d{2})$/);
    if (isoMatch) {
        return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4]}:${isoMatch[5]}:00`);
    }

    // Time only: 15:00, 3pm, 9:30am
    const base = new Date(now);
    const result = applyTimePart(base, s);
    if (result) {
        if (result <= now) result.setDate(result.getDate() + 1); // assume next occurrence
        return result;
    }

    return null;
}

function applyTimePart(base, s) {
    // HH:MM
    const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) {
        const d = new Date(base);
        d.setHours(parseInt(hhmm[1], 10), parseInt(hhmm[2], 10), 0, 0);
        return d;
    }
    // Npm or N:MMpm
    const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2] ?? '0', 10);
        if (ampm[3] === 'pm' && h < 12) h += 12;
        if (ampm[3] === 'am' && h === 12) h = 0;
        const d = new Date(base);
        d.setHours(h, m, 0, 0);
        return d;
    }
    return null;
}

// ── Embed builder for /schedule list ────────────────────────────────────────────
function buildListEmbed(posts, page, total) {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const embed = new EmbedBuilder()
        .setTitle('🗓️ Scheduled Posts')
        .setColor('#5865F2')
        .setFooter({ text: `Sigil • Page ${page + 1}/${totalPages} • ${total} post${total !== 1 ? 's' : ''} pending` })
        .setTimestamp();

    if (!posts.length) {
        embed.setDescription('No scheduled posts pending.');
    } else {
        for (const p of posts) {
            const ts    = Math.floor(new Date(p.post_at).getTime() / 1000);
            const label = p.payload.title ?? p.payload.text?.slice(0, 40) ?? '(no preview)';
            embed.addFields({
                name:  `ID ${p.id} — <#${p.channel_id}>`,
                value: `**"${label}"**\n⏰ Fires <t:${ts}:R> (<t:${ts}:f>)`,
                inline: false,
            });
        }
    }
    return embed;
}

function buildListRow(page, total) {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`sched_prev_${page}`)
            .setLabel('◀ Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId(`sched_next_${page}`)
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1),
    );
}

// ── Command ────────────────────────────────────────────────────────────────────
module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule messages to post automatically')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(sub => sub
            .setName('post')
            .setDescription('Schedule a message or embed to post later')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').setRequired(true))
            .addStringOption(opt => opt.setName('when').setDescription('When to post — e.g. "in 2 hours", "tomorrow 9am", "2026-06-20 15:00"').setRequired(true))
            .addStringOption(opt => opt.setName('message').setDescription('Message text (used as embed description if title is set)').setRequired(true))
            .addStringOption(opt => opt.setName('title').setDescription('Embed title (omit for plain text post)'))
            .addStringOption(opt => opt.setName('color').setDescription('Embed color hex (default #5865F2)'))
            .addStringOption(opt => opt.setName('image_url').setDescription('Image URL to attach to embed'))
            .addStringOption(opt => opt.setName('footer').setDescription('Embed footer text'))
        )
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('List all pending scheduled posts for this server')
        )
        .addSubcommand(sub => sub
            .setName('cancel')
            .setDescription('Cancel a pending scheduled post by ID')
            .addIntegerOption(opt => opt.setName('id').setDescription('Post ID from /schedule list').setRequired(true))
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // ── POST ───────────────────────────────────────────────────────────
        if (sub === 'post') {
            const channel  = interaction.options.getChannel('channel');
            const whenStr  = interaction.options.getString('when');
            const text     = interaction.options.getString('message');
            const title    = interaction.options.getString('title')    ?? null;
            const color    = interaction.options.getString('color')    ?? null;
            const imageUrl = interaction.options.getString('image_url') ?? null;
            const footer   = interaction.options.getString('footer')   ?? null;

            const postAt = parseWhen(whenStr);
            if (!postAt || isNaN(postAt.getTime())) {
                return interaction.reply({
                    content: [
                        '❌ Could not parse the time. Try one of these formats:',
                        '• `in 2 hours` • `in 30 minutes` • `in 1 day`',
                        '• `tomorrow 9am` • `tomorrow 14:30`',
                        '• `3pm` • `15:00`',
                        '• `2026-06-20 15:00`',
                    ].join('\n'),
                    ephemeral: true,
                });
            }

            if (postAt.getTime() <= Date.now()) {
                return interaction.reply({ content: '❌ That time is in the past.', ephemeral: true });
            }

            if (postAt.getTime() > Date.now() + 365 * 86_400_000) {
                return interaction.reply({ content: '❌ Cannot schedule more than 1 year in advance.', ephemeral: true });
            }

            const result = addScheduledPost(guildId, channel.id, postAt.toISOString(), { text, title, color, imageUrl, footer });
            const ts     = Math.floor(postAt.getTime() / 1000);

            const preview = new EmbedBuilder()
                .setTitle('✅ Post Scheduled')
                .setColor(color ?? '#5865F2')
                .addFields(
                    { name: 'Channel', value: `<#${channel.id}>`,      inline: true  },
                    { name: 'Post ID', value: `${result.lastInsertRowid}`, inline: true },
                    { name: '\u200b',  value: '\u200b',                 inline: true  },
                    { name: 'Fires',   value: `<t:${ts}:R> (<t:${ts}:f>)`, inline: false },
                )
                .setFooter({ text: 'Sigil • /schedule post' })
                .setTimestamp();

            if (title) preview.addFields({ name: 'Embed Title', value: title, inline: false });
            if (text)  preview.addFields({ name: 'Message',     value: text.slice(0, 256) + (text.length > 256 ? '…' : ''), inline: false });

            return interaction.reply({ embeds: [preview], ephemeral: true });
        }

        // ── LIST ───────────────────────────────────────────────────────────
        if (sub === 'list') {
            const all   = getScheduledPosts(guildId);
            const total = all.length;
            const page  = 0;
            const posts = all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

            const embed = buildListEmbed(posts, page, total);
            const row   = buildListRow(page, total);

            const reply = await interaction.reply({
                embeds: [embed],
                components: total > PAGE_SIZE ? [row] : [],
                ephemeral: true,
                fetchReply: true,
            });

            if (total <= PAGE_SIZE) return;

            const collector = reply.createMessageComponentCollector({ time: 120_000 });

            collector.on('collect', async btn => {
                if (btn.user.id !== interaction.user.id) {
                    return btn.reply({ content: 'Only the command user can paginate.', ephemeral: true });
                }
                const parts    = btn.customId.split('_');
                let newPage    = parseInt(parts[parts.length - 1], 10);
                if (btn.customId.startsWith('sched_next')) newPage += 1;
                else newPage -= 1;

                const newPosts = all.slice(newPage * PAGE_SIZE, newPage * PAGE_SIZE + PAGE_SIZE);
                const newEmbed = buildListEmbed(newPosts, newPage, total);
                const newRow   = buildListRow(newPage, total);
                await btn.update({ embeds: [newEmbed], components: [newRow] });
            });

            collector.on('end', async () => {
                try { await reply.edit({ components: [] }); } catch { /* expired */ }
            });

            return;
        }

        // ── CANCEL ──────────────────────────────────────────────────────────
        if (sub === 'cancel') {
            const id   = interaction.options.getInteger('id');
            const all  = getScheduledPosts(guildId);
            const post = all.find(p => p.id === id);

            if (!post) {
                return interaction.reply({ content: `❌ No pending post with ID **${id}** found for this server.`, ephemeral: true });
            }

            deleteScheduledPost(id);

            const ts    = Math.floor(new Date(post.post_at).getTime() / 1000);
            const label = post.payload.title ?? post.payload.text?.slice(0, 40) ?? '(no preview)';

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('✅ Scheduled Post Cancelled')
                    .setDescription(`Post **#${id}** ("${label}") scheduled for <t:${ts}:f> has been cancelled.`)
                    .setColor('#ff4444')
                    .setFooter({ text: 'Sigil • /schedule cancel' })],
                ephemeral: true,
            });
        }
    },
};
