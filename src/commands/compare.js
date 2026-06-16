/**
 * /compare — render two icon variants side-by-side for easy comparison.
 *
 * Shared params: text, size, font
 * Side A params: color_a, color2_a, glow_a, background_a, opacity_a, border_a
 * Side B params: color_b, color2_b, glow_b, background_b, opacity_b, border_b
 *
 * Output: 820x440 PNG  (20px padding all around, 20px gap between icons)
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const { getFont, getFontChoices, getAllFonts }   = require('../utils/fonts');
const { createTextGradient }                     = require('../utils/gradient');
const { getBackgroundChoices, drawBackground }   = require('../utils/backgrounds');

const HEX_REGEX   = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const ICON_SIZE   = 400;
const PAD         = 20;
const GAP         = 20;
const LABEL_H     = 40;
const OUT_W       = PAD + ICON_SIZE + GAP + ICON_SIZE + PAD;  // 860
const OUT_H       = PAD + ICON_SIZE + LABEL_H + PAD;           // 480

for (const font of getAllFonts()) {
    registerFont(font.file, { family: font.family });
}

// --- shared border helper (mirrors icon.js) ---
function drawBorder(ctx, style, color, color2, size) {
    const inset = 3;
    if (style === 'solid') {
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 6;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore(); return;
    }
    if (style === 'glow') {
        ctx.save();
        ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.strokeStyle = color; ctx.lineWidth = 4;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.globalAlpha = 0.4; ctx.shadowBlur = 40; ctx.lineWidth = 8;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore(); return;
    }
    if (style === 'gradient') {
        const c2   = color2 || color;
        const segs = [
            { x0:0,    y0:0,    x1:size, y1:0,    sC:color, eC:c2    },
            { x0:size, y0:0,    x1:size, y1:size, sC:c2,    eC:color },
            { x0:size, y0:size, x1:0,    y1:size, sC:color, eC:c2    },
            { x0:0,    y0:size, x1:0,    y1:0,    sC:c2,    eC:color },
        ];
        ctx.save(); ctx.lineWidth = 6;
        segs.forEach(({ x0, y0, x1, y1, sC, eC }) => {
            const g = ctx.createLinearGradient(x0, y0, x1, y1);
            g.addColorStop(0, sC); g.addColorStop(1, eC); ctx.strokeStyle = g;
            ctx.beginPath();
            if      (y0===0    && y1===0)    { ctx.moveTo(inset, inset);             ctx.lineTo(size-inset, inset);         }
            else if (x0===size && x1===size) { ctx.moveTo(size-inset, inset);        ctx.lineTo(size-inset, size-inset);    }
            else if (y0===size && y1===size) { ctx.moveTo(size-inset, size-inset);   ctx.lineTo(inset, size-inset);         }
            else                             { ctx.moveTo(inset, size-inset);         ctx.lineTo(inset, inset);              }
            ctx.stroke();
        });
        ctx.restore();
    }
}

/**
 * Renders a single 400x400 icon onto an offscreen canvas and returns it.
 */
async function renderIcon(params) {
    const { text, size, color, color2, glow, background, opacity, border, fontKey } = params;
    const canvas = createCanvas(ICON_SIZE, ICON_SIZE);
    const ctx    = canvas.getContext('2d');

    await drawBackground(ctx, background, ICON_SIZE, ICON_SIZE, loadImage);

    if (opacity < 100) {
        ctx.globalAlpha = 1 - (opacity / 100);
        ctx.fillStyle   = '#000000';
        ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE);
        ctx.globalAlpha = 1.0;
    }

    if (border && border !== 'none') drawBorder(ctx, border, color, color2, ICON_SIZE);

    const font = getFont(fontKey);
    ctx.font         = `${size}px '${font.family}'`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const fill = createTextGradient(ctx, color, color2, text, ICON_SIZE / 2, ICON_SIZE);
    ctx.shadowColor = color;
    ctx.shadowBlur  = Number(glow);
    ctx.fillStyle   = fill;
    ctx.fillText(text, ICON_SIZE / 2, ICON_SIZE / 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.fillText(text, ICON_SIZE / 2, ICON_SIZE / 2);

    return canvas;
}

module.exports = {
    cooldown: 8,
    data: new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Render two icon variants side-by-side to compare colours, backgrounds, or styles.')
        // --- shared ---
        .addStringOption(o  => o.setName('text')        .setDescription('Text shown on both icons (max 20 chars)')  .setRequired(true))
        .addIntegerOption(o => o.setName('size')        .setDescription('Font size in pixels (10–150)')             .setRequired(true))
        // --- side A ---
        .addStringOption(o  => o.setName('color_a')     .setDescription('Side A — primary text colour (hex)')        .setRequired(true))
        .addStringOption(o  => o.setName('glow_a')      .setDescription('Side A — glow intensity')                  .setRequired(true)
            .addChoices({ name:'Low',value:'5'},{ name:'Medium',value:'10'},{ name:'High',value:'15'}))
        .addStringOption(o  => o.setName('background_a').setDescription('Side A — background style')               .setRequired(true)
            .addChoices(...getBackgroundChoices()))
        // --- side B ---
        .addStringOption(o  => o.setName('color_b')     .setDescription('Side B — primary text colour (hex)')        .setRequired(true))
        .addStringOption(o  => o.setName('glow_b')      .setDescription('Side B — glow intensity')                  .setRequired(true)
            .addChoices({ name:'Low',value:'5'},{ name:'Medium',value:'10'},{ name:'High',value:'15'}))
        .addStringOption(o  => o.setName('background_b').setDescription('Side B — background style')               .setRequired(true)
            .addChoices(...getBackgroundChoices()))
        // --- shared optional ---
        .addStringOption(o  => o.setName('font')        .setDescription('Font (same for both sides)')               .setRequired(false)
            .addChoices(...getFontChoices()))
        // --- side A optional ---
        .addStringOption(o  => o.setName('color2_a')    .setDescription('Side A — gradient second colour (hex)')    .setRequired(false))
        .addIntegerOption(o => o.setName('opacity_a')   .setDescription('Side A — background opacity 10–100')      .setRequired(false).setMinValue(10).setMaxValue(100))
        .addStringOption(o  => o.setName('border_a')    .setDescription('Side A — border style')                   .setRequired(false)
            .addChoices({ name:'None',value:'none'},{ name:'Solid',value:'solid'},{ name:'Glow Ring',value:'glow'},{ name:'Gradient Ring',value:'gradient'}))
        // --- side B optional ---
        .addStringOption(o  => o.setName('color2_b')    .setDescription('Side B — gradient second colour (hex)')    .setRequired(false))
        .addIntegerOption(o => o.setName('opacity_b')   .setDescription('Side B — background opacity 10–100')      .setRequired(false).setMinValue(10).setMaxValue(100))
        .addStringOption(o  => o.setName('border_b')    .setDescription('Side B — border style')                   .setRequired(false)
            .addChoices({ name:'None',value:'none'},{ name:'Solid',value:'solid'},{ name:'Glow Ring',value:'glow'},{ name:'Gradient Ring',value:'gradient'})),

    async execute(interaction) {
        const text    = interaction.options.getString('text');
        const size    = interaction.options.getInteger('size');
        const fontKey = interaction.options.getString('font') || 'another-danger';

        const A = {
            text, size, fontKey,
            color:      interaction.options.getString('color_a'),
            color2:     interaction.options.getString('color2_a')    || null,
            glow:       interaction.options.getString('glow_a'),
            background: interaction.options.getString('background_a'),
            opacity:    interaction.options.getInteger('opacity_a')  ?? 100,
            border:     interaction.options.getString('border_a')    || 'none',
        };
        const B = {
            text, size, fontKey,
            color:      interaction.options.getString('color_b'),
            color2:     interaction.options.getString('color2_b')    || null,
            glow:       interaction.options.getString('glow_b'),
            background: interaction.options.getString('background_b'),
            opacity:    interaction.options.getInteger('opacity_b')  ?? 100,
            border:     interaction.options.getString('border_b')    || 'none',
        };

        // Validate hex colours
        for (const [key, val] of [['color_a', A.color],['color_b', B.color],['color2_a', A.color2],['color2_b', B.color2]]) {
            if (val && !HEX_REGEX.test(val))
                return interaction.reply({ content: `\`${key}\` must be a valid hex colour (e.g. #FF0000).`, ephemeral: true });
        }
        if (text.length > 20)
            return interaction.reply({ content: 'Text must be 20 characters or fewer.', ephemeral: true });
        if (size < 10 || size > 150)
            return interaction.reply({ content: 'Size must be between 10 and 150.', ephemeral: true });

        const loadingEmbed = new EmbedBuilder().setColor('#808080').setDescription('\u23F3 Rendering comparison\u2026');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            // Render both icons in parallel
            const [canvasA, canvasB] = await Promise.all([renderIcon(A), renderIcon(B)]);

            // Stitch onto output canvas
            const out    = createCanvas(OUT_W, OUT_H);
            const outCtx = out.getContext('2d');

            // Dark background
            outCtx.fillStyle = '#111111';
            outCtx.fillRect(0, 0, OUT_W, OUT_H);

            // Place icons
            const iconY = PAD;
            const xA    = PAD;
            const xB    = PAD + ICON_SIZE + GAP;
            outCtx.drawImage(canvasA, xA, iconY);
            outCtx.drawImage(canvasB, xB, iconY);

            // Labels A / B
            const labelY = PAD + ICON_SIZE + 28;
            outCtx.font         = "bold 22px 'Arial'";
            outCtx.textAlign    = 'center';
            outCtx.textBaseline = 'alphabetic';
            outCtx.fillStyle    = '#FFFFFF';
            outCtx.fillText('A', xA + ICON_SIZE / 2, labelY);
            outCtx.fillText('B', xB + ICON_SIZE / 2, labelY);

            const attachment = out.toBuffer();
            const fontObj    = getFont(fontKey);

            const resultEmbed = new EmbedBuilder()
                .setColor('#808080')
                .setImage('attachment://compare.png')
                .addFields(
                    { name: 'A — colour',     value: A.color2 ? `${A.color} \u2192 ${A.color2}` : A.color,  inline: true },
                    { name: 'A — background', value: `\`${A.background}\``,                                  inline: true },
                    { name: 'A — glow',       value: `\`${{ '5':'Low','10':'Medium','15':'High' }[A.glow]}\``, inline: true },
                    { name: 'B — colour',     value: B.color2 ? `${B.color} \u2192 ${B.color2}` : B.color,  inline: true },
                    { name: 'B — background', value: `\`${B.background}\``,                                  inline: true },
                    { name: 'B — glow',       value: `\`${{ '5':'Low','10':'Medium','15':'High' }[B.glow]}\``, inline: true },
                )
                .setFooter({ text: `Discord Icon Gen \u2022 /compare \u2022 font: ${fontObj.label} \u2022 text: ${text}` });

            await initialReply.edit({
                embeds: [resultEmbed],
                files:  [{ attachment, name: 'compare.png' }],
            });
        } catch (err) {
            console.error('[ERROR] Compare generation failed:', err);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate comparison. Please try again.')],
            });
        }
    },
};
