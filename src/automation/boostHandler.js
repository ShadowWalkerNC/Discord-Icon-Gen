const { createCanvas } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { registerAllFonts } = require('../utils/canvas.js');
const { getConfig } = require('../utils/db.js');

registerAllFonts();

const W = 800, H = 260;

async function handleBoost(member) {
    const config = getConfig(member.guild.id);
    if (!config.boost_enabled || !config.boost_channel) return;

    const channel = member.guild.channels.cache.get(config.boost_channel);
    if (!channel) return;

    const primary  = '#ff73fa';
    const username = member.user.displayName || member.user.username;
    const boosts   = member.guild.premiumSubscriptionCount || 0;
    const level    = member.guild.premiumTier;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#0d0014'; ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1a0030'); grad.addColorStop(1, '#0d0014');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Glow
    const rg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.5);
    rg.addColorStop(0, '#ff73fa22'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = primary + '88'; ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '40px Arial'; ctx.fillText('🚀', W / 2, 72);
    ctx.font = `bold 13px Arial`; ctx.fillStyle = primary;
    ctx.fillText('S E R V E R  B O O S T', W / 2, 98);
    ctx.font = `bold 36px Arial`; ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary; ctx.shadowBlur = 12;
    ctx.fillText(username, W / 2, 148); ctx.shadowBlur = 0;
    ctx.font = `16px Arial`; ctx.fillStyle = '#cccccc';
    ctx.fillText('just boosted the server! Thank you! ❤️', W / 2, 180);
    ctx.font = `bold 14px Arial`; ctx.fillStyle = primary;
    ctx.fillText(`${boosts} boosts total • Level ${level}`, W / 2, 214);
    ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('made with Sigil', W - 10, H - 8);

    const buf = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buf, { name: 'boost.png' });
    const embed = new EmbedBuilder()
        .setTitle(`🚀 ${username} boosted the server!`)
        .setImage('attachment://boost.png')
        .setColor(primary);

    await channel.send({ embeds: [embed], files: [attachment] });
}

module.exports = { handleBoost };
