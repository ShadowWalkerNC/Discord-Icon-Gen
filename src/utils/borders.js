/**
 * borders.js — shared border/frame renderer for canvas commands.
 *
 * Supported styles:
 *   'solid'    — 6px solid rectangle in the primary colour
 *   'glow'     — 4px ring with a wide blur halo matching the primary colour
 *   'gradient' — 6px ring sweeping color → color2 → color around all four edges
 *   'double'   — two concentric solid rings with a 5px gap between them
 *   'dashed'   — dashed stroke with even gaps calculated from canvas size
 *   'corner'   — crop-mark style: only the four corner L-shapes are drawn
 *   'neon'     — three-pass layered glow for a neon tube effect
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} style        - 'solid'|'glow'|'gradient'|'double'|'dashed'|'corner'|'neon'
 * @param {string} color        - primary hex colour
 * @param {string|null} color2  - secondary hex colour (gradient style only; falls back to color)
 * @param {number} size         - canvas width = height in pixels
 */
function drawBorder(ctx, style, color, color2, size) {
    const inset = 3;

    if (style === 'solid') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 6;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore();
        return;
    }

    if (style === 'glow') {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur  = 20;
        ctx.strokeStyle = color;
        ctx.lineWidth   = 4;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur  = 40;
        ctx.lineWidth   = 8;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.restore();
        return;
    }

    if (style === 'gradient') {
        const c2 = color2 || color;
        const segments = [
            { x0: 0,    y0: 0,    x1: size, y1: 0,    startC: color, endC: c2    },
            { x0: size, y0: 0,    x1: size, y1: size, startC: c2,    endC: color },
            { x0: size, y0: size, x1: 0,    y1: size, startC: color, endC: c2    },
            { x0: 0,    y0: size, x1: 0,    y1: 0,    startC: c2,    endC: color },
        ];
        ctx.save();
        ctx.lineWidth = 6;
        segments.forEach(({ x0, y0, x1, y1, startC, endC }) => {
            const grad = ctx.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0, startC);
            grad.addColorStop(1, endC);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            if      (y0 === 0    && y1 === 0)    { ctx.moveTo(inset, inset);               ctx.lineTo(size - inset, inset);          }
            else if (x0 === size && x1 === size) { ctx.moveTo(size - inset, inset);        ctx.lineTo(size - inset, size - inset);   }
            else if (y0 === size && y1 === size) { ctx.moveTo(size - inset, size - inset); ctx.lineTo(inset, size - inset);          }
            else                                 { ctx.moveTo(inset, size - inset);        ctx.lineTo(inset, inset);                 }
            ctx.stroke();
        });
        ctx.restore();
        return;
    }

    // ── NEW STYLES ────────────────────────────────────────────────────────────

    if (style === 'double') {
        // Outer ring: 3px, Inner ring: 2px, gap between them: 5px
        const outerInset = 2;
        const gap        = 5;
        const innerInset = outerInset + 3 + gap; // 3 = outer lineWidth
        ctx.save();
        ctx.strokeStyle = color;
        // Outer
        ctx.lineWidth = 3;
        ctx.strokeRect(outerInset, outerInset, size - outerInset * 2, size - outerInset * 2);
        // Inner
        ctx.lineWidth = 2;
        ctx.strokeRect(innerInset, innerInset, size - innerInset * 2, size - innerInset * 2);
        ctx.restore();
        return;
    }

    if (style === 'dashed') {
        // Dash length = size/20, gap = size/30 — always an even number of segments
        const dashLen = Math.round(size / 20);
        const dashGap = Math.round(size / 30);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 5;
        ctx.setLineDash([dashLen, dashGap]);
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        ctx.setLineDash([]);
        ctx.restore();
        return;
    }

    if (style === 'corner') {
        // Only draw L-shapes at each corner — like photo crop marks
        const arm    = Math.round(size * 0.18); // length of each arm (~72px on 400px canvas)
        const weight = 6;
        const pad    = 4;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = weight;
        ctx.lineCap     = 'square';

        const corners = [
            // [x, y, hEndX, vEndY]
            [pad,          pad,          pad + arm,          pad + arm         ], // top-left
            [size - pad,   pad,          size - pad - arm,   pad + arm         ], // top-right
            [pad,          size - pad,   pad + arm,          size - pad - arm  ], // bottom-left
            [size - pad,   size - pad,   size - pad - arm,   size - pad - arm  ], // bottom-right
        ];

        corners.forEach(([x, y, hx, vy]) => {
            ctx.beginPath();
            ctx.moveTo(hx, y);  // horizontal arm
            ctx.lineTo(x,  y);
            ctx.lineTo(x, vy);  // vertical arm
            ctx.stroke();
        });
        ctx.restore();
        return;
    }

    if (style === 'neon') {
        // Three passes: wide soft halo → mid glow → crisp bright core
        const passes = [
            { blur: 40, alpha: 0.25, width: 12 },
            { blur: 18, alpha: 0.55, width: 6  },
            { blur: 4,  alpha: 1.0,  width: 3  },
        ];
        ctx.save();
        passes.forEach(({ blur, alpha, width }) => {
            ctx.globalAlpha = alpha;
            ctx.shadowColor = color;
            ctx.shadowBlur  = blur;
            ctx.strokeStyle = color;
            ctx.lineWidth   = width;
            ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
        });
        ctx.restore();
        return;
    }
}

/**
 * Returns choice objects for Discord SlashCommandBuilder.addChoices().
 * Single source of truth — import this instead of hardcoding the list.
 * @returns {Array<{ name: string, value: string }>}
 */
function getBorderChoices() {
    return [
        { name: 'None',          value: 'none'     },
        { name: 'Solid',         value: 'solid'    },
        { name: 'Glow Ring',     value: 'glow'     },
        { name: 'Gradient Ring', value: 'gradient' },
        { name: 'Double',        value: 'double'   },
        { name: 'Dashed',        value: 'dashed'   },
        { name: 'Corner Marks',  value: 'corner'   },
        { name: 'Neon',          value: 'neon'     },
    ];
}

/**
 * Maps raw border value → display name.
 * @type {Object<string,string>}
 */
const BORDER_LABELS = Object.fromEntries(
    getBorderChoices().map(({ name, value }) => [value, name])
);

module.exports = { drawBorder, getBorderChoices, BORDER_LABELS };
