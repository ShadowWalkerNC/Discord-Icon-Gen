const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const guard = require('../utils/packageGuard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Side-by-side comparison of two server icons or images')
        .addAttachmentOption(opt => opt.setName('image_a').setDescription('First image').setRequired(true))
        .addAttachmentOption(opt => opt.setName('image_b').setDescription('Second image').setRequired(true))
        .addStringOption(opt => opt.setName('label_a').setDescription('Label for image A'))
        .addStringOption(opt => opt.setName('label_b').setDescription('Label for image B')),

    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        await interaction.deferReply();
        const imgA   = interaction.options.getAttachment('image_a');
        const imgB   = interaction.options.getAttachment('image_b');
        const labelA = interaction.options.getString('label_a') ?? 'Option A';
        const labelB = interaction.options.getString('label_b') ?? 'Option B';

        const W = 860, H = 340, PAD = 20;
        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');
        ctx.fillStyle = '#1e1f22'; ctx.fillRect(0, 0, W, H);

        const [a, b] = await Promise.all([loadImage(imgA.url), loadImage(imgB.url)]);
        const iW = (W - PAD * 3) / 2, iH = H - PAD * 2 - 36;
        ctx.drawImage(a, PAD,           PAD, iW, iH);
        ctx.drawImage(b, PAD * 2 + iW,  PAD, iW, iH);

        ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText(labelA, PAD + iW / 2,          H - PAD - 4);
        ctx.fillText(labelB, PAD * 2 + iW + iW / 2, H - PAD - 4);

        ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
        ctx.strokeRect(PAD, PAD, iW, iH);
        ctx.strokeRect(PAD * 2 + iW, PAD, iW, iH);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'sigil-compare.png' });
        await interaction.editReply({ content: '🎨 Comparison ready!', files: [attachment] });
    },
};
