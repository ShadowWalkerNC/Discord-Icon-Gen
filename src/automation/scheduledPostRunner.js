const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getDueScheduledPosts, deleteScheduledPost } = require('../utils/db.js');

/**
 * Checks for due scheduled posts every 30 seconds and fires them.
 * @param {import('discord.js').Client} client
 */
function startScheduledPostRunner(client) {
    async function tick() {
        try {
            const due = getDueScheduledPosts();
            for (const post of due) {
                try {
                    const channel = client.channels.cache.get(post.channel_id);
                    if (!channel) {
                        console.warn(`[scheduler] Channel ${post.channel_id} not found — skipping post ${post.id}`);
                        deleteScheduledPost(post.id);
                        continue;
                    }

                    const { type, content, embed: embedData } = post.payload;

                    if (type === 'message') {
                        await channel.send({ content: content || '\u200b' });
                    } else if (type === 'embed') {
                        const embed = new EmbedBuilder()
                            .setTitle(embedData.title || null)
                            .setDescription(embedData.description || null)
                            .setColor(embedData.color || '#5865F2');
                        if (embedData.image)  embed.setImage(embedData.image);
                        if (embedData.footer) embed.setFooter({ text: embedData.footer });
                        if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
                        if (Array.isArray(embedData.fields)) {
                            for (const f of embedData.fields.slice(0, 25)) {
                                embed.addFields({ name: f.name || '\u200b', value: f.value || '\u200b', inline: !!f.inline });
                            }
                        }
                        await channel.send({ embeds: [embed] });
                    } else {
                        // Fallback — send raw content
                        await channel.send({ content: String(content || '*(empty post)*') });
                    }

                    console.log(`[scheduler] Fired post ${post.id} in #${channel.name} (guild ${post.guild_id})`);
                } catch (err) {
                    console.error(`[scheduler] Failed to fire post ${post.id}:`, err);
                } finally {
                    deleteScheduledPost(post.id);
                }
            }
        } catch (err) {
            console.error('[scheduler] tick error:', err);
        }
    }

    // Run immediately on start, then every 30 s
    tick();
    setInterval(tick, 30_000);
    console.log('[scheduler] Scheduled post runner started (30s interval)');
}

module.exports = { startScheduledPostRunner };
