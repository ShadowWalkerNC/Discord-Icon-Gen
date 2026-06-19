/**
 * Scheduled post runner + poll auto-closer + giveaway auto-closer. Fires every 60s.
 */
const { EmbedBuilder } = require('discord.js');
const { getDueScheduledPosts, deleteScheduledPost, getExpiredPolls, getExpiredGiveaways } = require('../utils/db.js');

async function runScheduler(client) {
    const due = getDueScheduledPosts();
    for (const post of due) {
        deleteScheduledPost(post.id);
        try {
            const channel = await client.channels.fetch(post.channel_id);
            if (!channel?.isTextBased()) continue;
            const { text, title, color, imageUrl, footer } = post.payload;
            let embed = null;
            if (title || color || imageUrl) {
                embed = new EmbedBuilder().setColor(color ?? '#5865F2').setTimestamp();
                if (title) embed.setTitle(title);
                if (text) embed.setDescription(text);
                if (imageUrl) embed.setImage(imageUrl);
                embed.setFooter({ text: footer ?? 'Sigil Scheduled Post' });
            }
            await channel.send({ content: embed ? undefined : (text ?? '\u200b'), embeds: embed ? [embed] : [] });
        } catch (err) {
            console.error(`[Scheduler] Failed to send post #${post.id}:`, err.message);
        }
    }

    const expiredPolls = getExpiredPolls();
    if (expiredPolls.length) {
        const { finalizePoll } = require('../commands/poll.js');
        for (const poll of expiredPolls) await finalizePoll(client, poll);
    }

    const expiredGiveaways = getExpiredGiveaways();
    if (expiredGiveaways.length) {
        const { finalizeGiveaway } = require('../commands/giveaway.js');
        for (const giveaway of expiredGiveaways) await finalizeGiveaway(client, giveaway);
    }
}

function startScheduler(client) {
    setTimeout(() => {
        runScheduler(client);
        setInterval(() => runScheduler(client), 60_000);
    }, 3_000);
    console.log('[Scheduler] Scheduled post + poll + giveaway runner started (60s interval).');
}

module.exports = { startScheduler };
