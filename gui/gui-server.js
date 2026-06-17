/**
 * Sigil GUI Bridge Server
 * =======================
 * Lightweight Node HTTP server. Receives config JSON from the HTML GUI
 * (gui/sigil-gui-builder.html) and routes it into Sigil's pipeline.
 *
 * Endpoints:
 *   GET  /              — serve sigil-gui-builder.html
 *   GET  /health        — uptime + version ping
 *   POST /generate      — full brand kit: Gemini text + canvas PNG renders
 *   POST /preview       — fast canvas-only render (no Gemini call)
 *   POST /webhook-register — save a Discord webhook URL for asset callbacks
 *
 * Usage:
 *   node gui/gui-server.js
 *   PORT=4000 node gui/gui-server.js
 */

'use strict';

const http = require('http');
const path = require('path');
const fs   = require('fs');

const { geminiRequest, geminiImageRequest, extractJson } = require('../src/utils/gemini');
const { renderKit }                                       = require('../src/utils/canvas');

const PORT    = Number(process.env.GUI_PORT) || 3420;
const VERSION = '1.1.0';

// In-memory webhook store (keyed by Discord channel ID)
const webhooks = {};

// ── Helpers ────────────────────────────────────────────────────────────────

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
    cors(res);
    const body = JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', c => { raw += c; if (raw.length > 1_000_000) req.destroy(); });
        req.on('end',  () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); } });
        req.on('error', reject);
    });
}

/** Map GUI config visuals → renderKit() options */
function configToRenderKitOpts(cfg) {
    const b = cfg.brand   || {};
    const v = cfg.visuals || {};
    // Map GUI background names to canvas background keys
    const BG_MAP = {
        'midnight-gradient': 'midnight-gradient',
        'deep-space':        'plain-black',
        'inferno':           'plain-black',
        'ocean-depth':       'plain-black',
        'forest-night':      'forest',
        'twilight':          'midnight-gradient',
        'aurora':            'forest',
        'storm':             'plain-black',
        'sunset-fade':       'sunset',
        'void':              'plain-black',
        'neon-city':         'cyberpunk-grid',
        'polar':             'starfield',
    };
    return {
        name:       (b.banner_text || b.name || 'Sigil').slice(0, 30),
        initials:   (b.icon_text  || b.name || 'SG').slice(0, 4).toUpperCase(),
        color:      v.primary_color   || '#8B0000',
        color2:     v.secondary_color || null,
        background: BG_MAP[v.background] || 'midnight-gradient',
        border:     v.border            || 'none',
        glow:       String(v.glow ?? 10),
        tagline:    b.tagline           || null,
        fontKey:    'another-danger',
    };
}

/** Build Gemini brand prompt from GUI config */
function buildBrandPrompt(cfg) {
    const v = cfg.visuals || {};
    const b = cfg.brand   || {};
    return [
        `Generate a brand identity JSON for a Discord server named "${b.name || 'Untitled'}".`,
        `Description: ${b.description || b.tagline || 'No description provided'}.`,
        `Primary color: ${v.primary_color || '#8B0000'}, Secondary: ${v.secondary_color || '#4B0082'}.`,
        `Return ONLY a JSON object with keys: name, tagline, palette (array of 3-6 hex strings),`,
        `icon_prompt (image gen prompt for a 400x400 icon), banner_prompt (1024x320 banner prompt),`,
        `description (1-2 sentence brand description).`,
    ].join(' ');
}

/** Post generated assets back to a registered Discord webhook */
async function notifyWebhook(channelId, payload) {
    const url = webhooks[channelId];
    if (!url) return;
    const body = JSON.stringify({
        username: 'Sigil GUI',
        embeds: [{
            title:       `\u2726 Brand Kit \u2014 ${payload.name || 'Generated'}`,
            description: payload.description || payload.tagline || '',
            color:       parseInt((payload.palette?.[0] || '#8B0000').replace('#', ''), 16),
            fields: [
                { name: 'Palette',  value: (payload.palette || []).join('  '), inline: false },
                { name: 'Tagline',  value: payload.tagline || '\u2014',            inline: false },
            ],
            footer: { text: 'Generated via Sigil GUI Builder' },
        }],
    });
    const u   = new URL(url);
    const mod = u.protocol === 'https:' ? require('https') : require('http');
    return new Promise(resolve => {
        const req = mod.request({
            hostname: u.hostname, path: u.pathname + u.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, res => { res.resume(); resolve(res.statusCode); });
        req.on('error', () => resolve(null));
        req.write(body); req.end();
    });
}

// ── Request Handler ──────────────────────────────────────────────────────────

async function handle(req, res) {
    if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
    const url = req.url.split('?')[0];

    // GET /health
    if (req.method === 'GET' && url === '/health')
        return json(res, 200, { ok: true, version: VERSION, uptime: process.uptime() });

    // GET / — serve GUI HTML
    if (req.method === 'GET' && (url === '/' || url === '/gui')) {
        const file = path.join(__dirname, 'sigil-gui-builder.html');
        if (fs.existsSync(file)) {
            const html = fs.readFileSync(file);
            cors(res);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
            res.end(html);
        } else {
            json(res, 404, { error: 'GUI file not found. Place sigil-gui-builder.html in the gui/ folder.' });
        }
        return;
    }

    // POST /webhook-register
    if (req.method === 'POST' && url === '/webhook-register') {
        try {
            const body = await readBody(req);
            if (!body.channelId || !body.webhookUrl) return json(res, 400, { error: 'channelId and webhookUrl required.' });
            webhooks[body.channelId] = body.webhookUrl;
            return json(res, 200, { ok: true, registered: body.channelId });
        } catch (e) { return json(res, 400, { error: e.message }); }
    }

    // POST /preview — canvas render only, no Gemini
    if (req.method === 'POST' && url === '/preview') {
        try {
            const cfg  = await readBody(req);
            const opts = configToRenderKitOpts(cfg);
            const kit  = await renderKit(opts);
            cors(res);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok:         true,
                icon_b64:   kit.icon.toString('base64'),
                banner_b64: kit.banner.toString('base64'),
                palette_b64:kit.palette.toString('base64'),
                opts_used:  opts,
            }));
        } catch (e) { return json(res, 500, { error: e.message }); }
        return;
    }

    // POST /generate — full Gemini text + canvas renders
    if (req.method === 'POST' && url === '/generate') {
        try {
            const cfg = await readBody(req);
            const b   = cfg.brand   || {};
            const v   = cfg.visuals || {};

            // 1. Text generation
            let brandData = {};
            try {
                const raw = await geminiRequest(buildBrandPrompt(cfg), { maxOutputTokens: 512, temperature: 1.1 });
                brandData = extractJson(raw);
            } catch (e) {
                console.warn('[GUI] Text gen failed:', e.message);
                brandData = { name: b.name, tagline: b.tagline, palette: [v.primary_color, v.secondary_color] };
            }

            // 2. Canvas render (icon + banner + palette)
            const renderOpts = configToRenderKitOpts(cfg);
            if (brandData.tagline) renderOpts.tagline = brandData.tagline;
            const kit = await renderKit(renderOpts);

            // 3. Optional Gemini image generation
            let iconBase64 = null;
            const iconPrompt = brandData.icon_prompt || b.image_prompt ||
                `${b.description || b.name} — dark fantasy icon, ${v.primary_color} tones, 400x400`;
            try {
                const imgBuf = await geminiImageRequest(iconPrompt, { timeoutMs: 35_000 });
                iconBase64   = imgBuf.toString('base64');
            } catch (e) {
                console.warn('[GUI] Image gen skipped:', e.message);
            }

            // 4. Notify Discord webhook if registered
            if (cfg.integration?.channelId)
                notifyWebhook(cfg.integration.channelId, brandData).catch(() => {});

            return json(res, 200, {
                ok:          true,
                brand:       brandData,
                icon_b64:    kit.icon.toString('base64'),
                banner_b64:  kit.banner.toString('base64'),
                palette_b64: kit.palette.toString('base64'),
                ai_image_b64:iconBase64,
                config_in:   cfg,
            });
        } catch (e) {
            console.error('[GUI] /generate error:', e);
            return json(res, 500, { error: e.message });
        }
    }

    json(res, 404, { error: 'Not found', available: ['GET /', 'GET /health', 'POST /generate', 'POST /preview', 'POST /webhook-register'] });
}

// ── Start ───────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    handle(req, res).catch(e => {
        console.error('[GUI] Unhandled:', e);
        try { json(res, 500, { error: 'Internal server error' }); } catch {}
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Sigil GUI] Server v${VERSION} running \u2192 http://127.0.0.1:${PORT}`);
    console.log(`[Sigil GUI] Open GUI       \u2192 http://127.0.0.1:${PORT}/`);
    console.log(`[Sigil GUI] Health check   \u2192 http://127.0.0.1:${PORT}/health`);
});

module.exports = { server, webhooks };
