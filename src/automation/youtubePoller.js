/**
 * YouTube upload poller — checks configured channels every 15 minutes.
 * Uses the YouTube Data API v3 "Search" endpoint (free tier: 10,000 units/day).
 * Requires env: YOUTUBE_API_KEY
 *
 * Subscriptions are stored in the youtube_subs table (managed by /youtube command):
 *   guild_id, yt_channel_id, channel_name, post_channel_id, last_video_id
 */
const { getAllYoutubeSubs, setYoutubeLastVideo } = require('../utils/db.js');

const YT_API_KEY    = process.env.YOUTUBE_API_KEY;
const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

async function fetchLatestVideo(channelId) {
    const url  = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=1&type=video&key=${YT_API_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
        videoId:      item.id.videoId,
        title:        item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailURL: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        videoURL:     `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };
}

async function tick(client) {
    const subs = getAllYoutubeSubs();
    for (const sub of subs) {
        try {
            const video = await fetchLatestVideo(sub.yt_channel_id);
            if (!video || video.videoId === sub.last_video_id) continue;

            // Post to the configured Discord channel
            const channel = await client.channels.fetch(sub.post_channel_id).catch(() => null);
            if (!channel) continue;

            await channel.send({
                content: `📺 **${video.channelTitle}** just uploaded a new video!`,
                embeds: [{
                    title:       video.title,
                    url:         video.videoURL,
                    color:       0xFF0000,
                    image:       { url: video.thumbnailURL },
                    footer:      { text: 'YouTube' },
                    timestamp:   new Date().toISOString(),
                }],
            });

            setYoutubeLastVideo(sub.guild_id, sub.yt_channel_id, video.videoId);

        } catch (err) {
            console.error(`[youtubePoller] Sub ${sub.yt_channel_id} (guild ${sub.guild_id}):`, err.message);
        }
    }
}

function startYouTubePoller(client) {
    if (!YT_API_KEY) {
        console.warn('[youtubePoller] YOUTUBE_API_KEY not set — YouTube poller disabled.');
        return;
    }
    tick(client);
    setInterval(() => tick(client), POLL_INTERVAL);
    console.log('[youtubePoller] Started (15 min interval)');
}

module.exports = { startYouTubePoller };
