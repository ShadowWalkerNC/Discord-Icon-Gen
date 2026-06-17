const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, registerFont } = require('canvas');
const { getFont, getFontChoices, getAllFonts } = require('../utils/fonts');
const { createTextGradient } = require('../utils/gradient');
const { getColorAutocomplete } = require('../utils/colors');

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const MAX_TEXT_LENGTH = 20;
const MIN_FONT_SIZE   = 10;
const MAX_FONT_SIZE   = 200;
const CANVAS_SIZE     = 512;

for (const font of getAllFonts()) {
    try { registerFont(font.file, { family: font.family }); }
    catch (e) { console.error(`[ERROR] Failed to register font '${font.family}':`, e.message); }
}

module.exports = {
    cooldown: 4,
    data: new SlashCommandBuilder()
        .setName('logo')
        .setDescription('Generate a 512×512 transparent PNG logo.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription(`Logo text (max ${MAX_TEXT_LENGTH} chars)`)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('size')
                .setDescription(`Font size in pixels (${MIN_FONT_SIZE}–${MAX_FONT_SIZE})`)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Text and shape colour — pick a preset or type a hex code like #FF4500')
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
            option.setName('color2')
                .setDescription('Optional second colour for a gradient — pick a preset or type a hex code')
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('shape')
                .setDescription('Optional decorative shape behind the text')
                .setRequired(false)
                .addChoices(
                    { name: 'None',        value: 'none'      },
                    { name: 'Circle Ring', value: 'circle'    },
                    { name: 'Underline',   value: 'underline' }
                ))
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
        const shape         = interaction.options.getString('shape') || 'none';
        const fontKey       = interaction.options.getString('font') || 'another-danger';

        if (text.length > MAX_TEXT_LENGTH)
            return interaction.reply({ content: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`, ephemeral: true });
        if (size < MIN_FONT_SIZE || size > MAX_FONT_SIZE)
            return interaction.reply({ content: `Font size must be between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}.`, ephemeral: true });
        if (!HEX_COLOR_REGEX.test(color))
            return interaction.reply({ content: '❌ Color must be a valid hex code. Pick from the dropdown or type e.g. #FF4500.', ephemeral: true });
        if (color2 && !HEX_COLOR_REGEX.test(color2))
            return interaction.reply({ content: '❌ Color2 must be a valid hex code. Pick from the dropdown or type e.g. #FF00FF.', ephemeral: true });

        const loadingEmbed = new EmbedBuilder().setColor('#808080').setDescription('✦ Generating your logo…');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const canvas  = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
            const ctx     = canvas.getContext('2d');
            const font    = getFont(fontKey);
            const shadowBlur = Number(glowIntensity);
            const centerX = CANVAS_SIZE / 2;
            const centerY = CANVAS_SIZE / 2;

            ctx.strokeStyle = color;
            ctx.fillStyle   = color;

            if (shape === 'circle') {
                const radius = CANVAS_SIZE * 0.42;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.lineWidth   = 3;
                ctx.shadowColor = color;
                ctx.shadowBlur  = shadowBlur;
                ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur  = 0;
                ctx.stroke();
            }

            ctx.font         = `${size}px '${font.family}'`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';

            const fill = createTextGradient(ctx, color, color2, text, centerX, CANVAS_SIZE);

            ctx.shadowColor = color;
            ctx.shadowBlur  = shadowBlur;
            ctx.fillStyle   = fill;
            ctx.fillText(text, centerX, centerY);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur  = 0;
            ctx.fillText(text, centerX, centerY);

            if (shape === 'underline') {
                const metrics  = ctx.measureText(text);
                const lineW    = metrics.width * 1.1;
                const lineY    = centerY + size * 0.65;
                ctx.beginPath();
                ctx.moveTo(centerX - lineW / 2, lineY);
                ctx.lineTo(centerX + lineW / 2, lineY);
                ctx.lineWidth   = Math.max(2, size * 0.04);
                ctx.shadowColor = color;
                ctx.shadowBlur  = shadowBlur;
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur  = 0;
                ctx.stroke();
            }

            const attachment = canvas.toBuffer();
            const colorLabel = color2 ? `gradient ${color}→${color2}` : color;

            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#808080')
                        .setImage('attachment://logo.png')
                        .setFooter({ text: `Sigil • /logo • transparent • shape: ${shape} • ${colorLabel} • font: ${font.label}` }),
                ],
                files: [{ attachment, name: 'logo.png' }],
            });
        } catch (error) {
            console.error('[ERROR] Logo generation failed:', error);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate your logo. Please try again.')],
            });
        }
    },
};
