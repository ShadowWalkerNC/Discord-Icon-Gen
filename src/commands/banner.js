const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { renderKit, registerAllFonts } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getAllFontFamilies } = require('../utils/canvas.js');
const { getColorAutocomplete } = require('../utils/colors.js');
const guard = require('../utils/packageGuard');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Generate a server banner')
        .addStringOption(opt => opt.setName('text').setDescription('Banner text').setRequired(true))
        .addStringOption(opt => opt.setName('primary').setDescription('Primary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary').setDescription('Secondary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addStringOption(opt => opt.setName('border').setDescription('Border style').addChoices(
            { name: 'None', value: 'none' },
            { name: 'Glow', value: 'glow' },
            { name: 'Solid', value: 'solid' },
            { name: 'Dashed', value: 'dashed' },
        ))
        .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0-25)').setMinValue(0).setMaxValue(25)),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        await interaction.respond(getColorAutocomplete(focused));
    },

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        await interaction.deferReply();
        const text       = interaction.options.getString('text');
        const primary    = interaction.options.getString('primary')    ?? '#8B0000';
        const secondary  = interaction.options.getString('secondary')  ?? '#4B0082';
        const background = interaction.options.getString('background') ?? 'midnight-gradient';
        const font       = interaction.options.getString('font')       ?? 'Arial Black';
        const border     = interaction.options.getString('border')     ?? 'none';
        const glow       = interaction.options.getNumber('glow')       ?? 10;
        const { bannerBuf } = await renderKit({ text, bannerText: text, background, primary, secondary, font, border, glow });
        const attachment = new AttachmentBuilder(bannerBuf, { name: 'sigil-banner.png' });
        await interaction.editReply({ content: '🎨 Here\'s your server banner!', files: [attachment] });
    },
};
