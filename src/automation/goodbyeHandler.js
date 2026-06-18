const { createCanvas } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { registerAllFonts } = require('../utils/canvas.js');
const { getConfig } = require('../utils/db.js');

registerAllFonts();

const W = 900, H = 300;

async function handleMemberLeave(member) {
    const config = getConfig(member.guild.id);
    if (!config.goodbye_enabled || !config.goodbye_channel) return;

    const channel = member.guild.channels.cache.get(config.goodbye_channel);
    if (!channel) return;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');
    const primary = '#ff4444';

    try { getBackgroundById('solid-dark').draw(ctx, W, H); }
    catch { ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#00000066'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = primary; ctx.fillRect(0, 0, 6, H);

    const username = member.user.displayName || member.user.username;
    const AR = 70, AX = 36, AY = H / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(AX + AR, AY, AR, 0, Math.PI * 2);
    ctx.fillStyle = primary + '33'; ctx.fill(); ctx.restore();
    ctx.font = `bold 36px Arial`; ctx.fillStyle = primary;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(username.slice(0, 2).toUpperCase(), AX + AR, AY);
    ctx.beginPath(); ctx.arc(AX + AR, AY, AR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = primary; ctx.lineWidth = 2.5; ctx.stroke();

    const TX = AX + AR * 2 + 36;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = `bold 13px Arial`; ctx.fillStyle = primary;
    ctx.fillText('S E E  Y O U', TX, H * 0.30);
    ctx.font = `bold 38px Arial`; ctx.fillStyle = '#ffffff';
    ctx.fillText(username, TX, H * 0.30 + 48);
    ctx.font = `16px Arial`; ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`We'll miss you. 👋`, TX, H * 0.30 + 48 + 30);
    ctx.font = `bold 13px Arial`; ctx.fillStyle = '#ffffff44';
    ctx.fillText(`${member.guild.memberCount.toLocaleString()} members remaining`, TX, H * 0.85);
    ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('made with Sigil', W - 12, H - 8);

    const buf = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buf, { name: 'goodbye.png' });
    const embed = new EmbedBuilder()
        .setDescription(`**${username}** has left the server.`)
        .setImage('attachment://goodbye.png')
        .setColor(primary);

    await channel.send({ embeds: [embed], files: [attachment] });
}

module.exports = { handleMemberLeave };
