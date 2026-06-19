const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { registerAllFonts } = require('../utils/canvas.js');
const { getConfig } = require('../utils/db.js');

registerAllFonts();

// ── Shared card renderer ─────────────────────────────────────────────────────
async function renderNotificationCard({ label, title, subtitle, thumbnailURL, primary, bg, font }) {
    const W = 900, H = 280;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    try { getBackgroundById(bg).draw(ctx, W, H); }
    catch { ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H); }

    ctx.fillStyle = '#00000066'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = primary; ctx.fillRect(0, 0, 6, H);

    // Thumbnail (right side)
    if (thumbnailURL) {
        try {
            const img = await loadImage(thumbnailURL);
            const TH = H - 32, TW = TH * (16 / 9);
            const TX = W - TW - 16;
            ctx.save();
            ctx.beginPath(); ctx.roundRect(TX, 16, TW, TH, 8); ctx.clip();
            ctx.drawImage(img, TX, 16, TW, TH);
            ctx.restore();
            // subtle gradient fade over thumbnail left edge
            const fade = ctx.createLinearGradient(TX - 40, 0, TX + 40, 0);
            fade.addColorStop(0, '#00000000'); fade.addColorStop(1, '#000000cc');
            ctx.fillStyle = fade; ctx.fillRect(TX - 40, 0, 80, H);
        } catch { /* skip thumbnail on load failure */ }
    }

    // Label badge
    ctx.font = 'bold 11px Arial'; ctx.fillStyle = primary;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(label.toUpperCase(), 36, H * 0.24);

    // Title
    ctx.font = `bold 32px "${font}"`; ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary; ctx.shadowBlur = 8;
    let t = title;
    const maxW = thumbnailURL ? W * 0.55 : W - 80;
    while (ctx.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -1);
    if (t !== title) t = t.trim() + '\u2026';
    ctx.fillText(t, 36, H * 0.24 + 44); ctx.shadowBlur = 0;

    // Subtitle
    if (subtitle) {
        ctx.font = `16px "${font}"`; ctx.fillStyle = '#aaaaaa';
        let s = subtitle;
        while (ctx.measureText(s).width > maxW && s.length > 4) s = s.slice(0, -1);
        if (s !== subtitle) s = s.trim() + '\u2026';
        ctx.fillText(s, 36, H * 0.24 + 44 + 30);
    }

    // Watermark
    ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff14';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('made with Sigil', W - 12, H - 8);

    return canvas.toBuffer('image/png');
}

// ── Platform handlers ────────────────────────────────────────────────────────

async function handleTwitchLive({ guildId, streamer, title, game, thumbnailURL, streamURL, client }) {
    const config  = getConfig(guildId);
    const channel = client.channels.cache.get(config.webhook_channel);
    if (!channel) return;

    const buf = await renderNotificationCard({
        label:        '\uD83D\uDFE3  TWITCH • NOW LIVE',
        title:        streamer,
        subtitle:     title || game || 'Live now!',
        thumbnailURL: thumbnailURL || null,
        primary:      '#9146FF',
        bg:           config.welcome_bg   || 'gradient-purple',
        font:         config.welcome_font || 'Arial',
    });

    const attachment = new AttachmentBuilder(buf, { name: 'twitch-live.png' });
    const embed = new EmbedBuilder()
        .setTitle(`\uD83D\uDFE3 ${streamer} is Live on Twitch!`)
        .setDescription(`**${title || 'Streaming now!'}**\n${game ? `Playing: ${game}` : ''}`)
        .setURL(streamURL || `https://twitch.tv/${streamer}`)
        .setImage('attachment://twitch-live.png')
        .setColor('#9146FF')
        .setFooter({ text: 'Sigil • Twitch Integration' })
        .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
}

async function handleYouTubeUpload({ guildId, channelName, videoTitle, videoURL, thumbnailURL, client }) {
    const config  = getConfig(guildId);
    const channel = client.channels.cache.get(config.webhook_channel);
    if (!channel) return;

    const buf = await renderNotificationCard({
        label:        '\uD83D\uDCF9  YOUTUBE • NEW VIDEO',
        title:        videoTitle || 'New Upload',
        subtitle:     channelName || '',
        thumbnailURL: thumbnailURL || null,
        primary:      '#FF0000',
        bg:           config.welcome_bg   || 'gradient-purple',
        font:         config.welcome_font || 'Arial',
    });

    const attachment = new AttachmentBuilder(buf, { name: 'youtube-upload.png' });
    const embed = new EmbedBuilder()
        .setTitle(`\uD83D\uDCF9 New Video — ${channelName || 'YouTube'}`)
        .setDescription(`**${videoTitle}**`)
        .setURL(videoURL || null)
        .setImage('attachment://youtube-upload.png')
        .setColor('#FF0000')
        .setFooter({ text: 'Sigil • YouTube Integration' })
        .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
}

async function handleGitHubPush({ guildId, repoName, branch, pusher, commits, repoURL, client }) {
    const config  = getConfig(guildId);
    const channel = client.channels.cache.get(config.webhook_channel);
    if (!channel) return;

    const commitList = (commits || []).slice(0, 5)
        .map(c => `\`${String(c.id || c.sha || '').slice(0, 7)}\` ${String(c.message || '').split('\n')[0].slice(0, 60)}`)
        .join('\n');

    const buf = await renderNotificationCard({
        label:        '\u2B1B  GITHUB • NEW PUSH',
        title:        repoName || 'Repository',
        subtitle:     `${pusher || 'Someone'} pushed to ${branch || 'main'}`,
        thumbnailURL: null,
        primary:      '#ffffff',
        bg:           config.welcome_bg   || 'gradient-purple',
        font:         config.welcome_font || 'Arial',
    });

    const attachment = new AttachmentBuilder(buf, { name: 'github-push.png' });
    const embed = new EmbedBuilder()
        .setTitle(`\u2B1B Push to ${repoName} / ${branch || 'main'}`)
        .setDescription(commitList || 'No commit details provided.')
        .setURL(repoURL || null)
        .setImage('attachment://github-push.png')
        .setColor('#24292F')
        .setFooter({ text: `Sigil • GitHub Integration • Pushed by ${pusher || 'unknown'}` })
        .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
}

module.exports = { handleTwitchLive, handleYouTubeUpload, handleGitHubPush };
