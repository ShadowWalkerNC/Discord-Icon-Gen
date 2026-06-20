const {
    SlashCommandBuilder, EmbedBuilder, AttachmentBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { renderKit, registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getColorAutocomplete } = require('../utils/colors.js');
const guard = require('../utils/packageGuard');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brand')
        .setDescription('Generate a full brand kit: icon + banner + palette preview')
        .addSubcommand(sub => sub
            .setName('generate')
            .setDescription('Generate a complete brand kit')
            .addStringOption(opt => opt.setName('name').setDescription('Server / brand name').setRequired(true))
            .addStringOption(opt => opt.setName('primary').setDescription('Primary color (hex)').setAutocomplete(true))
            .addStringOption(opt => opt.setName('secondary').setDescription('Secondary color (hex)').setAutocomplete(true))
            .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
            .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
            .addStringOption(opt => opt.setName('shape').setDescription('Icon shape').addChoices(
                { name: 'Circle',  value: 'circle'  },
                { name: 'Rounded', value: 'rounded' },
                { name: 'Hexagon', value: 'hexagon' },
                { name: 'Diamond', value: 'diamond' },
                { name: 'Square',  value: 'square'  },
            ))
            .addStringOption(opt => opt.setName('border').setDescription('Banner border style').addChoices(
                { name: 'None',   value: 'none'   },
                { name: 'Glow',   value: 'glow'   },
                { name: 'Solid',  value: 'solid'  },
                { name: 'Dashed', value: 'dashed' },
            ))
            .addNumberOption(opt => opt.setName('glow').setDescription('Glow intensity (0–25)').setMinValue(0).setMaxValue(25))
            .addNumberOption(opt => opt.setName('opacity').setDescription('Background opacity (0–1)').setMinValue(0).setMaxValue(1))
        )
        .addSubcommand(sub => sub
            .setName('preview')
            .setDescription('Preview the brand kit for this server using saved settings')
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        await interaction.respond(getColorAutocomplete(focused));
    },

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;

        const sub = interaction.options.getSubcommand();
        await interaction.deferReply();

        const name       = interaction.options.getString('name')       ?? interaction.guild.name;
        const primary    = interaction.options.getString('primary')    ?? '#8B0000';
        const secondary  = interaction.options.getString('secondary')  ?? '#4B0082';
        const background = interaction.options.getString('background') ?? 'midnight-gradient';
        const font       = interaction.options.getString('font')       ?? 'Arial Black';
        const shape      = interaction.options.getString('shape')      ?? 'circle';
        const border     = interaction.options.getString('border')     ?? 'none';
        const glow       = interaction.options.getNumber('glow')       ?? 10;
        const opacity    = interaction.options.getNumber('opacity')    ?? 0.85;

        const iconText = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'SGL';

        const { iconBuf, bannerBuf, paletteBuf } = await renderKit({
            text: iconText, bannerText: name,
            background, border, primary, secondary,
            font, glow, opacity, shape,
        });

        const files = [
            new AttachmentBuilder(iconBuf,    { name: 'brand-icon.png'    }),
            new AttachmentBuilder(bannerBuf,  { name: 'brand-banner.png'  }),
            new AttachmentBuilder(paletteBuf, { name: 'brand-palette.png' }),
        ];

        const embed = new EmbedBuilder()
            .setTitle('🎨 Brand Kit Generated')
            .setDescription(`Here’s your complete brand kit for **${name}**.`)
            .addFields(
                { name: 'Primary',    value: primary,    inline: true },
                { name: 'Secondary',  value: secondary,  inline: true },
                { name: 'Background', value: background, inline: true },
                { name: 'Font',       value: font,       inline: true },
                { name: 'Shape',      value: shape,      inline: true },
                { name: 'Border',     value: border,     inline: true },
            )
            .setColor(primary)
            .setFooter({ text: 'Sigil • /brand generate' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Open Brand Dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL(`${process.env.GUI_URL ?? 'http://localhost:8080'}/brand`),
        );

        await interaction.editReply({ embeds: [embed], files, components: [row] });
    },
};
