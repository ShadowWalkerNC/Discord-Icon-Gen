const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const { getFont, getAllFonts }                  = require('../utils/fonts');
const { createTextGradient }                   = require('../utils/gradient');
const { drawBackground }                       = require('../utils/backgrounds');
const { drawBorder, BORDER_LABELS }            = require('../utils/borders');
const { saveEntry }                            = require('../utils/history');

for (const font of getAllFonts()) {
    try { registerFont(font.file, { family: font.family }); }
    catch (e) { console.error(`[ERROR] Failed to register font '${font.family}':`, e.message); }
}

const CANVAS_SIZE = 400;

const TEXTS = [
    'ICON', 'LOGO', 'GG', 'PRO', 'ACE', 'KING', 'NOVA', 'APEX',
    'VIBE', 'GRID', 'HYPE', 'FLUX', 'CORE', 'ZERO', 'NEON', 'BYTE',
];

const COLORS = [
    '#FF4500', '#00FFFF', '#FF00FF', '#FFD700', '#00FF7F',
    '#FF69B4', '#7B68EE', '#FF6347', '#40E0D0', '#EE82EE',
];

const BACKGROUNDS = [
    'plain-black', 'midnight-gradient', 'sunset', 'forest',
    'cyberpunk-grid', 'starfield', 'carbon-fiber',
];

const BORDERS = ['none', 'solid', 'glow', 'gradient', 'double', 'dashed', 'corner', 'neon'];
const GLOWS   = ['5', '10', '15'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Generate a fully randomised icon.'),

    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder().setColor('#808080').setDescription('\uD83C\uDFB2 Generating a random icon\u2026');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const text       = pick(TEXTS);
            const color      = pick(COLORS);
            const color2     = Math.random() > 0.5 ? pick(COLORS.filter(c => c !== color)) : null;
            const background = pick(BACKGROUNDS);
            const border     = pick(BORDERS);
            const glow       = pick(GLOWS);
            const size       = 60 + Math.floor(Math.random() * 60);
            const fontKey    = 'another-danger';

            const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
            const ctx    = canvas.getContext('2d');

            await drawBackground(ctx, background, CANVAS_SIZE, CANVAS_SIZE, loadImage);

            if (border !== 'none') drawBorder(ctx, border, color, color2, CANVAS_SIZE);

            const font = getFont(fontKey);
            ctx.font         = `${size}px '${font.family}'`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';

            const fill = createTextGradient(ctx, color, color2, text, CANVAS_SIZE / 2, CANVAS_SIZE);
            ctx.shadowColor = color;
            ctx.shadowBlur  = Number(glow);
            ctx.fillStyle   = fill;
            ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur  = 0;
            ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

            const attachment = canvas.toBuffer();
            const colorLabel = color2 ? `${color} \u2192 ${color2}` : color;
            const borderName = BORDER_LABELS[border] ?? border;

            saveEntry(interaction.user.id, {
                label:   `Random \u2022 ${text} \u2022 ${colorLabel}`,
                command: 'icon',
                params: { text, size, color, color2, glow, background, border, font: fontKey },
            });

            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#808080')
                        .setImage('attachment://random.png')
                        .setFooter({ text: `Discord Icon Gen \u2022 /random \u2022 ${background} \u2022 ${colorLabel} \u2022 border: ${borderName} \u2022 glow: ${glow}` }),
                ],
                files: [{ attachment, name: 'random.png' }],
            });
        } catch (error) {
            console.error('[ERROR] Random generation failed:', error);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate a random icon. Please try again.')],
            });
        }
    },
};
