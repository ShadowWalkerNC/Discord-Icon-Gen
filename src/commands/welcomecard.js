const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor, autocompleteBackground } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomecard')
        .setDescription('Generate a welcome card image for new members')
        .addUserOption(opt => opt.setName('user').setDescription('New member to welcome').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Custom welcome message'))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Accent color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary_color').setDescription('Secondary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f })))),

    async autocomplete(interaction) {
        await dispatchAutocomplete(interaction, {
            primary_color:   autocompleteColor,
            secondary_color: autocompleteColor,
            background:      autocompleteBackground,
        });
    },

    async execute(interaction) {
        await interaction.deferReply();

        const target     = interaction.options.getUser('user');
        const message    = interaction.options.getString('message')        ?? `Welcome to ${interaction.guild?.name ?? 'the server'}!`;
        const primary    = interaction.options.getString('primary_color')  ?? '#5865F2';
        const secondary  = interaction.options.getString('secondary_color') ?? '#ffffff';
        const background = interaction.options.getString('background')     ?? 'gradient-purple';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];

        const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

        const W = 700, H = 200;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        let avatar;
        try { avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 128 })); } catch { avatar = null; }
        if (avatar) {
            ctx.save();
            ctx.beginPath(); ctx.arc(100, H/2, 65, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(avatar, 35, H/2 - 65, 130, 130);
            ctx.restore();
            ctx.beginPath(); ctx.arc(100, H/2, 67, 0, Math.PI*2);
            ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();
        }

        ctx.font = `bold 32px "${font}"`; ctx.fillStyle = secondary;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Welcome!', 195, 90);
        ctx.font = `20px "${font}"`; ctx.fillStyle = '#ffffff';
        ctx.fillText(member?.displayName ?? target.username, 195, 122);
        ctx.font = `15px "${font}"`; ctx.fillStyle = '#99AAB5';
        ctx.fillText(message, 195, 152);

        const memberCount = interaction.guild?.memberCount ?? '?';
        ctx.font = `13px "${font}"`; ctx.fillStyle = primary;
        ctx.textAlign = 'right';
        ctx.fillText(`Member #${memberCount}`, W - 20, H - 15);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'welcomecard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome, ${member?.displayName ?? target.username}!`)
            .setDescription(message)
            .setImage('attachment://welcomecard.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • welcomecard' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'welcomecard', target: target.id, message, primary_color: primary, secondary_color: secondary, background, font });
    },
};
