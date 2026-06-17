/**
 * Sigil Shared Canvas Utility
 * ============================
 * Single source of truth for all canvas rendering across Sigil commands.
 * Used by: /brand, /icon, /banner, /logo, /avatar, and gui/gui-server.js
 *
 * Exports:
 *   registerAllFonts()                         — call once at startup
 *   getAllFontFamilies()                        — list registered font family names
 *   autoFontSize(text, max, min, divisor)       — responsive font sizing
 *   renderIcon(ctx, opts)                       — 400×400 icon canvas
 *   renderBanner(ctx, opts)                     — 1024×320 banner canvas
 *   renderPalette(color, color2)                — returns PNG Buffer
 *   renderKit(opts)                             — returns { icon, banner, palette } Buffers
 */

'use strict';

const { createCanvas, registerFont, loadImage } = require('canvas');
const { getFont, getAllFonts }                   = require('./fonts');
const { createTextGradient }                     = require('./gradient');
const { drawBackground }                         = require('./backgrounds');
const { drawBorder }                             = require('./borders');

// ── Font registration ──────────────────────────────────────────────────────────────
let _fontsRegistered = false;
function registerAllFonts() {
    if (_fontsRegistered) return;
    _fontsRegistered = true;
    for (const font of getAllFonts()) {
        try { registerFont(font.file, { family: font.family }); }
        catch (e) { console.error(`[canvas] Failed to register font '${font.family}':`, e.message); }
    }
}

/**
 * Returns an array of all registered font family name strings.
 * Used by gui/sigil-gui-builder.html to populate the font picker.
 */
function getAllFontFamilies() {
    return getAllFonts().map(font => font.family);
}

// ── Font sizing helper ───────────────────────────────────────────────────────────
function autoFontSize(text, max = 150, min = 32, divisor = 220) {
    return Math.min(max, Math.max(min, Math.floor(divisor / Math.max(text.length, 1))));
}

// ── renderIcon ───────────────────────────────────────────────────────────────────
async function renderIcon(ctx, opts = {}) {
    const {
        text, size, color, color2 = null,
        glow = '10', background = 'plain-black',
        border = 'none', font, opacity = 100,
    } = opts;
    const W = 400, H = 400;

    await drawBackground(ctx, background, W, H, loadImage);

    if (opacity < 100) {
        ctx.globalAlpha = 1 - (opacity / 100);
        ctx.fillStyle   = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1.0;
    }

    if (border && border !== 'none') drawBorder(ctx, border, color, color2, W);

    const resolvedFont = font || getFont('another-danger');
    const drawX = W / 2, drawY = H / 2;

    ctx.font         = `${size}px '${resolvedFont.family}'`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const fill = createTextGradient(ctx, color, color2, text, drawX, W);
    ctx.shadowColor = color;
    ctx.shadowBlur  = Number(glow);
    ctx.fillStyle   = fill;
    ctx.fillText(text, drawX, drawY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.fillText(text, drawX, drawY);
}

// ── renderBanner ───────────────────────────────────────────────────────────────
async function renderBanner(ctx, opts = {}) {
    const {
        text, size, color, color2 = null,
        glow = '10', background = 'plain-black',
        subtitle = null, font,
    } = opts;
    const W = 1024, H = 320;

    await drawBackground(ctx, background, W, H, loadImage);

    const resolvedFont = font || getFont('another-danger');
    const textX = W / 2;
    const textY = subtitle ? H * 0.42 : H / 2;

    ctx.font         = `${size}px '${resolvedFont.family}'`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const fill = createTextGradient(ctx, color, color2, text, textX, W);
    ctx.shadowColor = color;
    ctx.shadowBlur  = Number(glow);
    ctx.fillStyle   = fill;
    ctx.fillText(text, textX, textY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.fillText(text, textX, textY);

    if (subtitle) {
        const subSize = Math.round(size * 0.4);
        const subY    = textY + size * 0.75;
        ctx.font      = `${subSize}px '${resolvedFont.family}'`;
        const subFill = createTextGradient(ctx, color, color2, subtitle, textX, W);
        ctx.globalAlpha = 0.75;
        ctx.shadowColor = color;
        ctx.shadowBlur  = Number(glow) * 0.6;
        ctx.fillStyle   = subFill;
        ctx.fillText(subtitle, textX, subY);
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
        ctx.fillText(subtitle, textX, subY);
    }
}

// ── renderPalette ───────────────────────────────────────────────────────────────
function renderPalette(color, color2 = null) {
    const W = 800, H = 200;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const hexToRgb = hex => {
        const h    = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n    = parseInt(full, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const blend = (rgb, t, w) => rgb.map((c, i) => Math.round(c + (w[i] - c) * t));
    const toHex = rgb => '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');

    const [r1, g1, b1] = hexToRgb(color);
    const swatches = [
        { hex: toHex(blend([r1, g1, b1], 0.4, [255, 255, 255])), label: 'Light'   },
        { hex: color,                                              label: 'Primary' },
        { hex: toHex(blend([r1, g1, b1], 0.4, [0, 0, 0])),       label: 'Dark'    },
    ];
    if (color2) {
        const [r2, g2, b2] = hexToRgb(color2);
        swatches.push(
            { hex: color2,                                              label: 'Secondary' },
            { hex: toHex(blend([r2, g2, b2], 0.4, [255, 255, 255])), label: 'Sec Light' },
            { hex: toHex(blend([r2, g2, b2], 0.4, [0, 0, 0])),       label: 'Sec Dark'  },
        );
    }

    const colW = W / swatches.length;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, W, H);

    swatches.forEach(({ hex, label }, i) => {
        ctx.fillStyle = hex;
        ctx.fillRect(i * colW + 6, 6, colW - 12, H - 52);
        ctx.fillStyle    = '#ffffff';
        ctx.font         = 'bold 13px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(hex.toUpperCase(), i * colW + colW / 2, H - 40);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font      = '11px monospace';
        ctx.fillText(label, i * colW + colW / 2, H - 20);
    });

    return canvas.toBuffer();
}

// ── renderKit (convenience wrapper) ──────────────────────────────────────────────
async function renderKit(opts = {}) {
    registerAllFonts();

    const {
        name       = 'Sigil',
        initials   = 'SG',
        color      = '#FFFFFF',
        color2     = null,
        background = 'plain-black',
        border     = 'none',
        glow       = '10',
        tagline    = null,
        fontKey    = 'another-danger',
    } = opts;

    const font       = getFont(fontKey);
    const sharedOpts = { color, color2, glow, background, font };

    const iconCanvas   = createCanvas(400, 400);
    const bannerCanvas = createCanvas(1024, 320);

    await Promise.all([
        renderIcon(iconCanvas.getContext('2d'), {
            ...sharedOpts,
            text:   initials,
            border,
            size:   autoFontSize(initials, 150, 60, 220),
        }),
        renderBanner(bannerCanvas.getContext('2d'), {
            ...sharedOpts,
            text:     name,
            subtitle: tagline,
            size:     autoFontSize(name, 90, 32, 900),
        }),
    ]);

    return {
        icon:    iconCanvas.toBuffer(),
        banner:  bannerCanvas.toBuffer(),
        palette: renderPalette(color, color2),
    };
}

module.exports = {
    registerAllFonts,
    getAllFontFamilies,
    autoFontSize,
    renderIcon,
    renderBanner,
    renderPalette,
    renderKit,
};
