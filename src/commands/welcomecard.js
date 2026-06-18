const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const W = 900, H = 300;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomecard')
        .setDescription('Generate a custom welcome card — replaces MEE6 Pro welcome images for free')
        .addStringOption(opt => opt.setName('username').setDescription('New member username').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Welcome message (default: Welcome to the server!)'))
        .addStringOption(opt => opt.setName('member_count').setDescription('Member count (e.g. You are member #1,204)'))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Accent color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addStringOption(opt => opt.setName('avatar_url').setDescription('Avatar image URL (optional)')),

    async autocomplete(interaction) {
        const { colorAutocomplete } = require('../utils/colors.js');
        await colorAutocomplete(interaction);
    },

    async execute(interaction) {
        await interaction.deferReply();

        const username    = interaction.options.getString('username');
        const message     = interaction.options.getString('message')       ?? 'Welcome to the server!';
        const memberCount = interaction.options.getString('member_count')  ?? '';
        const background  = interaction.options.getString('background')    ?? 'gradient-purple';
        const primary     = interaction.options.getString('primary_color') ?? '#39FF14';
        const font        = interaction.options.getString('font')          ?? getAllFontFamilies()[0] ?? 'Arial';
        const avatarURL   = interaction.options.getString('avatar_url')   ?? null;

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        // Background
        try { getBackgroundById(background).draw(ctx, W, H); }
        catch { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); }

        // Dark overlay for readability
        ctx.fillStyle = '#00000055';
        ctx.fillRect(0, 0, W, H);

        // Accent bar left
        ctx.fillStyle = primary;
        ctx.fillRect(0, 0, 6, H);

        // Avatar
        const AR = 90, AX = 36, AY = H / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(AX + AR, AY, AR + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00000066';
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(AX + AR, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        if (avatarURL) {
            try { const img = await loadImage(avatarURL); ctx.drawImage(img, AX, AY - AR, AR * 2, AR * 2); }
            catch { ctx.fillStyle = primary + '33'; ctx.fill(); }
        } else {
            ctx.fillStyle = primary + '44'; ctx.fill();
            ctx.restore(); ctx.save();
            ctx.font = `bold 52px "${font}"`;
            ctx.fillStyle = primary;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(username.slice(0, 2).toUpperCase(), AX + AR, AY);
        }
        ctx.restore();

        // Avatar ring
        ctx.beginPath();
        ctx.arc(AX + AR, AY, AR + 4, 0, Math.PI * 2);
        ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();

        // Text
        const TX = AX + AR * 2 + 36;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

        // WELCOME header
        ctx.font = `bold 13px Arial`;
        ctx.fillStyle = primary;
        ctx.fillText('W E L C O M E', TX, H * 0.30);

        // Username
        ctx.font = `bold 42px "${font}"`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = primary; ctx.shadowBlur = 8;
        ctx.fillText(username, TX, H * 0.30 + 48);
        ctx.shadowBlur = 0;

        // Message
        ctx.font = `18px "${font}"`;
        ctx.fillStyle = '#cccccc';
        ctx.fillText(message, TX, H * 0.30 + 48 + 32);

        // Member count
        if (memberCount) {
            ctx.font = `bold 14px "${font}"`;
            ctx.fillStyle = primary + 'cc';
            ctx.fillText(memberCount, TX, H * 0.85);
        }

        // Watermark
        ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('made with Sigil', W - 12, H - 8);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'welcomecard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome Card — ${username}`)
            .setDescription('Drop this in your welcome channel. Replaces MEE6 Pro welcome images — free.')
            .setImage('attachment://welcomecard.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • welcomecard — 900×300 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'welcomecard', username, message, background, primary_color: primary, font });
    },
};
