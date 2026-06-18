const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const W = 800, H = 200;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankcard')
        .setDescription('Generate an XP rank card — replaces MEE6 Pro / Tatsu premium rank cards for free')
        .addStringOption(opt => opt.setName('username').setDescription('Username to display').setRequired(true))
        .addNumberOption(opt => opt.setName('level').setDescription('Current level').setRequired(true))
        .addNumberOption(opt => opt.setName('current_xp').setDescription('Current XP in this level').setRequired(true))
        .addNumberOption(opt => opt.setName('required_xp').setDescription('XP required to reach next level').setRequired(true))
        .addNumberOption(opt => opt.setName('rank').setDescription('Server rank position (e.g. 3)'))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Accent / XP bar color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addStringOption(opt => opt.setName('avatar_url').setDescription('Avatar image URL (optional)')),

    async autocomplete(interaction) {
        const { colorAutocomplete } = require('../utils/colors.js');
        await colorAutocomplete(interaction);
    },

    async execute(interaction) {
        await interaction.deferReply();

        const username   = interaction.options.getString('username');
        const level      = interaction.options.getNumber('level');
        const currentXP  = interaction.options.getNumber('current_xp');
        const requiredXP = interaction.options.getNumber('required_xp');
        const rank       = interaction.options.getNumber('rank')       ?? null;
        const background = interaction.options.getString('background') ?? 'solid-dark';
        const primary    = interaction.options.getString('primary_color') ?? '#39FF14';
        const font       = interaction.options.getString('font')       ?? getAllFontFamilies()[0] ?? 'Arial';
        const avatarURL  = interaction.options.getString('avatar_url') ?? null;

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        // Background
        try { getBackgroundById(background).draw(ctx, W, H); }
        catch { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = '#00000066'; ctx.fillRect(0, 0, W, H);

        // Avatar
        const AR = 64, AX = 24, AY = H / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(AX + AR, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        if (avatarURL) {
            try { const img = await loadImage(avatarURL); ctx.drawImage(img, AX, AY - AR, AR * 2, AR * 2); }
            catch { ctx.fillStyle = primary + '44'; ctx.fill(); }
        } else {
            ctx.fillStyle = primary + '44'; ctx.fill();
            ctx.restore(); ctx.save();
            ctx.font = `bold 36px "${font}"`;
            ctx.fillStyle = primary;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(username.slice(0, 2).toUpperCase(), AX + AR, AY);
        }
        ctx.restore();

        // Avatar ring
        ctx.beginPath();
        ctx.arc(AX + AR, AY, AR + 3, 0, Math.PI * 2);
        ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();

        // Text area
        const TX = AX + AR * 2 + 24;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

        // Rank badge
        if (rank) {
            ctx.font = `bold 13px Arial`;
            ctx.fillStyle = primary;
            ctx.fillText(`RANK #${rank}`, TX, H * 0.28);
        }

        // Username
        ctx.font = `bold 32px "${font}"`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(username, TX, H * 0.28 + (rank ? 26 : 10));

        // Level label
        ctx.textAlign = 'right';
        ctx.font = `bold 13px Arial`;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('LEVEL', W - 20, H * 0.28);
        ctx.font = `bold 32px "${font}"`;
        ctx.fillStyle = primary;
        ctx.fillText(`${level}`, W - 20, H * 0.28 + 26);

        // XP bar track
        const barX = TX, barY = H * 0.68, barW = W - TX - 24, barH = 18;
        ctx.fillStyle = '#ffffff22';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barH / 2);
        ctx.fill();

        // XP bar fill
        const pct = Math.min(1, currentXP / requiredXP);
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, primary + '88');
        ctx.fillStyle = grad;
        ctx.shadowColor = primary; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(barH, barW * pct), barH, barH / 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // XP label
        ctx.font = `13px Arial`;
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'left';
        ctx.fillText(`${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()} XP`, barX, barY + barH + 18);

        // Watermark
        ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('made with Sigil', W - 12, H - 6);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'rankcard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`⭐ Rank Card — ${username}`)
            .setDescription('Styled XP rank card — replaces MEE6 Pro and Tatsu premium rank cards for free.')
            .setImage('attachment://rankcard.png')
            .setColor(primary)
            .addFields(
                { name: 'Level',   value: `${level}`,                              inline: true },
                { name: 'XP',      value: `${currentXP} / ${requiredXP}`,          inline: true },
                { name: 'Progress',value: `${Math.round(pct * 100)}%`,             inline: true },
            )
            .setFooter({ text: 'Sigil • rankcard — 800×200 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'rankcard', username, level, currentXP, requiredXP, background, primary_color: primary, font });
    },
};
