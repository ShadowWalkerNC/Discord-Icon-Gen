const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor, autocompleteBackground } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankcard')
        .setDescription('Generate a stylised XP rank card for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Member to display (default: you)'))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Primary accent color').setAutocomplete(true))
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

        const target     = interaction.options.getUser('user')           ?? interaction.user;
        const primary    = interaction.options.getString('primary_color')   ?? '#5865F2';
        const secondary  = interaction.options.getString('secondary_color') ?? '#99AAB5';
        const background = interaction.options.getString('background')      ?? 'gradient-dark';
        const font       = interaction.options.getString('font')            ?? getAllFontFamilies()[0];

        const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
        const xpData = { level: 1, xp: 0, xpNeeded: 100, rank: 1 };

        const W = 800, H = 200;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        let avatar;
        try { avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 128 })); } catch { avatar = null; }
        if (avatar) {
            ctx.save();
            ctx.beginPath(); ctx.arc(100, H/2, 70, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(avatar, 30, H/2 - 70, 140, 140);
            ctx.restore();
            ctx.beginPath(); ctx.arc(100, H/2, 71, 0, Math.PI*2);
            ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();
        }

        ctx.font = `bold 28px "${font}"`; ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(member?.displayName ?? target.username, 200, 80);
        ctx.font = `16px "${font}"`; ctx.fillStyle = '#99AAB5';
        ctx.fillText(`@${target.username}`, 200, 108);

        ctx.font = `bold 22px "${font}"`; ctx.fillStyle = primary;
        ctx.textAlign = 'right';
        ctx.fillText(`Level ${xpData.level}`, W - 40, 55);
        ctx.font = `16px "${font}"`; ctx.fillStyle = '#99AAB5';
        ctx.fillText(`Rank #${xpData.rank}`, W - 40, 80);
        ctx.textAlign = 'left';

        const barX = 200, barY = 130, barW = W - 260, barH = 20;
        ctx.fillStyle = '#2C2F33';
        ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, barH/2); ctx.fill();
        const prog = Math.max(0.02, xpData.xp / xpData.xpNeeded);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, primary); barGrad.addColorStop(1, secondary);
        ctx.fillStyle = barGrad;
        ctx.beginPath(); ctx.roundRect(barX, barY, barW * prog, barH, barH/2); ctx.fill();

        ctx.font = `14px "${font}"`; ctx.fillStyle = '#99AAB5'; ctx.textAlign = 'right';
        ctx.fillText(`${xpData.xp} / ${xpData.xpNeeded} XP`, W - 40, 162);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'rankcard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`📊 Rank Card — ${member?.displayName ?? target.username}`)
            .setImage('attachment://rankcard.png')
            .setColor(primary)
            .addFields(
                { name: 'Level', value: `${xpData.level}`, inline: true },
                { name: 'XP',    value: `${xpData.xp} / ${xpData.xpNeeded}`, inline: true },
                { name: 'Rank',  value: `#${xpData.rank}`, inline: true },
            )
            .setFooter({ text: 'Sigil • rankcard' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'rankcard', target: target.id, primary_color: primary, secondary_color: secondary, background, font });
    },
};
