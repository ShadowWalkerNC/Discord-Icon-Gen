const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');
const { getColorAutocomplete } = require('../utils/colors.js');

registerAllFonts();

const W = 900, H = 340;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventbanner')
        .setDescription('Generate an event announcement banner with title, date, description, and host')
        .addStringOption(opt => opt.setName('title').setDescription('Event name').setRequired(true))
        .addStringOption(opt => opt.setName('date').setDescription('Date and time (e.g. Saturday June 21 — 8PM EST)').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Short event description'))
        .addStringOption(opt => opt.setName('host').setDescription('Hosted by (username or role)'))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Accent color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f })))),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        const results = getColorAutocomplete(focused);
        await interaction.respond(results);
    },

    async execute(interaction) {
        await interaction.deferReply();

        const title       = interaction.options.getString('title');
        const date        = interaction.options.getString('date');
        const description = interaction.options.getString('description') ?? '';
        const host        = interaction.options.getString('host')        ?? '';
        const background  = interaction.options.getString('background')  ?? 'gradient-purple';
        const primary     = interaction.options.getString('primary_color') ?? '#5865F2';
        const font        = interaction.options.getString('font')        ?? getAllFontFamilies()[0] ?? 'Arial';

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        try { getBackgroundById(background).draw(ctx, W, H); }
        catch { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = '#000000aa'; ctx.fillRect(0, 0, W, H);

        // Top accent bar
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, primary + '00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, 5);

        // EVENT label
        ctx.font = `bold 12px Arial`;
        ctx.fillStyle = primary;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('E V E N T', 40, 44);

        // Title
        let titleSize = 52;
        ctx.font = `bold ${titleSize}px "${font}"`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = primary; ctx.shadowBlur = 10;
        while (ctx.measureText(title).width > W - 80 && titleSize > 22) {
            titleSize -= 2;
            ctx.font = `bold ${titleSize}px "${font}"`;
        }
        ctx.fillText(title, 40, 44 + 58);
        ctx.shadowBlur = 0;

        // Date pill
        ctx.font = `bold 16px "${font}"`;
        const dw = ctx.measureText('📅  ' + date).width + 32;
        ctx.fillStyle = primary + '33';
        ctx.beginPath(); ctx.roundRect(40, 124, dw, 32, 16); ctx.fill();
        ctx.strokeStyle = primary; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText('📅  ' + date, 56, 140);

        // Description
        if (description) {
            ctx.font = `17px "${font}"`;
            ctx.fillStyle = '#cccccc';
            ctx.textBaseline = 'alphabetic';
            const words = description.split(' ');
            let line = '', lines = [], ly = 188;
            for (const w of words) {
                const t = line ? line + ' ' + w : w;
                if (ctx.measureText(t).width > W - 80) { lines.push(line); line = w; }
                else line = t;
            }
            if (line) lines.push(line);
            lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 40, ly + i * 26));
        }

        // Hosted by
        if (host) {
            ctx.font = `bold 14px "${font}"`;
            ctx.fillStyle = primary;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(`🎤 Hosted by ${host}`, 40, H - 32);
        }

        // Bottom gradient line
        ctx.fillStyle = grad;
        ctx.fillRect(0, H - 5, W, 5);

        // Watermark
        ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('made with Sigil', W - 12, H - 10);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'eventbanner.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🎤 ${title}`)
            .setDescription(description || date)
            .setImage('attachment://eventbanner.png')
            .setColor(primary)
            .addFields(
                { name: '📅 Date', value: date, inline: true },
                { name: '🎤 Host', value: host || 'TBA', inline: true },
            )
            .setFooter({ text: 'Sigil • eventbanner — 900×340 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'eventbanner', title, date, description, host, background, primary_color: primary, font });
    },
};
