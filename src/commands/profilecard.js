const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor, autocompleteBackground } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profilecard')
        .setDescription('Generate a stylised profile card for yourself or another member')
        .addUserOption(opt => opt.setName('user').setDescription('Member to display (default: you)'))
        .addStringOption(opt => opt.setName('bio').setDescription('Short bio text'))
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

        const target     = interaction.options.getUser('user')             ?? interaction.user;
        const bio        = interaction.options.getString('bio')            ?? 'No bio set.';
        const primary    = interaction.options.getString('primary_color')  ?? '#5865F2';
        const secondary  = interaction.options.getString('secondary_color') ?? '#99AAB5';
        const background = interaction.options.getString('background')     ?? 'gradient-dark';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];

        const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

        const W = 600, H = 300;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        let avatar;
        try { avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 128 })); } catch { avatar = null; }
        if (avatar) {
            ctx.save();
            ctx.beginPath(); ctx.arc(90, 110, 65, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(avatar, 25, 45, 130, 130);
            ctx.restore();
            ctx.beginPath(); ctx.arc(90, 110, 67, 0, Math.PI*2);
            ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();
        }

        ctx.font = `bold 26px "${font}"`; ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(member?.displayName ?? target.username, 180, 90);
        ctx.font = `15px "${font}"`; ctx.fillStyle = '#99AAB5';
        ctx.fillText(`@${target.username}`, 180, 115);

        ctx.font = `14px "${font}"`; ctx.fillStyle = '#cccccc';
        const words = bio.split(' ');
        let line = '', lines = [], by = 150;
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > W - 200) { lines.push(line); line = w; }
            else line = t;
        }
        if (line) lines.push(line);
        lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, 180, by + i * 22));

        const topRoles = member?.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .first(3);
        if (topRoles?.size) {
            ctx.font = `13px "${font}"`; ctx.fillStyle = primary;
            ctx.fillText(topRoles.map(r => r.name).join(' • '), 180, H - 30);
        }

        const divGrad = ctx.createLinearGradient(0, 0, W, 0);
        divGrad.addColorStop(0, primary); divGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = divGrad; ctx.fillRect(0, H - 6, W, 6);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'profilecard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${member?.displayName ?? target.username}'s Profile`)
            .setDescription(bio)
            .setImage('attachment://profilecard.png')
            .setColor(primary)
            .setFooter({ text: 'Sigil • profilecard' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'profilecard', target: target.id, bio, primary_color: primary, secondary_color: secondary, background, font });
    },
};
