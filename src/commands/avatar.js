const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies, renderIcon, applyShapeClip } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getBorderChoices } = require('../utils/borders.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const AVATAR_SIZE = 512;

const SHAPE_CHOICES = [
    { name: 'Circle',  value: 'circle'  },
    { name: 'Rounded', value: 'rounded' },
    { name: 'Square',  value: 'square'  },
    { name: 'Hexagon', value: 'hexagon' },
    { name: 'Diamond', value: 'diamond' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Generate a server avatar / profile icon with an overlay image')
        .addStringOption(opt => opt.setName('text').setDescription('Text to display').setRequired(true))
        .addStringOption(opt => opt.setName('shape').setDescription('Icon shape').addChoices(...SHAPE_CHOICES))
        .addStringOption(opt => opt.setName('overlay').setDescription('URL of image to overlay').setRequired(false))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('border').setDescription('Border style').addChoices(...getBorderChoices()))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Primary hex color (e.g. #ff0000)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary_color').setDescription('Secondary hex color (e.g. #0000ff)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0–25)').setMinValue(0).setMaxValue(25))
        .addNumberOption(opt => opt.setName('opacity').setDescription('Background opacity (0.0–1.0)').setMinValue(0).setMaxValue(1)),

    async autocomplete(interaction) {
        const { colorAutocomplete } = require('../utils/colors.js');
        await colorAutocomplete(interaction);
    },

    async execute(interaction) {
        await interaction.deferReply();

        const text       = interaction.options.getString('text');
        const shape      = interaction.options.getString('shape')          ?? 'circle';
        const overlayURL = interaction.options.getString('overlay');
        const background = interaction.options.getString('background')     ?? 'gradient-purple';
        const border     = interaction.options.getString('border')         ?? 'none';
        const primary    = interaction.options.getString('primary_color')  ?? '#ffffff';
        const secondary  = interaction.options.getString('secondary_color') ?? '#aaaaaa';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];
        const glow       = interaction.options.getNumber('glow')           ?? 0;
        const opacity    = interaction.options.getNumber('opacity')        ?? 1.0;

        // 1. Render the base icon (shape clip applied inside renderIcon)
        const iconBuf = await renderIcon({ text, shape, background, border, primary, secondary, font, glow, opacity });

        // 2. If overlay URL provided, composite it using the same shape clip
        let finalBuf = iconBuf;
        if (overlayURL) {
            try {
                const base    = await loadImage(iconBuf);
                const overlay = await loadImage(overlayURL);

                const canvas = createCanvas(AVATAR_SIZE, AVATAR_SIZE);
                const ctx    = canvas.getContext('2d');

                // Draw base icon (already shape-clipped)
                ctx.drawImage(base, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

                // Clip overlay to the same shape so it never bleeds outside
                ctx.save();
                applyShapeClip(ctx, AVATAR_SIZE, AVATAR_SIZE, shape);

                const scale = Math.min(AVATAR_SIZE / overlay.width, AVATAR_SIZE / overlay.height);
                const w = overlay.width  * scale;
                const h = overlay.height * scale;
                const x = (AVATAR_SIZE - w) / 2;
                const y = (AVATAR_SIZE - h) / 2;
                ctx.drawImage(overlay, x, y, w, h);
                ctx.restore();

                finalBuf = canvas.toBuffer('image/png');
            } catch (err) {
                console.error('[avatar] Overlay load failed:', err.message);
                // fall back to base icon without overlay
            }
        }

        const attachment = new AttachmentBuilder(finalBuf, { name: 'avatar.png' });
        const shapeLabel = SHAPE_CHOICES.find(s => s.value === shape)?.name ?? shape;

        const embed = new EmbedBuilder()
            .setTitle(`🖼️ ${text}`)
            .setDescription('Your custom server avatar is ready!')
            .setImage('attachment://avatar.png')
            .setColor(primary)
            .addFields({ name: 'Shape', value: shapeLabel, inline: true })
            .setFooter({ text: 'Sigil • avatar' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });

        saveEntry(interaction.user.id, {
            command: 'avatar', text, shape, background, border,
            primary_color: primary, secondary_color: secondary,
            font, glow, opacity,
        });
    },
};
