const {
    SlashCommandBuilder, EmbedBuilder, AttachmentBuilder,
} = require('discord.js');
const { renderKit, registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getColorAutocomplete } = require('../utils/colors.js');
const guard = require('../utils/packageGuard');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('template')
        .setDescription('Generate a branded image template (announcement, event, etc.)')
        .addStringOption(opt => opt.setName('title').setDescription('Main title text').setRequired(true))
        .addStringOption(opt => opt.setName('subtitle').setDescription('Subtitle / description text'))
        .addStringOption(opt => opt.setName('primary').setDescription('Primary color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary').setDescription('Secondary color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        .addStringOption(opt => opt.setName('border').setDescription('Border style').addChoices(
            { name: 'None',   value: 'none'   },
            { name: 'Glow',   value: 'glow'   },
            { name: 'Solid',  value: 'solid'  },
            { name: 'Dashed', value: 'dashed' },
        ))
        .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0–25)').setMinValue(0).setMaxValue(25)),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        await interaction.respond(getColorAutocomplete(focused));
    },

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        await interaction.deferReply();

        const title      = interaction.options.getString('title');
        const subtitle   = interaction.options.getString('subtitle') ?? '';
        const primary    = interaction.options.getString('primary')    ?? '#8B0000';
        const secondary  = interaction.options.getString('secondary')  ?? '#4B0082';
        const background = interaction.options.getString('background') ?? 'midnight-gradient';
        const font       = interaction.options.getString('font')       ?? 'Arial Black';
        const border     = interaction.options.getString('border')     ?? 'glow';
        const glow       = interaction.options.getNumber('glow')       ?? 12;

        const bannerText = subtitle ? `${title} — ${subtitle}` : title;

        const { bannerBuf } = await renderKit({
            text: title.slice(0, 4).toUpperCase(),
            bannerText,
            background, border, primary, secondary,
            font, glow,
        });

        const attachment = new AttachmentBuilder(bannerBuf, { name: 'sigil-template.png' });

        const embed = new EmbedBuilder()
            .setTitle('🖼️ Template Generated')
            .setDescription(`**${title}**${subtitle ? `\n${subtitle}` : ''}`)
            .setColor(primary)
            .setFooter({ text: 'Sigil • /template' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    },
};
