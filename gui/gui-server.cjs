'use strict';

const http = require('http');
const path = require('path');
const fs   = require('fs');

const PORT    = Number(process.env.PORT) || Number(process.env.GUI_PORT) || 3420;
const VERSION = '1.2.1';
const START   = Date.now();

const webhooks = {};

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

const BG_MAP = {
    'midnight-gradient': 'midnight-gradient', 'deep-space': 'starfield',
    'inferno': 'sunset', 'ocean-depth': 'cyberpunk-grid', 'forest-night': 'forest',
    'twilight': 'midnight-gradient', 'storm': 'carbon-fiber', 'sunset-fade': 'sunset',
    'void': 'plain-black', 'neon-city': 'cyberpunk-grid', 'plain-black': 'plain-black',
    'plain-white': 'plain-white', 'sunset': 'sunset', 'forest': 'forest',
    'cyberpunk-grid': 'cyberpunk-grid', 'starfield': 'starfield', 'carbon-fiber': 'carbon-fiber',
};

function configToRenderKitOpts(cfg) {
    const b = cfg.brand || {};
    const v = cfg.visuals || {};
    return {
        name:       (b.banner_text || b.name || 'Sigil').slice(0, 30),
        initials:   (b.icon_text  || b.name || 'SG').slice(0, 4).toUpperCase(),
        color:      v.primary_color   || '#8B0000',
        color2:     v.secondary_color || null,
        background: BG_MAP[v.background] || 'midnight-gradient',
        border:     v.border  || 'none',
        glow:       String(v.glow ?? 10),
        tagline:    b.tagline || null,
        fontKey:    v.font    || 'another-danger',
    };
}

function buildBrandPrompt(cfg) {
    const v = cfg.visuals || {};
    const b = cfg.brand   || {};
    return [
        `Generate a brand identity JSON for a Discord server named "${b.name || 'Untitled'}".`,
        `Description: ${b.description || b.tagline || 'No description provided'}.`,
        `Primary color: ${v.primary_color || '#8B0000'}, Secondary: ${v.secondary_color || '#4B0082'}.`,
        `Return ONLY a JSON object with keys: name, tagline, palette (array of 3-6 hex strings),`,
        `icon_prompt (image gen prompt), banner_prompt, description (1-2 sentences).`,
    ].join(' ');
}

const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    const url = req.url.split('?')[0];

    if (req.method === 'GET' && url === '/') {
        const htmlPath = path.join(__dirname, 'sigil-gui-builder.html');
        try {
            const html = fs.readFileSync(htmlPath);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(html);
        } catch {
            return json(res, 500, { error: 'GUI HTML not found.' });
        }
    }

    if (req.method === 'GET' && url === '/health') {
        return json(res, 200, { ok: true, version: VERSION, uptime: Math.floor((Date.now() - START) / 1000) });
    }

    if (req.method === 'POST' && url === '/preview') {
        try {
            const { createRequire } = require('module');
            const require2 = createRequire(path.join(__dirname, '../src/utils/canvas.js'));
            // Dynamic import for ESM canvas module
            const { renderKit } = await (async () => {
                const mod = await import('../src/utils/canvas.js');
                return mod;
            })();
            const cfg  = await readBody(req);
            const opts = configToRenderKitOpts(cfg);
            const kit  = await renderKit(opts);
            return json(res, 200, { ok: true, icon_b64: kit.icon?.toString('base64') || null, banner_b64: kit.banner?.toString('base64') || null });
        } catch (e) {
            console.error('[/preview]', e);
            return json(res, 500, { error: e.message });
        }
    }

    if (req.method === 'POST' && url === '/generate') {
        try {
            const cfg    = await readBody(req);
            const apiKey = cfg.gemini_api_key || process.env.GEMINI_API_KEY;
            if (!apiKey) return json(res, 400, { error: 'Gemini API key required.' });
            process.env.GEMINI_API_KEY = apiKey;

            const { geminiRequest, geminiImageRequest, extractJson } = require('./gemini-cjs.cjs');
            const { renderKit } = await import('../src/utils/canvas.js');

            const rawText = await geminiRequest(buildBrandPrompt(cfg), { temperature: 0.9, maxOutputTokens: 400 });
            const brand   = extractJson(rawText);
            const baseOpts  = configToRenderKitOpts(cfg);
            const finalOpts = { ...baseOpts, name: brand.name || baseOpts.name, tagline: brand.tagline || baseOpts.tagline };
            const kit = await renderKit(finalOpts);

            let ai_image_b64 = null;
            const imgPrompt = brand.icon_prompt || cfg.brand?.ai_prompt;
            if (imgPrompt) {
                try {
                    const imgBuf = await geminiImageRequest(imgPrompt);
                    ai_image_b64 = imgBuf?.toString('base64') || null;
                } catch (imgErr) { console.warn('[/generate] AI image skipped:', imgErr.message); }
            }

            return json(res, 200, {
                ok: true, brand,
                icon_b64:    kit.icon?.toString('base64')    || null,
                banner_b64:  kit.banner?.toString('base64')  || null,
                palette_b64: kit.palette?.toString('base64') || null,
                ai_image_b64,
            });
        } catch (e) {
            console.error('[/generate]', e);
            return json(res, 500, { error: e.message });
        }
    }

    json(res, 404, { error: `No route for ${req.method} ${url}` });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ✦ Sigil GUI Server v${VERSION} → http://0.0.0.0:${PORT}\n`);
});
