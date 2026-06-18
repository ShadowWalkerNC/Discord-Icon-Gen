const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { registerAllFonts } = require('../utils/canvas.js');
const { getConfig } = require('../utils/db.js');

registerAllFonts();

const W = 900, H = 300;

async function renderWelcomeCard({ username, message, memberCount, primary, bg, font, avatarURL }) {
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    try { getBackgroundById(bg).draw(ctx, W, H); }
    catch { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#00000055'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = primary; ctx.fillRect(0, 0, 6, H);

    const AR = 90, AX = 36, AY = H / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(AX + AR, AY, AR, 0, Math.PI * 2); ctx.clip();
    if (avatarURL) {
        try { const img = await loadImage(avatarURL); ctx.drawImage(img, AX, AY - AR, AR * 2, AR * 2); }
        catch { ctx.fillStyle = primary + '44'; ctx.fill(); }
    } else {
        ctx.fillStyle = primary + '44'; ctx.fill();
        ctx.restore(); ctx.save();
        ctx.font = `bold 52px "${font}"`; ctx.fillStyle = primary;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(username.slice(0, 2).toUpperCase(), AX + AR, AY);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(AX + AR, AY, AR + 4, 0, Math.PI * 2);
    ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();

    const TX = AX + AR * 2 + 36;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = `bold 13px Arial`; ctx.fillStyle = primary;
    ctx.fillText('W E L C O M E', TX, H * 0.30);
    ctx.font = `bold 42px "${font}"`; ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary; ctx.shadowBlur = 8;
    ctx.fillText(username, TX, H * 0.30 + 48); ctx.shadowBlur = 0;
    ctx.font = `18px "${font}"`; ctx.fillStyle = '#cccccc';
    ctx.fillText(message, TX, H * 0.30 + 48 + 32);
    if (memberCount) {
        ctx.font = `bold 14px "${font}"`; ctx.fillStyle = primary + 'cc';
        ctx.fillText(memberCount, TX, H * 0.85);
    }
    ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('made with Sigil', W - 12, H - 8);

    return canvas.toBuffer('image/png');
}

async function handleMemberJoin(member) {
    const config = getConfig(member.guild.id);
    if (!config.welcome_enabled || !config.welcome_channel) return;

    const channel = member.guild.channels.cache.get(config.welcome_channel);
    if (!channel) return;

    const memberCount = `You are member #${member.guild.memberCount.toLocaleString()}`;
    const avatarURL   = member.user.displayAvatarURL({ size: 256, extension: 'png' });

    const buf = await renderWelcomeCard({
        username:    member.user.displayName || member.user.username,
        message:     'Welcome to the server!',
        memberCount,
        primary:     config.welcome_color  || '#39FF14',
        bg:          config.welcome_bg     || 'gradient-purple',
        font:        config.welcome_font   || 'Arial',
        avatarURL,
    });

    const attachment = new AttachmentBuilder(buf, { name: 'welcome.png' });
    const embed = new EmbedBuilder()
        .setDescription(`**${member.user.displayName || member.user.username}** just joined! ${memberCount}`)
        .setImage('attachment://welcome.png')
        .setColor(config.welcome_color || '#39FF14');

    await channel.send({ embeds: [embed], files: [attachment] });
}

module.exports = { handleMemberJoin };
