const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundById } = require('../utils/backgrounds.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');

registerAllFonts();

const W = 900, H = 300;

const TYPE_CHOICES = [
    { name: '📣 Announcement', value: 'announcement' },
    { name: '⚠️  Important',    value: 'important'    },
    { name: '🔔 Notice',       value: 'notice'       },
    { name: '🎉 Celebration',  value: 'celebration'  },
    { name: '🔧 Update',        value: 'update'       },
    { name: '🚨 Alert',         value: 'alert'        },
];

const TYPE_COLORS = {
    announcement: '#5865F2',
    important:    '#ff6600',
    notice:       '#ffd700',
    celebration:  '#39FF14',
    update:       '#00ccff',
    alert:        '#ff0033',
};

const TYPE_ICONS = {
    announcement: '📣',
    important:    '⚠️',
    notice:       '🔔',
    celebration:  '🎉',
    update:       '🔧',
    alert:        '🚨',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcebanner')
        .setDescription('Generate a professional announcement banner graphic for your server')
        .addStringOption(opt => opt.setName('title').setDescription('Announcement title').setRequired(true))
        .addStringOption(opt => opt.setName('body').setDescription('Body text or details').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Announcement type').addChoices(...TYPE_CHOICES))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('accent_color').setDescription('Override accent color (hex)').setAutocomplete(true))
        .addStringOption(opt => opt.setName('font').setDescription('Font').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f })))),

    async autocomplete(interaction) {
        const { colorAutocomplete } = require('../utils/colors.js');
        await colorAutocomplete(interaction);
    },

    async execute(interaction) {
        await interaction.deferReply();

        const title   = interaction.options.getString('title');
        const body    = interaction.options.getString('body');
        const type    = interaction.options.getString('type')        ?? 'announcement';
        const bg      = interaction.options.getString('background')  ?? 'solid-dark';
        const accent  = interaction.options.getString('accent_color') ?? TYPE_COLORS[type];
        const font    = interaction.options.getString('font')        ?? getAllFontFamilies()[0] ?? 'Arial';

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        try { getBackgroundById(bg).draw(ctx, W, H); }
        catch { ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = '#000000aa'; ctx.fillRect(0, 0, W, H);

        // Left accent bar
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, 8, H);

        // Top accent line
        ctx.fillRect(0, 0, W, 4);

        // Type icon + label
        const icon = TYPE_ICONS[type];
        ctx.font = `bold 13px Arial`;
        ctx.fillStyle = accent;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${icon}  ${type.toUpperCase()}`, 36, H * 0.22);

        // Title
        ctx.font = `bold 44px "${font}"`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accent; ctx.shadowBlur = 6;
        // Auto-shrink if too wide
        let titleSize = 44;
        while (ctx.measureText(title).width > W - 80 && titleSize > 20) {
            titleSize -= 2;
            ctx.font = `bold ${titleSize}px "${font}"`;
        }
        ctx.fillText(title, 36, H * 0.22 + 52);
        ctx.shadowBlur = 0;

        // Body text with word wrap
        ctx.font = `17px "${font}"`;
        ctx.fillStyle = '#cccccc';
        const words = body.split(' ');
        let line = '', lines = [];
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > W - 80) { lines.push(line); line = w; }
            else line = t;
        }
        if (line) lines.push(line);
        lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 36, H * 0.22 + 52 + 36 + i * 26));

        // Bottom rule
        ctx.fillStyle = accent + '55';
        ctx.fillRect(36, H - 28, W - 72, 2);

        // Watermark
        ctx.font = '12px Arial'; ctx.fillStyle = '#ffffff18';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('made with Sigil', W - 12, H - 8);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'announcement.png' });

        const typeLabel = TYPE_CHOICES.find(t => t.value === type)?.name ?? type;

        const embed = new EmbedBuilder()
            .setTitle(`${TYPE_ICONS[type]} ${title}`)
            .setDescription(body)
            .setImage('attachment://announcement.png')
            .setColor(accent)
            .addFields({ name: 'Type', value: typeLabel, inline: true })
            .setFooter({ text: 'Sigil • announcebanner — 900×300 PNG' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'announcebanner', title, body, type, background: bg, accent_color: accent, font });
    },
};
