'use strict';

/**
 * src/util/guiRequest.js
 * Thin HTTP wrapper for bot commands to call gui-server.js.
 * Reads GUI_SERVER_URL from .env (default: http://localhost:8080).
 */

const http  = require('http');
const https = require('https');

const BASE = (process.env.GUI_SERVER_URL || 'http://localhost:8080').replace(/\/$/, '');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url     = new URL(BASE + path);
        const driver  = url.protocol === 'https:' ? https : http;
        const payload = body ? JSON.stringify(body) : null;

        const options = {
            hostname: url.hostname,
            port:     url.port || (url.protocol === 'https:' ? 443 : 80),
            path:     url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
        };

        const req = driver.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve({ ok: false, error: `Non-JSON response (HTTP ${res.statusCode})` }); }
            });
        });

        req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('gui-server timed out (8s) — is it running?'));
        });
        req.on('error', e => reject(new Error(`gui-server unreachable: ${e.message}`)));

        if (payload) req.write(payload);
        req.end();
    });
}

const guiGet  = (path)       => request('GET',  path, null);
const guiPost = (path, body) => request('POST', path, body);

module.exports = { guiGet, guiPost, request };
