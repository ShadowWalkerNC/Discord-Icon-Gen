const { createCanvas } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { registerAllFonts } = require('../utils/canvas.js');
const { getConfig } = require('../utils/db.js');

registerAllFonts();

const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const W = 900, H = 340;

async function handleMilestoneCheck(guild) {
    const count  = guild.memberCount;
    if (!MILESTONES.includes(count)) return;

    const config = getConfig(guild.id);
    if (!config.milestone_enabled || !config.milestone_channel) return;

    const channel = guild.channels.cache.get(config.milestone_channel);
    if (!channel) return;

    const primary = '#ffd700';
    const canvas  = createCanvas(W, H);
    const ctx     = canvas.getContext('2d');

    try { getBackgroundById('gradient-gold').draw(ctx, W, H); }
    catch { ctx.fillStyle = '#1a1100'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#00000077'; ctx.fillRect(0, 0, W, H);

    // Radial glow
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.55);
    grad.addColorStop(0, '#ffd70022'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = primary; ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '48px Arial'; ctx.fillText('🎉', W / 2, 88);
    ctx.font = `bold 14px Arial`; ctx.fillStyle = primary;
    ctx.fillText('M I L E S T O N E  R E A C H E D', W / 2, 116);
    ctx.font = `bold 72px Arial`; ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary; ctx.shadowBlur = 20;
    ctx.fillText(count.toLocaleString(), W / 2, 196); ctx.shadowBlur = 0;
    ctx.font = `bold 22px Arial`; ctx.fillStyle = primary;
    ctx.fillText('MEMBERS', W / 2, 228);
    ctx.font = `18px Arial`; ctx.fillStyle = '#cccccc';
    ctx.fillText(`${guild.name} just hit ${count.toLocaleString()} members. Thank you all! 🙏`, W / 2, 274);
    ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('made with Sigil', W - 12, H - 8);

    const buf = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buf, { name: 'milestone.png' });
    const embed = new EmbedBuilder()
        .setTitle(`🎉 ${guild.name} hit ${count.toLocaleString()} members!`)
        .setImage('attachment://milestone.png')
        .setColor(primary);

    await channel.send({ content: '@everyone', embeds: [embed], files: [attachment] });
}

module.exports = { handleMilestoneCheck };
