const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { registerAllFonts, getAllFontFamilies, renderBanner } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getBorderChoices } = require('../utils/borders.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('splash')
        .setDescription('Generate a 1920×1080 server splash / invite background')
        .addStringOption(opt => opt.setName('text').setDescription('Main heading text').setRequired(true))
        .addStringOption(opt => opt.setName('subtitle').setDescription('Subtitle / tagline'))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('border').setDescription('Border style').addChoices(...getBorderChoices()))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Primary hex color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary_color').setDescription('Secondary hex color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0–25)').setMinValue(0).setMaxValue(25))
        .addNumberOption(opt => opt.setName('opacity').setDescription('Background opacity (0.0–1.0)').setMinValue(0).setMaxValue(1)),

    async autocomplete(interaction) {
        await dispatchAutocomplete(interaction, {
            primary_color:   autocompleteColor,
            secondary_color: autocompleteColor,
        });
    },

    async execute(interaction) {
        await interaction.deferReply();

        const text       = interaction.options.getString('text');
        const subtitle   = interaction.options.getString('subtitle')       ?? '';
        const background = interaction.options.getString('background')     ?? 'gradient-purple';
        const border     = interaction.options.getString('border')         ?? 'none';
        const primary    = interaction.options.getString('primary_color')  ?? '#ffffff';
        const secondary  = interaction.options.getString('secondary_color') ?? '#aaaaaa';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];
        const glow       = interaction.options.getNumber('glow')           ?? 0;
        const opacity    = interaction.options.getNumber('opacity')        ?? 1.0;

        const buf = await renderBanner({ text, subtitle, background, border, primary, secondary, font, align: 'center', glow, opacity, width: 1920, height: 1080 });
        const attachment = new AttachmentBuilder(buf, { name: 'splash.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🌊 Splash — ${text}`)
            .setDescription(subtitle || 'Your server splash screen is ready. Upload it in **Server Settings → Overview**.')
            .setImage('attachment://splash.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • splash — 1920×1080 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'splash', text, subtitle, background, border, primary_color: primary, secondary_color: secondary, font, glow, opacity });
    },
};
