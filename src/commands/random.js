const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { registerAllFonts, getAllFontFamilies, renderIcon } = require('../utils/canvas.js');
const { getAllBackgroundIds } = require('../utils/backgrounds.js');
const { getAllBorderIds } = require('../utils/borders.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const SHAPES = ['circle', 'rounded', 'square', 'hexagon', 'diamond'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomHex() { return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); }

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Generate a fully randomized server icon')
        .addStringOption(opt => opt.setName('text').setDescription('Text to display (random if omitted)')),

    async execute(interaction) {
        await interaction.deferReply();

        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const text       = interaction.options.getString('text') ?? pick(alphabet.split(''));
        const shape      = pick(SHAPES);
        const background = pick(getAllBackgroundIds());
        const border     = pick(getAllBorderIds());
        const primary    = randomHex();
        const secondary  = randomHex();
        const font       = pick(getAllFontFamilies());
        const glow       = Math.floor(Math.random() * 26);
        const opacity    = Math.round((0.5 + Math.random() * 0.5) * 100) / 100;

        const buf = await renderIcon({ text, shape, background, border, primary, secondary, font, glow, opacity });
        const attachment = new AttachmentBuilder(buf, { name: 'random-icon.png' });

        const shapeLabel = shape.charAt(0).toUpperCase() + shape.slice(1);

        const embed = new EmbedBuilder()
            .setTitle('🎲 Random Icon')
            .setDescription('Here’s your randomized server icon!')
            .setImage('attachment://random-icon.png')
            .setColor(primary)
            .addFields(
                { name: 'Text',       value: text,       inline: true },
                { name: 'Shape',      value: shapeLabel, inline: true },
                { name: 'Background', value: background, inline: true },
                { name: 'Border',     value: border,     inline: true },
                { name: 'Primary',    value: primary,    inline: true },
                { name: 'Font',       value: font,       inline: true },
            )
            .setFooter({ text: 'Sigil • random' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'random', text, shape, background, border, primary_color: primary, secondary_color: secondary, font, glow, opacity });
    },
};
