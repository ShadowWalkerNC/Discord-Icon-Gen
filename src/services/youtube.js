/**
 * YouTube Data API v3 helpers.
 * Set YOUTUBE_API_KEY in .env
 * Falls back to RSS feed polling if API key is absent.
 */
const https = require('https');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch the latest video ID + snippet for a YouTube channel via RSS (no API key needed).
 * Returns null if the feed is unavailable or has no entries.
 */
async function getLatestVideoRSS(ytChannelId) {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelId}`;
    const res = await httpsGet(url);
    if (typeof res.body !== 'string') return null;
    const xml = res.body;

    const videoIdMatch  = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch    = xml.match(/<media:title>([^<]+)<\/media:title>/);
    const authorMatch   = xml.match(/<name>([^<]+)<\/name>/);
    const thumbMatch    = xml.match(/<media:thumbnail[^>]+url="([^"]+)"/);

    if (!videoIdMatch) return null;

    return {
        videoId:   videoIdMatch[1],
        title:     titleMatch?.[1]  ?? 'New Video',
        author:    authorMatch?.[1] ?? ytChannelId,
        thumbnail: thumbMatch?.[1]  ?? null,
        url:       `https://www.youtube.com/watch?v=${videoIdMatch[1]}`,
    };
}

/**
 * Fetch latest video via YouTube Data API v3 (requires YOUTUBE_API_KEY).
 * Returns same shape as getLatestVideoRSS.
 */
async function getLatestVideoAPI(ytChannelId) {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return getLatestVideoRSS(ytChannelId);

    const url = `https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${encodeURIComponent(ytChannelId)}&part=snippet&order=date&maxResults=1&type=video`;
    const res = await httpsGet(url);
    const item = res.body?.items?.[0];
    if (!item) return null;

    return {
        videoId:   item.id.videoId,
        title:     item.snippet.title,
        author:    item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url ?? null,
        url:       `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };
}

/**
 * Resolve a YouTube channel ID from a handle (@name) or direct channel ID.
 * Returns { id, name } or null.
 */
async function resolveChannel(handleOrId) {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
        // Without API key, treat as raw channel ID
        return { id: handleOrId, name: handleOrId };
    }

    // If it looks like a channel ID already (starts with UC)
    if (handleOrId.startsWith('UC')) {
        const url = `https://www.googleapis.com/youtube/v3/channels?key=${key}&id=${encodeURIComponent(handleOrId)}&part=snippet&maxResults=1`;
        const res = await httpsGet(url);
        const item = res.body?.items?.[0];
        if (!item) return null;
        return { id: item.id, name: item.snippet.title };
    }

    // Try as handle (@name)
    const handle = handleOrId.startsWith('@') ? handleOrId : `@${handleOrId}`;
    const url = `https://www.googleapis.com/youtube/v3/channels?key=${key}&forHandle=${encodeURIComponent(handle)}&part=snippet&maxResults=1`;
    const res = await httpsGet(url);
    const item = res.body?.items?.[0];
    if (!item) return null;
    return { id: item.id, name: item.snippet.title };
}

module.exports = { getLatestVideoAPI, getLatestVideoRSS, resolveChannel };
