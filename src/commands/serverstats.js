const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { registerAllFonts } = require('../utils/canvas.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const W = 860, H = 480;

function boostLevelColor(level) {
    return ['#5865F2', '#ff73fa', '#ff73fa', '#ff73fa'][level] ?? '#ff73fa';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Generate a visual server health card — members, boosts, channels, roles, age'),

    async execute(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        await guild.fetch();

        const memberCount  = guild.memberCount;
        const boostLevel   = guild.premiumTier;
        const boostCount   = guild.premiumSubscriptionCount || 0;
        const channelCount = guild.channels.cache.size;
        const roleCount    = guild.roles.cache.size - 1; // exclude @everyone
        const emojiCount   = guild.emojis.cache.size;
        const stickerCount = guild.stickers?.cache.size ?? 0;
        const createdAt    = guild.createdAt;
        const ageMs        = Date.now() - createdAt.getTime();
        const ageDays      = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageYears     = (ageDays / 365).toFixed(1);
        const accent       = boostLevelColor(boostLevel);

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1e1f22'; ctx.fillRect(0, 0, W, H);
        const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.6);
        bgGrad.addColorStop(0, accent + '18'); bgGrad.addColorStop(1, '#1e1f22');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

        // Top accent bar
        const topGrad = ctx.createLinearGradient(0, 0, W, 0);
        topGrad.addColorStop(0, accent); topGrad.addColorStop(1, accent + '00');
        ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, 5);

        // Server icon area
        const iconUrl = guild.iconURL({ size: 256, extension: 'png' });
        ctx.save();
        ctx.beginPath(); ctx.arc(64, 64, 44, 0, Math.PI * 2);
        if (iconUrl) {
            try {
                const { loadImage } = require('canvas');
                ctx.clip();
                const img = await loadImage(iconUrl);
                ctx.drawImage(img, 20, 20, 88, 88);
            } catch {
                ctx.fillStyle = accent + '44'; ctx.fill();
            }
        } else {
            ctx.fillStyle = accent + '44'; ctx.fill();
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(64, 64, 46, 0, Math.PI * 2);
        ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.stroke();

        // Server name
        ctx.font = `bold 28px Arial`; ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(guild.name, 124, 52);
        ctx.font = `13px Arial`; ctx.fillStyle = '#b5bac1';
        ctx.fillText(`Created ${createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • ${ageYears} years old`, 124, 76);

        // Boost badge
        const boostLabel = `Level ${boostLevel} • ${boostCount} Boosts`;
        ctx.font = `bold 13px Arial`;
        const bw = ctx.measureText(boostLabel).width + 24;
        ctx.fillStyle = '#ff73fa22';
        ctx.beginPath(); ctx.roundRect(W - bw - 20, 36, bw, 26, 13); ctx.fill();
        ctx.strokeStyle = '#ff73fa'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#ff73fa'; ctx.textAlign = 'center';
        ctx.fillText('🚀 ' + boostLabel, W - bw / 2 - 20, 54);

        // Divider
        ctx.fillStyle = '#ffffff22'; ctx.fillRect(24, 108, W - 48, 1);

        // Stat cards
        const stats = [
            { label: 'MEMBERS',  value: memberCount.toLocaleString(),  icon: '👥' },
            { label: 'CHANNELS', value: channelCount.toString(),        icon: '💬' },
            { label: 'ROLES',    value: roleCount.toString(),           icon: '🏷️' },
            { label: 'EMOJI',    value: emojiCount.toString(),          icon: '😄' },
            { label: 'STICKERS', value: stickerCount.toString(),        icon: '🎨' },
            { label: 'AGE',      value: `${ageDays}d`,                  icon: '📅' },
        ];

        const CARD_W = (W - 48 - 40) / 3;
        const CARD_H = 110;
        stats.forEach((s, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const cx  = 24 + col * (CARD_W + 20);
            const cy  = 128 + row * (CARD_H + 16);

            ctx.fillStyle = '#2b2d31';
            ctx.beginPath(); ctx.roundRect(cx, cy, CARD_W, CARD_H, 10); ctx.fill();
            ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1.5; ctx.stroke();

            ctx.font = `24px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillText(s.icon, cx + CARD_W / 2, cy + 36);
            ctx.font = `bold 28px Arial`; ctx.fillStyle = '#ffffff';
            ctx.shadowColor = accent; ctx.shadowBlur = 6;
            ctx.fillText(s.value, cx + CARD_W / 2, cy + 72); ctx.shadowBlur = 0;
            ctx.font = `bold 11px Arial`; ctx.fillStyle = '#b5bac1';
            ctx.fillText(s.label, cx + CARD_W / 2, cy + 94);
        });

        // Bottom rule + watermark
        ctx.fillStyle = topGrad; ctx.fillRect(0, H - 5, W, 5);
        ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('made with Sigil', W - 12, H - 8);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'serverstats.png' });

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} — Server Stats`)
            .setImage('attachment://serverstats.png')
            .setColor(accent)
            .setFooter({ text: 'Sigil • serverstats — 860×480 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'serverstats', guildId: guild.id });
    },
};
