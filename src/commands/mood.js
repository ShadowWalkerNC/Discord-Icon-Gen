const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, registerFont, loadImage }                 = require('canvas');
const { getFont, getAllFonts }                                   = require('../utils/fonts');
const { createTextGradient }                                     = require('../utils/gradient');
const { drawBackground }                                         = require('../utils/backgrounds');
const https                                                      = require('https');

// Valid background keys Gemini is allowed to choose from
const VALID_BACKGROUNDS = [
    'plain-black',
    'plain-white',
    'midnight-gradient',
    'sunset',
    'forest',
    'cyberpunk-grid',
    'starfield',
    'carbon-fiber',
];

for (const font of getAllFonts()) {
    try { registerFont(font.file, { family: font.family }); }
    catch (e) { console.error(`[ERROR] Failed to register font '${font.family}':`, e.message); }
}

// ── Gemini helper ─────────────────────────────────────────────────────────

function geminiRequest(prompt) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return reject(new Error('GEMINI_API_KEY is not set.'));

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 512 },
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path:     `/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
            method:   'POST',
            headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const text   = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    resolve(text.trim());
                } catch (e) {
                    reject(new Error('Failed to parse Gemini response.'));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Parse Gemini JSON output safely ───────────────────────────────────────

function parseMoodResponse(raw) {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { throw new Error('Gemini returned invalid JSON.'); }

    const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    const color      = hex.test(parsed.color)      ? parsed.color      : '#FFFFFF';
    const color2     = parsed.color2 && hex.test(parsed.color2) ? parsed.color2 : null;
    const background = VALID_BACKGROUNDS.includes(parsed.background) ? parsed.background : 'plain-black';
    const tagline    = typeof parsed.tagline === 'string' ? parsed.tagline.slice(0, 60) : '';
    const glow       = ['0','5','10','15','25'].includes(String(parsed.glow)) ? String(parsed.glow) : '10';

    return { color, color2, background, tagline, glow };
}

// ── Palette card ────────────────────────────────────────────────────────────

function renderPalette(color, color2) {
    const W = 800, H = 180;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const hexToRgb = (hex) => {
        const h    = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n    = parseInt(full, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const blend  = (rgb, target, t) => rgb.map((c, i) => Math.round(c + (target[i] - c) * t));
    const toHex  = (rgb) => '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');

    const [r1, g1, b1] = hexToRgb(color);
    const swatches = [
        { hex: toHex(blend([r1,g1,b1], [255,255,255], 0.45)), label: 'Light'   },
        { hex: color,                                          label: 'Primary' },
        { hex: toHex(blend([r1,g1,b1], [0,0,0],       0.40)), label: 'Dark'    },
    ];

    if (color2) {
        const [r2, g2, b2] = hexToRgb(color2);
        swatches.push(
            { hex: color2,                                          label: 'Secondary' },
            { hex: toHex(blend([r2,g2,b2], [255,255,255], 0.45)),  label: 'Sec Light' },
            { hex: toHex(blend([r2,g2,b2], [0,0,0],       0.40)),  label: 'Sec Dark'  },
        );
    }

    const colW = W / swatches.length;
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, 0, W, H);

    swatches.forEach(({ hex, label }, i) => {
        ctx.fillStyle = hex;
        ctx.fillRect(i * colW + 6, 6, colW - 12, H - 50);

        ctx.fillStyle    = '#ffffff';
        ctx.font         = 'bold 13px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(hex.toUpperCase(), i * colW + colW / 2, H - 38);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font      = '11px monospace';
        ctx.fillText(label, i * colW + colW / 2, H - 18);
    });

    return canvas.toBuffer();
}

// ── Preview icon ───────────────────────────────────────────────────────────

async function renderPreviewIcon(mood, color, color2, background, glow) {
    const W = 400, H = 400;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');
    const font   = getFont('another-danger');

    await drawBackground(ctx, background, W, H, loadImage);

    // Clamp mood text to 3 chars for the icon preview
    const label = mood.slice(0, 3).toUpperCase();
    const size  = 110;

    ctx.font         = `${size}px '${font.family}'`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const fill = createTextGradient(ctx, color, color2, label, W / 2, W);
    ctx.shadowColor = color;
    ctx.shadowBlur  = Number(glow);
    ctx.fillStyle   = fill;
    ctx.fillText(label, W / 2, H / 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.fillText(label, W / 2, H / 2);

    return canvas.toBuffer();
}

// ── Command ────────────────────────────────────────────────────────────────

module.exports = {
    cooldown: 8,
    data: new SlashCommandBuilder()
        .setName('mood')
        .setDescription('One word → AI generates a full colour palette and preview.')
        .addStringOption(o =>
            o.setName('vibe')
                .setDescription('Describe the mood in one word or short phrase (e.g. cyberpunk, lofi, forest)')
                .setRequired(true)
                .setMaxLength(40)),

    async execute(interaction) {
        const vibe = interaction.options.getString('vibe').trim();

        if (!process.env.GEMINI_API_KEY)
            return interaction.reply({ content: '❌ `GEMINI_API_KEY` is not configured. Ask the bot owner to set it up.', ephemeral: true });

        const loadingEmbed = new EmbedBuilder()
            .setColor('#808080')
            .setDescription(`✦ Reading the vibe: **${vibe}**… asking Gemini for a palette.`);
        const initialReply = await interaction.reply({ embeds: [loadingEmbed] });

        // ── Build Gemini prompt ────────────────────────────────────────────────
        const prompt = `You are a Discord server branding designer.

The user wants a brand palette for the mood/vibe: "${vibe}".

Return ONLY a raw JSON object (no markdown, no explanation) with these exact keys:
- "color"      : primary hex color that fits the vibe (e.g. "#FF4500")
- "color2"     : optional secondary hex color for gradient — set to null if not needed
- "background" : one of these exact values only: ${VALID_BACKGROUNDS.map(b => `"${b}"`).join(', ')}
- "glow"       : glow intensity as a string — one of: "0", "5", "10", "15", "25"
- "tagline"    : a short punchy tagline (max 8 words) that fits the vibe

Only return the JSON object. No extra text.`;

        try {
            const raw    = await geminiRequest(prompt);
            const mood   = parseMoodResponse(raw);

            // Generate assets in parallel
            const [iconBuf, paletteBuf] = await Promise.all([
                renderPreviewIcon(vibe, mood.color, mood.color2, mood.background, mood.glow),
                Promise.resolve(renderPalette(mood.color, mood.color2)),
            ]);

            const colorLabel = mood.color2 ? `${mood.color} → ${mood.color2}` : mood.color;

            await initialReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(mood.color)
                        .setTitle(`✦ Mood: ${vibe}`)
                        .setDescription(
                            [
                                mood.tagline ? `*“${mood.tagline}”*` : '',
                                '',
                                `**Palette** — ${colorLabel}`,
                                `**Background** — \`${mood.background}\``,
                                `**Glow** — ${mood.glow === '0' ? 'None' : mood.glow}`,
                                '',
                                '⚡ Use these values in `/icon`, `/banner`, or `/brand kit`.',
                            ].filter(l => l !== undefined).join('\n')
                        )
                        .setFooter({ text: `Sigil • /mood • powered by Gemini` }),
                ],
                files: [
                    new AttachmentBuilder(iconBuf,    { name: 'mood-preview.png' }),
                    new AttachmentBuilder(paletteBuf, { name: 'palette.png'      }),
                ],
            });
        } catch (error) {
            console.error('[ERROR] /mood failed:', error);
            await initialReply.edit({
                embeds: [new EmbedBuilder().setColor('#FF0000').setDescription(`Failed to generate mood palette. ${error.message || 'Please try again.'}`)],
            });
        }
    },
};
