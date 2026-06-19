const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getBorderChoices } = require('../utils/borders.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('namecard')
        .setDescription('Generate a name card / business card style graphic')
        .addStringOption(opt => opt.setName('name').setDescription('Display name or title').setRequired(true))
        .addStringOption(opt => opt.setName('role').setDescription('Role or subtitle'))
        .addStringOption(opt => opt.setName('tagline').setDescription('Short tagline or slogan'))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Primary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary_color').setDescription('Secondary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('border').setDescription('Border style').addChoices(...getBorderChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f })))),

    async autocomplete(interaction) {
        await dispatchAutocomplete(interaction, {
            primary_color:   autocompleteColor,
            secondary_color: autocompleteColor,
        });
    },

    async execute(interaction) {
        await interaction.deferReply();

        const name       = interaction.options.getString('name');
        const role       = interaction.options.getString('role')           ?? '';
        const tagline    = interaction.options.getString('tagline')        ?? '';
        const primary    = interaction.options.getString('primary_color')  ?? '#5865F2';
        const secondary  = interaction.options.getString('secondary_color') ?? '#ffffff';
        const background = interaction.options.getString('background')     ?? 'gradient-dark';
        const border     = interaction.options.getString('border')         ?? 'none';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];

        const W = 600, H = 200;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = primary; ctx.fillRect(0, 0, 8, H);

        ctx.font = `bold 32px "${font}"`; ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(name, 36, 80);
        if (role) { ctx.font = `18px "${font}"`; ctx.fillStyle = primary; ctx.fillText(role, 36, 112); }
        if (tagline) { ctx.font = `14px "${font}"`; ctx.fillStyle = '#99AAB5'; ctx.fillText(tagline, 36, 145); }

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'namecard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🪪 Name Card — ${name}`)
            .setDescription(role || tagline || 'Your custom name card is ready.')
            .setImage('attachment://namecard.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • namecard' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'namecard', name, role, tagline, primary_color: primary, secondary_color: secondary, background, border, font });
    },
};
