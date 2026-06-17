/**
 * Sigil GUI Bridge Server
 * =======================
 * Lightweight Express server that receives config JSON from the HTML GUI
 * (gui/sigil-gui-builder.html) and routes it into Sigil's existing brand
 * pipeline — geminiRequest, geminiImageRequest, extractJson.
 *
 * Endpoints:
 *   GET  /health           — uptime + version ping
 *   POST /generate         — full brand kit: AI text + image generation
 *   POST /preview          — fast canvas-only preview (no Gemini call)
 *   POST /webhook-register — save a Discord webhook URL for asset callbacks
 *
 * Usage:
 *   node gui/gui-server.js
 *   # or with PORT override:
 *   PORT=4000 node gui/gui-server.js
 *
 * The bot can start this automatically — see src/commands/gui.js.
 */

'use strict';

const http    = require('http');
const path    = require('path');
const fs      = require('fs');
const { geminiRequest, geminiImageRequest, extractJson } = require('../src/utils/gemini');

const PORT    = Number(process.env.GUI_PORT) || 3420;
const VERSION = '1.0.0';

// In-memory webhook store (keyed by Discord channel ID)
const webhooks = {};

// ─── Helpers ────────────────────────────────────────────────────────────────

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
        req.on('end',  () => {
            try { resolve(JSON.parse(raw)); }
            catch { reject(new Error('Invalid JSON body')); }
        });
        req.on('error', reject);
    });
}

/** Build the Gemini prompt from GUI config */
function buildBrandPrompt(cfg) {
    const v = cfg.visuals || {};
    const b = cfg.brand   || {};
    return [
        `Generate a brand identity JSON for a Discord server named "${b.name || 'Untitled'}".`,
        `Description: ${b.description || b.tagline || 'No description provided'}.`,
        `Primary color: ${v.primary_color || '#8B0000'}, Secondary: ${v.secondary_color || '#4B0082'}.`,
        `Style: background=${v.background}, border=${v.border}, font=${v.font}, glow=${v.glow}.`,
        `Return ONLY a JSON object with keys: name, tagline, palette (array of hex strings),`,
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
            title:       `✦ Brand Kit — ${payload.name || 'Generated'}`,
            description: payload.description || payload.tagline || '',
            color:       parseInt((payload.palette?.[0] || '#8B0000').replace('#',''), 16),
            fields: [
                { name: 'Palette',  value: (payload.palette || []).join('  '), inline: false },
                { name: 'Tagline',  value: payload.tagline || '—',            inline: false },
            ],
            footer: { text: 'Generated via Sigil GUI Builder' },
        }],
    });
    const u   = new URL(url);
    const mod = u.protocol === 'https:' ? require('https') : require('http');
    return new Promise(resolve => {
        const req = mod.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, res => { res.resume(); resolve(res.statusCode); });
        req.on('error', () => resolve(null));
        req.write(body); req.end();
    });
}

// ─── Request Handler ─────────────────────────────────────────────────────────

async function handle(req, res) {
    // Preflight
    if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

    const url = req.url.split('?')[0];

    // ── GET /health ──────────────────────────────────────────────────────────
    if (req.method === 'GET' && url === '/health') {
        return json(res, 200, { ok: true, version: VERSION, uptime: process.uptime() });
    }

    // ── GET / — serve the GUI HTML ───────────────────────────────────────────
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

    // ── POST /webhook-register ───────────────────────────────────────────────
    if (req.method === 'POST' && url === '/webhook-register') {
        try {
            const body = await readBody(req);
            if (!body.channelId || !body.webhookUrl) return json(res, 400, { error: 'channelId and webhookUrl required.' });
            webhooks[body.channelId] = body.webhookUrl;
            return json(res, 200, { ok: true, registered: body.channelId });
        } catch (e) { return json(res, 400, { error: e.message }); }
    }

    // ── POST /preview ─────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/preview') {
        try {
            const cfg = await readBody(req);
            // Fast path: echo validated config back — canvas rendering happens
            // client-side; this endpoint is for server-side validation / logging.
            return json(res, 200, {
                ok:     true,
                config: cfg,
                note:   'Preview validated. Canvas rendering is client-side.',
            });
        } catch (e) { return json(res, 400, { error: e.message }); }
    }

    // ── POST /generate ────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/generate') {
        try {
            const cfg = await readBody(req);
            const b   = cfg.brand   || {};
            const v   = cfg.visuals || {};

            // 1. Text generation — brand identity JSON
            let brandData = {};
            try {
                const raw = await geminiRequest(buildBrandPrompt(cfg), { maxOutputTokens: 512, temperature: 1.1 });
                brandData = extractJson(raw);
            } catch (e) {
                console.warn('[GUI] Text gen failed:', e.message);
                brandData = { name: b.name, tagline: b.tagline, palette: [v.primary_color, v.secondary_color] };
            }

            // 2. Image generation — icon (optional, skip if no API key in env)
            let iconBase64 = null;
            const iconPrompt = brandData.icon_prompt || b.image_prompt ||
                `${b.description || b.name} — dark fantasy icon, ${v.primary_color} tones, 400x400`;
            try {
                const imgBuf  = await geminiImageRequest(iconPrompt, { timeoutMs: 35_000 });
                iconBase64    = imgBuf.toString('base64');
            } catch (e) {
                console.warn('[GUI] Image gen skipped:', e.message);
            }

            // 3. Notify Discord webhook if registered
            if (cfg.integration?.channelId) {
                notifyWebhook(cfg.integration.channelId, brandData).catch(() => {});
            }

            return json(res, 200, {
                ok:         true,
                brand:      brandData,
                icon_b64:   iconBase64,
                config_in:  cfg,
            });
        } catch (e) {
            console.error('[GUI] /generate error:', e);
            return json(res, 500, { error: e.message });
        }
    }

    json(res, 404, { error: 'Not found', available: ['GET /', 'GET /health', 'POST /generate', 'POST /preview', 'POST /webhook-register'] });
}

// ─── Start ───────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    handle(req, res).catch(e => {
        console.error('[GUI] Unhandled:', e);
        try { json(res, 500, { error: 'Internal server error' }); } catch {}
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Sigil GUI] Server running → http://127.0.0.1:${PORT}`);
    console.log(`[Sigil GUI] Open GUI       → http://127.0.0.1:${PORT}/`);
    console.log(`[Sigil GUI] Health check   → http://127.0.0.1:${PORT}/health`);
});

module.exports = { server, webhooks };
