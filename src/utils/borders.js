/**
 * borders.js — shared border/frame renderer for canvas commands.
 *
 * Supported styles:
 *   'solid'    — 6px solid rectangle in the primary colour
 *   'glow'     — 4px ring with a wide blur halo matching the primary colour
 *   'gradient' — 6px ring sweeping color → color2 → color around all four edges
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} style        - 'solid' | 'glow' | 'gradient'
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
            if      (y0 === 0    && y1 === 0)    { ctx.moveTo(inset, inset);              ctx.lineTo(size - inset, inset);         }
            else if (x0 === size && x1 === size) { ctx.moveTo(size - inset, inset);       ctx.lineTo(size - inset, size - inset);  }
            else if (y0 === size && y1 === size) { ctx.moveTo(size - inset, size - inset); ctx.lineTo(inset, size - inset);        }
            else                                 { ctx.moveTo(inset, size - inset);        ctx.lineTo(inset, inset);               }
            ctx.stroke();
        });
        ctx.restore();
    }
}

module.exports = { drawBorder };
