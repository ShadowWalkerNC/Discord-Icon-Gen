'use strict';

const http = require('http');

/**
 * Lightweight HTTP client — no extra dependencies.
 * Talks to gui-server.js on localhost.
 */
function apiRequest(method, path, body, { host = 'localhost', port = 8080 } = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: host,
            port:     Number(port),
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timed out — is gui-server running?')); });
        req.on('error', (e) => reject(new Error(`Cannot reach gui-server (${host}:${port}) — ${e.message}`)));
        if (payload) req.write(payload);
        req.end();
    });
}

function getServer(flags) {
    return {
        host: flags.host || 'localhost',
        port: Number(flags.port) || 8080,
    };
}

module.exports = { apiRequest, getServer };
