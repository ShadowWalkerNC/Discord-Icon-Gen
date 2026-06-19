/**
 * Scheduled post runner.
 * Fires every 60s, flushes all due posts, deletes them after send.
 * Called once in index.js client.once('ready').
 */
const { EmbedBuilder } = require('discord.js');
const { getDueScheduledPosts, deleteScheduledPost } = require('../utils/db.js');

async function runScheduler(client) {
    const due = getDueScheduledPosts();
    if (!due.length) return;

    for (const post of due) {
        // Always delete first — even if send fails, prevent infinite retry
        deleteScheduledPost(post.id);

        try {
            const channel = await client.channels.fetch(post.channel_id);
            if (!channel?.isTextBased()) continue;

            const { text, title, color, imageUrl, footer } = post.payload;

            // Build embed if any embed fields present
            let embed = null;
            if (title || color || imageUrl) {
                embed = new EmbedBuilder()
                    .setColor(color ?? '#5865F2')
                    .setTimestamp();
                if (title)    embed.setTitle(title);
                if (text)     embed.setDescription(text);
                if (imageUrl) embed.setImage(imageUrl);
                if (footer)   embed.setFooter({ text: footer });
                else          embed.setFooter({ text: 'Sigil Scheduled Post' });
            }

            await channel.send({
                content: embed ? undefined : (text ?? '\u200b'),
                embeds:  embed ? [embed] : [],
            });
        } catch (err) {
            console.error(`[Scheduler] Failed to send post #${post.id}:`, err.message);
        }
    }
}

function startScheduler(client) {
    // Small delay so DB is fully ready before first tick
    setTimeout(() => {
        runScheduler(client);
        setInterval(() => runScheduler(client), 60_000);
    }, 3_000);
    console.log('[Scheduler] Scheduled post runner started (60s interval).');
}

module.exports = { startScheduler };
