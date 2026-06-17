const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas }                                          = require('canvas');
const { registerAllFonts, getAllFontFamilies }                  = require('../utils/canvas');
const { getBackgroundChoices, drawBackground }                  = require('../utils/backgrounds');

registerAllFonts();

const COLS     = 3;
const CELL_W   = 280;
const CELL_H   = 160;
const PAD      = 12;
const HEADER_H = 48;
const LABEL_H  = 28;

module.exports = {
    cooldown: 8,
    data: new SlashCommandBuilder()
        .setName('preview')
        .setDescription('Generate a mosaic sheet showing all available backgrounds.'),

    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setDescription('✦ Generating background preview sheet…');
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const bgChoices = getBackgroundChoices();

            const rows   = Math.ceil(bgChoices.length / COLS);
            const sheetW = COLS * CELL_W + (COLS + 1) * PAD;
            const sheetH = HEADER_H + rows * (CELL_H + LABEL_H + PAD) + PAD;

            const canvas = createCanvas(sheetW, sheetH);
            const ctx    = canvas.getContext('2d');

            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, sheetW, sheetH);

            const families   = getAllFontFamilies?.() ?? [];
            const labelFam   = families[0] ?? 'monospace';
            const headerFont = `bold 22px '${labelFam}'`;
            const labelFont  = `bold 13px '${labelFam}'`;

            ctx.font         = headerFont;
            ctx.fillStyle    = '#ffffff';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦ Sigil — Background Preview', sheetW / 2, HEADER_H / 2);

            for (let i = 0; i < bgChoices.length; i++) {
                const { name: label, value: key } = bgChoices[i];
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const x   = PAD + col * (CELL_W + PAD);
                const y   = HEADER_H + PAD + row * (CELL_H + LABEL_H + PAD);

                const cell    = createCanvas(CELL_W, CELL_H);
                const cellCtx = cell.getContext('2d');
                try {
                    await drawBackground(cellCtx, key, CELL_W, CELL_H);
                } catch {
                    cellCtx.fillStyle = '#1a1a1a';
                    cellCtx.fillRect(0, 0, CELL_W, CELL_H);
                }
                ctx.drawImage(cell, x, y);

                ctx.font         = labelFont;
                ctx.fillStyle    = '#cccccc';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x + CELL_W / 2, y + CELL_H + LABEL_H / 2);
            }

            const buf = canvas.toBuffer();
            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#8b0000')
                        .setTitle('✦ Background Preview')
                        .setDescription(`Showing **${bgChoices.length}** available backgrounds.\nUse the \`background\` option in \`/icon\`, \`/banner\`, \`/brand\`, or \`/mood\`.`)
                        .setImage('attachment://backgrounds.png')
                        .setFooter({ text: 'Sigil • /preview' }),
                ],
                files: [new AttachmentBuilder(buf, { name: 'backgrounds.png' })],
            });
        } catch (err) {
            console.error('[ERROR] /preview failed:', err);
            await initialReply.edit({
                embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`Failed to render preview sheet. ${err.message || 'Please try again.'}`)],
            });
        }
    },
};
