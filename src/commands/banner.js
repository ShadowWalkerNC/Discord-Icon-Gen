const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');
const path = require('path');
const { getFont, getFontChoices } = require('../utils/fonts');

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const MAX_TEXT_LENGTH = 30;
const MAX_SUBTITLE_LENGTH = 50;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 150;

const BANNER_WIDTH = 1024;
const BANNER_HEIGHT = 320;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Generate a 1024x320 server banner image.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription(`Primary text on the banner (max ${MAX_TEXT_LENGTH} chars)`)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('size')
                .setDescription(`Font size in pixels (${MIN_FONT_SIZE}–${MAX_FONT_SIZE})`)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Text color in hex format (e.g. #FF0000)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('glow')
                .setDescription('Glow intensity around the text')
                .setRequired(true)
                .addChoices(
                    { name: 'Low', value: '5' },
                    { name: 'Medium', value: '10' },
                    { name: 'High', value: '15' }
                ))
        .addStringOption(option =>
            option.setName('background')
                .setDescription('Background style for the banner')
                .setRequired(true)
                .addChoices(
                    { name: 'Plain (Black)', value: 'plain' },
                    { name: 'Custom Background 1', value: 'custom1' },
                    { name: 'Custom Background 2', value: 'custom2' }
                ))
        .addStringOption(option =>
            option.setName('subtitle')
                .setDescription(`Optional subtitle beneath main text (max ${MAX_SUBTITLE_LENGTH} chars)`)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('font')
                .setDescription('Font style for the text')
                .setRequired(false)
                .addChoices(...getFontChoices())),

    async execute(interaction) {
        const text = interaction.options.getString('text');
        const size = interaction.options.getInteger('size');
        const color = interaction.options.getString('color');
        const glowIntensity = interaction.options.getString('glow') || '5';
        const background = interaction.options.getString('background');
        const subtitle = interaction.options.getString('subtitle') || null;
        const fontKey = interaction.options.getString('font') || 'another-danger';

        // Input validation
        if (text.length > MAX_TEXT_LENGTH) {
            return interaction.reply({
                content: `Primary text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
                ephemeral: true,
            });
        }
        if (subtitle && subtitle.length > MAX_SUBTITLE_LENGTH) {
            return interaction.reply({
                content: `Subtitle must be ${MAX_SUBTITLE_LENGTH} characters or fewer.`,
                ephemeral: true,
            });
        }
        if (size < MIN_FONT_SIZE || size > MAX_FONT_SIZE) {
            return interaction.reply({
                content: `Font size must be between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}.`,
                ephemeral: true,
            });
        }
        if (!HEX_COLOR_REGEX.test(color)) {
            return interaction.reply({
                content: 'Color must be a valid hex code (e.g. `#FF0000` or `#F00`).',
                ephemeral: true,
            });
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setDescription('Generating your banner...');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const canvas = createCanvas(BANNER_WIDTH, BANNER_HEIGHT);
            const ctx = canvas.getContext('2d');

            const font = getFont(fontKey);
            registerFont(font.file, { family: font.family });

            // Draw background
            if (background === 'custom1' || background === 'custom2') {
                const bgFile = background === 'custom1' ? 'background1.jpg' : 'background2.jpg';
                const bgPath = path.resolve(__dirname, '..', 'images', bgFile);
                const backgroundImage = await loadImage(bgPath);
                ctx.drawImage(backgroundImage, 0, 0, BANNER_WIDTH, BANNER_HEIGHT);
            } else {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
            }

            const shadowBlur = parseInt(glowIntensity);
            const centerX = BANNER_WIDTH / 2;

            // Calculate vertical position — shift up if subtitle present
            const centerY = subtitle
                ? BANNER_HEIGHT / 2 - size * 0.3
                : BANNER_HEIGHT / 2;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Main text — no rotation on banners
            ctx.font = `${size}px '${font.family}'`;
            ctx.shadowColor = color;
            ctx.shadowBlur = shadowBlur;
            ctx.fillStyle = color;
            ctx.fillText(text, centerX, centerY);

            // Crisp pass
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillText(text, centerX, centerY);

            // Subtitle — 40% of main size, muted alpha
            if (subtitle) {
                const subtitleSize = Math.max(12, Math.round(size * 0.4));
                const subtitleY = centerY + size * 0.75;
                ctx.font = `${subtitleSize}px '${font.family}'`;
                ctx.globalAlpha = 0.75;
                ctx.shadowColor = color;
                ctx.shadowBlur = Math.round(shadowBlur * 0.5);
                ctx.fillStyle = color;
                ctx.fillText(subtitle, centerX, subtitleY);
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.fillText(subtitle, centerX, subtitleY);
                ctx.globalAlpha = 1.0;
            }

            const attachment = canvas.toBuffer();
            const footerParts = [`font: ${font.label}`];
            if (subtitle) footerParts.push(`subtitle: "${subtitle}"`);

            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#808080')
                        .setImage('attachment://banner.png')
                        .setFooter({ text: `Discord Icon Gen • /banner • ${footerParts.join(' • ')}` }),
                ],
                files: [{ attachment, name: 'banner.png' }],
            });
        } catch (error) {
            console.error('[ERROR] Banner generation failed:', error);
            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('Failed to generate your banner. Please try again.'),
                ],
            });
        }
    },
};
