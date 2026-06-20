const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { renderKit, registerAllFonts } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getAllFontFamilies } = require('../utils/canvas.js');
const { getColorAutocomplete } = require('../utils/colors.js');
const guard = require('../utils/packageGuard');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('icon')
        .setDescription('Generate a server icon')
        .addStringOption(opt => opt.setName('text').setDescription('Icon text (1-4 chars)').setRequired(true))
        .addStringOption(opt => opt.setName('primary').setDescription('Primary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary').setDescription('Secondary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addStringOption(opt => opt.setName('shape').setDescription('Icon shape').addChoices(
            { name: 'Circle', value: 'circle' },
            { name: 'Rounded', value: 'rounded' },
            { name: 'Hexagon', value: 'hexagon' },
            { name: 'Diamond', value: 'diamond' },
            { name: 'Square', value: 'square' },
        ))
        .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0-25)').setMinValue(0).setMaxValue(25))
        .addNumberOption(opt => opt.setName('opacity').setDescription('Background opacity (0-1)').setMinValue(0).setMaxValue(1)),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        await interaction.respond(getColorAutocomplete(focused));
    },

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        await interaction.deferReply();
        const text       = interaction.options.getString('text').toUpperCase().slice(0, 4);
        const primary    = interaction.options.getString('primary')    ?? '#8B0000';
        const secondary  = interaction.options.getString('secondary')  ?? '#4B0082';
        const background = interaction.options.getString('background') ?? 'midnight-gradient';
        const font       = interaction.options.getString('font')       ?? 'Arial Black';
        const shape      = interaction.options.getString('shape')      ?? 'circle';
        const glow       = interaction.options.getNumber('glow')       ?? 10;
        const opacity    = interaction.options.getNumber('opacity')    ?? 0.85;
        const { iconBuf } = await renderKit({ text, background, primary, secondary, font, glow, opacity, shape });
        const attachment = new AttachmentBuilder(iconBuf, { name: 'sigil-icon.png' });
        await interaction.editReply({ content: '🎨 Here\'s your server icon!', files: [attachment] });
    },
};
