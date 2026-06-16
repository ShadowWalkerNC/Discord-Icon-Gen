const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const { getFont, getAllFonts } = require('../utils/fonts');
const { createTextGradient } = require('../utils/gradient');
const { drawBackground } = require('../utils/backgrounds');

const CANVAS_SIZE = 400;

// Register all available fonts once at load time
for (const font of getAllFonts()) {
    registerFont(font.file, { family: font.family });
}

// Seeded pseudo-random number generator (mulberry32)
function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
        s += 0x6d2b79f5;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
}

function pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
}

// Vivid HSL colour with high saturation and mid-to-high lightness
function randomHexColor(rng) {
    const h = Math.floor(rng() * 360);
    const s = 70 + Math.floor(rng() * 30);  // 70-100%
    const l = 45 + Math.floor(rng() * 25);  // 45-70%
    // Convert HSL to hex
    const sn = s / 100, ln = l / 100;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// All available background keys (mirrors backgrounds.js registry)
const BG_KEYS = [
    'plain-black', 'plain-white',
    'midnight-gradient', 'sunset', 'forest',
    'cyberpunk-grid', 'starfield', 'carbon-fiber',
    'bg-image-1', 'bg-image-2',
];

const GLOW_VALUES  = ['5', '10', '15'];
const GLOW_LABELS  = { '5': 'Low', '10': 'Medium', '15': 'High' };
const BORDER_KEYS  = ['none', 'none', 'solid', 'glow', 'gradient']; // 'none' weighted 2x
const FONT_KEYS    = () => getAllFonts().map(f => f.family);

/**
 * Draws a border frame (same logic as icon.js).
 */
function drawBorder(ctx, style, color, color2, size) {
    const inset = 3;
    if (style === 'solid') {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = 6;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore();
        return;
    }
    if (style === 'glow') {
        ctx.save();
        ctx.shadowColor = color; ctx.shadowBlur = 20;
        ctx.strokeStyle = color; ctx.lineWidth = 4;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.globalAlpha = 0.4; ctx.shadowBlur = 40; ctx.lineWidth = 8;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore();
        return;
    }
    if (style === 'gradient') {
        const c2 = color2 || color;
        const segs = [
            { x0:0,    y0:0,    x1:size, y1:0,    startC:color, endC:c2    },
            { x0:size, y0:0,    x1:size, y1:size, startC:c2,    endC:color },
            { x0:size, y0:size, x1:0,    y1:size, startC:color, endC:c2    },
            { x0:0,    y0:size, x1:0,    y1:0,    startC:c2,    endC:color },
        ];
        ctx.save(); ctx.lineWidth = 6;
        segs.forEach(({ x0, y0, x1, y1, startC, endC }) => {
            const g = ctx.createLinearGradient(x0, y0, x1, y1);
            g.addColorStop(0, startC); g.addColorStop(1, endC);
            ctx.strokeStyle = g;
            ctx.beginPath();
            if      (y0===0    && y1===0)    { ctx.moveTo(inset, inset);              ctx.lineTo(size-inset, inset);          }
            else if (x0===size && x1===size) { ctx.moveTo(size-inset, inset);         ctx.lineTo(size-inset, size-inset);     }
            else if (y0===size && y1===size) { ctx.moveTo(size-inset, size-inset);    ctx.lineTo(inset, size-inset);          }
            else                             { ctx.moveTo(inset, size-inset);          ctx.lineTo(inset, inset);               }
            ctx.stroke();
        });
        ctx.restore();
    }
}

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Generate a random icon — background, font, colours, and border all chosen for you.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to display (default: your Discord username)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('seed')
                .setDescription('Optional seed number — same seed = same result every time')
                .setRequired(false)),

    async execute(interaction) {
        const inputText = interaction.options.getString('text') || interaction.user.username;
        const inputSeed = interaction.options.getInteger('seed');

        // Build seed: user-supplied or random
        const seed = inputSeed !== null ? inputSeed : Math.floor(Math.random() * 0xFFFFFF);
        const rng  = makeRng(seed);

        // Pick everything randomly
        const bgKey      = pick(BG_KEYS, rng);
        const glowVal    = pick(GLOW_VALUES, rng);
        const borderKey  = pick(BORDER_KEYS, rng);
        const color1     = randomHexColor(rng);
        const color2     = rng() > 0.4 ? randomHexColor(rng) : null; // 60% chance of gradient
        const fontSize   = 60 + Math.floor(rng() * 40);              // 60-100px
        const allFonts   = getAllFonts();
        const fontObj    = pick(allFonts, rng);
        const fontKey    = Object.keys(require('../utils/fonts').getFontChoices ? {} : {});
        // Resolve font key from family name
        const fontEntry  = allFonts.find(f => f.family === fontObj.family) || allFonts[0];

        const loadingEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setDescription(`\uD83C\uDFB2 Generating your random icon (seed: \`${seed}\`)\u2026`);
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
            const ctx    = canvas.getContext('2d');

            // 1. Background
            await drawBackground(ctx, bgKey, CANVAS_SIZE, CANVAS_SIZE, loadImage);

            // 2. Border
            if (borderKey !== 'none') {
                drawBorder(ctx, borderKey, color1, color2, CANVAS_SIZE);
            }

            // 3. Text
            ctx.font         = `${fontSize}px '${fontEntry.family}'`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';

            const fill = createTextGradient(ctx, color1, color2, inputText, CANVAS_SIZE / 2, CANVAS_SIZE);

            ctx.shadowColor = color1;
            ctx.shadowBlur  = Number(glowVal);
            ctx.fillStyle   = fill;
            ctx.fillText(inputText, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur  = 0;
            ctx.fillText(inputText, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

            const attachment  = canvas.toBuffer();
            const colorLabel  = color2 ? `${color1} \u2192 ${color2}` : color1;
            const borderLabel = borderKey !== 'none' ? borderKey : 'none';

            const resultEmbed = new EmbedBuilder()
                .setColor('#808080')
                .setImage('attachment://random-icon.png')
                .setTitle('\uD83C\uDFB2 Random Icon')
                .addFields(
                    { name: 'Background', value: `\`${bgKey}\``,           inline: true },
                    { name: 'Font',       value: `\`${fontEntry.label}\``, inline: true },
                    { name: 'Glow',       value: `\`${GLOW_LABELS[glowVal]}\``, inline: true },
                    { name: 'Colour',     value: `\`${colorLabel}\``,      inline: true },
                    { name: 'Border',     value: `\`${borderLabel}\``,     inline: true },
                    { name: 'Seed',       value: `\`${seed}\` \u2014 share this to recreate the same icon`, inline: false },
                )
                .setFooter({ text: 'Discord Icon Gen \u2022 /random \u2022 use the seed to recreate this exact result' });

            await initialReply.edit({
                embeds: [resultEmbed],
                files: [{ attachment, name: 'random-icon.png' }],
            });
        } catch (error) {
            console.error('[ERROR] Random icon generation failed:', error);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate your random icon. Please try again.')],
            });
        }
    },
};
