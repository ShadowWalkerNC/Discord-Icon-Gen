const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { registerAllFonts, getAllFontFamilies, renderIcon } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getBorderChoices } = require('../utils/borders.js');
const { saveEntry } = require('../utils/history.js');
const { SHAPE_CHOICES, dispatchAutocomplete, autocompleteColor } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('icon')
        .setDescription('Generate a server icon / avatar')
        .addStringOption(opt => opt.setName('text').setDescription('Initials or short text').setRequired(true))
        .addStringOption(opt => opt.setName('shape').setDescription('Icon shape').addChoices(...SHAPE_CHOICES))
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
        const shape      = interaction.options.getString('shape')          ?? 'circle';
        const background = interaction.options.getString('background')     ?? 'gradient-purple';
        const border     = interaction.options.getString('border')         ?? 'none';
        const primary    = interaction.options.getString('primary_color')  ?? '#ffffff';
        const secondary  = interaction.options.getString('secondary_color') ?? '#aaaaaa';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];
        const glow       = interaction.options.getNumber('glow')           ?? 0;
        const opacity    = interaction.options.getNumber('opacity')        ?? 1.0;

        const buf = await renderIcon({ text, shape, background, border, primary, secondary, font, glow, opacity });
        const attachment = new AttachmentBuilder(buf, { name: 'icon.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🖼️ Icon — ${text}`)
            .setDescription('Your server icon is ready. Upload it in **Server Settings → Overview → Server Icon**.')
            .setImage('attachment://icon.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • icon — 512×512 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'icon', text, shape, background, border, primary_color: primary, secondary_color: secondary, font, glow, opacity });
    },
};
