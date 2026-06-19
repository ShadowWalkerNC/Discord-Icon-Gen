const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { addScheduledPost, getScheduledPosts, deleteScheduledPost } = require('../utils/db.js');

// Parses natural-sounding time strings into a future Date.
// Accepts:  "in 2 hours", "in 30 minutes", "in 1 day", or ISO/locale date strings.
function parseWhen(str) {
    str = str.trim();

    // "in X unit" pattern
    const relative = str.match(/^in\s+(\d+(?:\.\d+)?)\s*(second|seconds|sec|s|minute|minutes|min|m|hour|hours|h|day|days|d|week|weeks|w)$/i);
    if (relative) {
        const n    = parseFloat(relative[1]);
        const unit = relative[2].toLowerCase();
        const ms   = unit.startsWith('s') ? n * 1000
                   : unit.startsWith('mi') || unit === 'm' ? n * 60_000
                   : unit.startsWith('h')  ? n * 3_600_000
                   : unit.startsWith('d')  ? n * 86_400_000
                   : n * 7 * 86_400_000;
        const d = new Date(Date.now() + ms);
        return isNaN(d) ? null : d;
    }

    // Absolute date string (ISO 8601 or locale)
    const d = new Date(str);
    return isNaN(d) ? null : d;
}

function formatDate(iso) {
    return new Date(iso).toUTCString();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule, remove, or list scheduled posts (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // ── /schedule post ───────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('post')
            .setDescription('Schedule a message or embed to be posted at a specific time')
            .addChannelOption(opt => opt
                .setName('channel')
                .setDescription('Channel to post in')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName('when')
                .setDescription('When to post — e.g. "in 2 hours", "in 30 minutes", or ISO date like "2026-07-01T18:00:00Z"')
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName('message')
                .setDescription('Plain text message to post (use embed options below for rich embeds)')
            )
            .addStringOption(opt => opt
                .setName('embed_title')
                .setDescription('Embed title (triggers embed mode)')
            )
            .addStringOption(opt => opt
                .setName('embed_description')
                .setDescription('Embed description')
            )
            .addStringOption(opt => opt
                .setName('embed_color')
                .setDescription('Embed accent color (hex, e.g. #39FF14)')
            )
            .addStringOption(opt => opt
                .setName('embed_footer')
                .setDescription('Embed footer text')
            )
            .addStringOption(opt => opt
                .setName('embed_image')
                .setDescription('Embed image URL')
            )
        )

        // ── /schedule remove ────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Cancel a scheduled post by its ID')
            .addIntegerOption(opt => opt
                .setName('id')
                .setDescription('The ID shown in /schedule list')
                .setRequired(true)
            )
        )

        // ── /schedule list ───────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('List all upcoming scheduled posts for this server')
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // ── POST ─────────────────────────────────────────────────────────────
        if (sub === 'post') {
            const channel    = interaction.options.getChannel('channel');
            const whenStr    = interaction.options.getString('when');
            const message    = interaction.options.getString('message')    ?? null;
            const embedTitle = interaction.options.getString('embed_title') ?? null;
            const embedDesc  = interaction.options.getString('embed_description') ?? null;
            const embedColor = interaction.options.getString('embed_color') ?? '#5865F2';
            const embedFooter= interaction.options.getString('embed_footer') ?? null;
            const embedImage = interaction.options.getString('embed_image')  ?? null;

            if (!message && !embedTitle && !embedDesc) {
                return interaction.reply({ content: '❌ You must provide a **message** or at least an **embed_title** / **embed_description**.', ephemeral: true });
            }

            const fireAt = parseWhen(whenStr);
            if (!fireAt) {
                return interaction.reply({ content: `❌ Could not parse **"${whenStr}"** as a time. Try \`in 2 hours\`, \`in 30 minutes\`, or an ISO date like \`2026-07-01T18:00:00Z\`.`, ephemeral: true });
            }
            if (fireAt <= new Date()) {
                return interaction.reply({ content: '❌ That time is in the past. Please pick a future time.', ephemeral: true });
            }

            const isEmbed = !!(embedTitle || embedDesc);
            const payload = isEmbed
                ? { type: 'embed',   embed:   { title: embedTitle, description: embedDesc, color: embedColor, footer: embedFooter, image: embedImage } }
                : { type: 'message', content: message };

            const result = addScheduledPost(guildId, channel.id, fireAt.toISOString(), payload);

            const embed = new EmbedBuilder()
                .setTitle('⏰ Post Scheduled')
                .setDescription(
                    `📢 Will post in <#${channel.id}> at **${formatDate(fireAt.toISOString())}**\n` +
                    `🔖 Post ID: \`${result.lastInsertRowid}\`\n` +
                    `📝 Type: **${isEmbed ? 'Embed' : 'Message'}**\n\n` +
                    (isEmbed ? `**${embedTitle || '(no title)'}**\n${embedDesc || ''}` : `> ${message}`)
                )
                .setColor('#39FF14')
                .setFooter({ text: 'Use /schedule remove <id> to cancel' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── REMOVE ───────────────────────────────────────────────────────────
        if (sub === 'remove') {
            const id   = interaction.options.getInteger('id');
            // Verify the post belongs to this guild
            const posts = getScheduledPosts(guildId);
            const match = posts.find(p => p.id === id);
            if (!match) {
                return interaction.reply({ content: `❌ No scheduled post with ID \`${id}\` found for this server.`, ephemeral: true });
            }
            deleteScheduledPost(id);
            const embed = new EmbedBuilder()
                .setTitle('✅ Scheduled Post Cancelled')
                .setDescription(`Post \`#${id}\` (was due **${formatDate(match.post_at)}** in <#${match.channel_id}>) has been removed.`)
                .setColor('#ff4444')
                .setFooter({ text: 'Sigil • schedule remove' });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── LIST ──────────────────────────────────────────────────────────────
        if (sub === 'list') {
            const posts = getScheduledPosts(guildId);
            if (!posts.length) {
                return interaction.reply({ content: '💭 No scheduled posts for this server yet. Use `/schedule post` to create one.', ephemeral: true });
            }

            const lines = posts.slice(0, 20).map(p => {
                const preview = p.payload.type === 'embed'
                    ? `*[embed]* ${p.payload.embed?.title || p.payload.embed?.description?.slice(0, 40) || '(embed)'}`
                    : `${String(p.payload.content || '').slice(0, 60)}`;
                return `\`#${p.id}\` • <#${p.channel_id}> • **${formatDate(p.post_at)}**\n> ${preview}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`📌 Scheduled Posts — ${posts.length} upcoming`)
                .setDescription(lines)
                .setColor('#5865F2')
                .setFooter({ text: `Sigil • schedule list${posts.length > 20 ? ' (showing first 20)' : ''}` });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
