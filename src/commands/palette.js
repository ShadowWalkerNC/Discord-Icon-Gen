const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadHistory } = require('../utils/history.js');
const { getColorAutocomplete } = require('../utils/colors.js');

// ── Hex validation ────────────────────────────────────────────────────────
function isHex(v) {
    return /^#[0-9A-Fa-f]{6}$/.test(v);
}

function normalizeHex(v) {
    if (!v) return null;
    const s = v.trim();
    return isHex(s) ? s.toUpperCase() : null;
}

// ── Derive a human-readable slug from a hex ───────────────────────────────
function hexToSlug(hex) {
    return 'color-' + hex.replace('#', '').toLowerCase();
}

// ── Format builders ───────────────────────────────────────────────────────
function buildCssVars(colors) {
    const lines = [':root {'];
    colors.forEach((c, i) => {
        const label = c.label || `color-${i + 1}`;
        lines.push(`  --${label}: ${c.hex};`);
    });
    lines.push('}');
    return lines.join('\n');
}

function buildTailwind(colors) {
    const lines = [
        '// tailwind.config.js',
        'module.exports = {',
        '  theme: {',
        '    extend: {',
        '      colors: {',
    ];
    colors.forEach(c => {
        const key = (c.label || hexToSlug(c.hex)).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        lines.push(`        '${key}': '${c.hex}',`);
    });
    lines.push('      },');
    lines.push('    },');
    lines.push('  },');
    lines.push('};');
    return lines.join('\n');
}

function buildHexList(colors) {
    return colors.map(c => {
        const label = c.label ? `${c.label}: ` : '';
        return `${label}${c.hex}`;
    }).join('\n');
}

// ── Derive palette from a history entry ───────────────────────────────────
function paletteFromEntry(entry) {
    const colors = [];
    if (entry.primary_color   && isHex(entry.primary_color))   colors.push({ hex: entry.primary_color.toUpperCase(),   label: 'primary' });
    if (entry.secondary_color && isHex(entry.secondary_color)) colors.push({ hex: entry.secondary_color.toUpperCase(), label: 'secondary' });
    if (Array.isArray(entry.palette)) {
        entry.palette.forEach((h, i) => {
            const norm = normalizeHex(h);
            if (norm) colors.push({ hex: norm, label: `palette-${i + 1}` });
        });
    }
    return colors;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('palette')
        .setDescription('Export your brand palette as CSS variables, Tailwind config, or a hex list')
        .addStringOption(opt =>
            opt.setName('format')
                .setDescription('Export format')
                .setRequired(true)
                .addChoices(
                    { name: 'CSS Variables  (:root { --primary: … })',     value: 'css'      },
                    { name: 'Tailwind Config (tailwind.config.js colors)', value: 'tailwind' },
                    { name: 'Hex List  (one color per line)',               value: 'hex'      },
                )
        )
        .addStringOption(opt =>
            opt.setName('primary')
                .setDescription('Primary hex color (uses last kit if omitted)')
                .setAutocomplete(true)
        )
        .addStringOption(opt =>
            opt.setName('secondary')
                .setDescription('Secondary hex color')
                .setAutocomplete(true)
        )
        .addStringOption(opt =>
            opt.setName('color3')
                .setDescription('Additional color 3')
                .setAutocomplete(true)
        )
        .addStringOption(opt =>
            opt.setName('color4')
                .setDescription('Additional color 4')
                .setAutocomplete(true)
        )
        .addStringOption(opt =>
            opt.setName('color5')
                .setDescription('Additional color 5')
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        const results = getColorAutocomplete(focused);
        await interaction.respond(results);
    },

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const format    = interaction.options.getString('format');
        const rawP      = interaction.options.getString('primary');
        const rawS      = interaction.options.getString('secondary');
        const rawC3     = interaction.options.getString('color3');
        const rawC4     = interaction.options.getString('color4');
        const rawC5     = interaction.options.getString('color5');

        let colors = [];

        const manualInputs = [rawP, rawS, rawC3, rawC4, rawC5];
        const labels       = ['primary', 'secondary', 'color-3', 'color-4', 'color-5'];
        const hasManual    = manualInputs.some(v => v);

        if (hasManual) {
            manualInputs.forEach((raw, i) => {
                if (!raw) return;
                const hex = normalizeHex(raw);
                if (hex) colors.push({ hex, label: labels[i] });
            });

            if (!colors.length) {
                return interaction.editReply('\u274c No valid hex colors provided. Use format `#RRGGBB` (e.g. `#8B0000`).');
            }
        } else {
            const history = loadHistory(interaction.user.id);
            if (!history.length) {
                return interaction.editReply(
                    '\u274c No saved kit found and no colors provided.\n' +
                    'Either pass `primary` / `secondary` directly, or run `/brand kit`, `/template`, or `/icon` first.'
                );
            }
            colors = paletteFromEntry(history[0]);
            if (!colors.length) {
                return interaction.editReply('\u274c Your last kit has no usable colors. Pass them manually using the `primary` / `secondary` options.');
            }
        }

        let output, formatLabel, langHint;
        if (format === 'css') {
            output      = buildCssVars(colors);
            formatLabel = 'CSS Variables';
            langHint    = 'css';
        } else if (format === 'tailwind') {
            output      = buildTailwind(colors);
            formatLabel = 'Tailwind Config';
            langHint    = 'js';
        } else {
            output      = buildHexList(colors);
            formatLabel = 'Hex List';
            langHint    = '';
        }

        const swatches = colors.map(c => `\`${c.hex}\``).join('  ');
        const source   = hasManual ? 'manual input' : 'last kit';

        const embed = new EmbedBuilder()
            .setTitle(`\uD83C\uDFA8 Palette Export \u2014 ${formatLabel}`)
            .setColor(colors[0].hex)
            .setDescription(
                `**Colors (${source}):** ${swatches}\n\n` +
                `\`\`\`${langHint}\n${output}\n\`\`\``
            )
            .setFooter({ text: `Sigil \u2022 palette export \u2014 ${colors.length} color${colors.length !== 1 ? 's' : ''} \u2022 use /palette export format:${format} to regenerate` });

        await interaction.editReply({ embeds: [embed] });
    },
};
