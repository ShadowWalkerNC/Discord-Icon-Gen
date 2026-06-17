const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const { getFont, getFontChoices, getAllFonts } = require('../utils/fonts');
const { createTextGradient } = require('../utils/gradient');
const { getBackgroundChoices, drawBackground } = require('../utils/backgrounds');
const { getColorAutocomplete } = require('../utils/colors');

const HEX_COLOR_REGEX  = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const MAX_TEXT_LENGTH  = 30;
const MAX_SUB_LENGTH   = 50;
const MIN_FONT_SIZE    = 10;
const MAX_FONT_SIZE    = 150;
const CANVAS_WIDTH     = 1024;
const CANVAS_HEIGHT    = 320;

const ALIGN_X = {
    left:   CANVAS_WIDTH * 0.05,
    center: CANVAS_WIDTH / 2,
    right:  CANVAS_WIDTH * 0.95,
};

for (const font of getAllFonts()) {
    try { registerFont(font.file, { family: font.family }); }
    catch (e) { console.error(`[ERROR] Failed to register font '${font.family}':`, e.message); }
}

module.exports = {
    cooldown: 4,
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Generate a 1024×320 server banner.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription(`Primary banner text (max ${MAX_TEXT_LENGTH} chars)`)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('size')
                .setDescription(`Font size in pixels (${MIN_FONT_SIZE}–${MAX_FONT_SIZE})`)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Text colour — pick a preset or type a hex code like #00FFFF')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('glow')
                .setDescription('Glow intensity')
                .setRequired(true)
                .addChoices(
                    { name: 'None',   value: '0'  },
                    { name: 'Low',    value: '5'  },
                    { name: 'Medium', value: '10' },
                    { name: 'High',   value: '15' },
                    { name: 'Ultra',  value: '25' }
                ))
        .addStringOption(option =>
            option.setName('background')
                .setDescription('Background style')
                .setRequired(true)
                .addChoices(...getBackgroundChoices()))
        .addStringOption(option =>
            option.setName('align')
                .setDescription('Text alignment (default: Center)')
                .setRequired(false)
                .addChoices(
                    { name: 'Left',   value: 'left'   },
                    { name: 'Center', value: 'center' },
                    { name: 'Right',  value: 'right'  }
                ))
        .addStringOption(option =>
            option.setName('color2')
                .setDescription('Optional second colour for a gradient — pick a preset or type a hex code')
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('subtitle')
                .setDescription(`Optional subtitle beneath main text (max ${MAX_SUB_LENGTH} chars)`)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('opacity')
                .setDescription('Background opacity 10–100 (default: 100)')
                .setMinValue(10)
                .setMaxValue(100)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('font')
                .setDescription('Font style for the text')
                .setRequired(false)
                .addChoices(...getFontChoices())),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'color' || focused.name === 'color2') {
            await interaction.respond(getColorAutocomplete(focused.value));
        }
    },

    async execute(interaction) {
        const text          = interaction.options.getString('text');
        const size          = interaction.options.getInteger('size');
        const color         = interaction.options.getString('color');
        const color2        = interaction.options.getString('color2') || null;
        const glowIntensity = interaction.options.getString('glow') || '5';
        const background    = interaction.options.getString('background') || 'plain-black';
        const align         = interaction.options.getString('align') || 'center';
        const subtitle      = interaction.options.getString('subtitle') || null;
        const opacity       = interaction.options.getInteger('opacity') ?? 100;
        const fontKey       = interaction.options.getString('font') || 'another-danger';

        if (text.length > MAX_TEXT_LENGTH)
            return interaction.reply({ content: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`, ephemeral: true });
        if (subtitle && subtitle.length > MAX_SUB_LENGTH)
            return interaction.reply({ content: `Subtitle must be ${MAX_SUB_LENGTH} characters or fewer.`, ephemeral: true });
        if (size < MIN_FONT_SIZE || size > MAX_FONT_SIZE)
            return interaction.reply({ content: `Font size must be between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}.`, ephemeral: true });
        if (!HEX_COLOR_REGEX.test(color))
            return interaction.reply({ content: '❌ Color must be a valid hex code. Pick from the dropdown or type e.g. #00FFFF.', ephemeral: true });
        if (color2 && !HEX_COLOR_REGEX.test(color2))
            return interaction.reply({ content: '❌ Color2 must be a valid hex code. Pick from the dropdown or type e.g. #FF00FF.', ephemeral: true });

        const loadingEmbed = new EmbedBuilder().setColor('#808080').setDescription('✦ Generating your banner…');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            const ctx    = canvas.getContext('2d');

            await drawBackground(ctx, background, CANVAS_WIDTH, CANVAS_HEIGHT, loadImage);
            if (opacity < 100) {
                ctx.globalAlpha = 1 - (opacity / 100);
                ctx.fillStyle   = '#000000';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.globalAlpha = 1.0;
            }

            const font       = getFont(fontKey);
            const shadowBlur = Number(glowIntensity);
            const textX      = ALIGN_X[align] ?? ALIGN_X.center;
            const textY      = subtitle ? CANVAS_HEIGHT * 0.42 : CANVAS_HEIGHT / 2;

            ctx.font         = `${size}px '${font.family}'`;
            ctx.textAlign    = align;
            ctx.textBaseline = 'middle';

            const fill = createTextGradient(ctx, color, color2, text, textX, CANVAS_WIDTH);

            ctx.shadowColor = color;
            ctx.shadowBlur  = shadowBlur;
            ctx.fillStyle   = fill;
            ctx.fillText(text, textX, textY);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur  = 0;
            ctx.fillText(text, textX, textY);

            if (subtitle) {
                const subSize = Math.round(size * 0.4);
                const subY    = textY + size * 0.75;
                ctx.font      = `${subSize}px '${font.family}'`;
                ctx.textAlign = align;

                const subFill = createTextGradient(ctx, color, color2, subtitle, textX, CANVAS_WIDTH);

                ctx.globalAlpha = 0.75;
                ctx.shadowColor = color;
                ctx.shadowBlur  = shadowBlur * 0.6;
                ctx.fillStyle   = subFill;
                ctx.fillText(subtitle, textX, subY);

                ctx.globalAlpha = 1.0;
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur  = 0;
                ctx.fillText(subtitle, textX, subY);
            }

            const attachment   = canvas.toBuffer();
            const colorLabel   = color2 ? `gradient ${color}→${color2}` : color;
            const opacityLabel = opacity < 100 ? ` • bg:${opacity}%` : '';

            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#808080')
                        .setImage('attachment://banner.png')
                        .setFooter({ text: `Sigil • /banner • ${background}${opacityLabel} • align: ${align} • ${colorLabel} • font: ${font.label}` }),
                ],
                files: [{ attachment, name: 'banner.png' }],
            });
        } catch (error) {
            console.error('[ERROR] Banner generation failed:', error);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate your banner. Please try again.')],
            });
        }
    },
};
