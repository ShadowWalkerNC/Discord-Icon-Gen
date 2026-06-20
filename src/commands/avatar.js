const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const guard = require('../utils/packageGuard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Generate a stylised avatar frame for a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to frame (defaults to you)'))
        .addStringOption(opt => opt.setName('color').setDescription('Frame accent color (hex)')),

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        await interaction.deferReply();
        const target  = interaction.options.getUser('user') ?? interaction.user;
        const color   = interaction.options.getString('color') ?? '#8B0000';
        const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });

        const W = 300, H = 300;
        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        // Draw placeholder ring
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
        ctx.beginPath(); ctx.arc(W/2, H/2, 110, 0, Math.PI*2);
        ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.stroke();
        ctx.font = 'bold 20px Arial'; ctx.fillStyle = color;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(target.username.slice(0,2).toUpperCase(), W/2, H/2);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'sigil-avatar.png' });
        await interaction.editReply({ content: `🎨 Avatar frame for **${target.username}**`, files: [attachment] });
    },
};
