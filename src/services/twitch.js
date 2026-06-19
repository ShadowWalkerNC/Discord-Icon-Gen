/**
 * Twitch API helpers.
 * Uses Client Credentials flow — set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env
 * Falls back gracefully if credentials are missing.
 */
const https = require('https');

let _token     = null;
let _tokenExp  = 0;

function httpsGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        }).on('error', reject);
    });
}

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const data    = Buffer.from(body);
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length },
        };
        const req = https.request(url, options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
                catch { resolve({ status: res.statusCode, body: d }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function getAppToken() {
    const id     = process.env.TWITCH_CLIENT_ID;
    const secret = process.env.TWITCH_CLIENT_SECRET;
    if (!id || !secret) throw new Error('TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET not set');

    if (_token && Date.now() < _tokenExp) return _token;

    const res = await httpsPost(
        'https://id.twitch.tv/oauth2/token',
        `client_id=${id}&client_secret=${secret}&grant_type=client_credentials`
    );
    if (!res.body.access_token) throw new Error('Twitch token exchange failed: ' + JSON.stringify(res.body));
    _token    = res.body.access_token;
    _tokenExp = Date.now() + (res.body.expires_in - 60) * 1000;
    return _token;
}

/**
 * Fetch live stream data for an array of logins.
 * Returns a Map<login, streamObject> of streamers currently live.
 */
async function getLiveStreams(logins) {
    if (!logins.length) return new Map();
    const id    = process.env.TWITCH_CLIENT_ID;
    const token = await getAppToken();
    const q     = logins.map(l => `user_login=${encodeURIComponent(l)}`).join('&');
    const res   = await httpsGet(`https://api.twitch.tv/helix/streams?${q}`, {
        'Client-Id': id,
        'Authorization': `Bearer ${token}`,
    });
    const map = new Map();
    for (const s of (res.body?.data ?? [])) map.set(s.user_login.toLowerCase(), s);
    return map;
}

/**
 * Resolve Twitch user info (id, login, display_name, profile_image_url) by login.
 */
async function getUserByLogin(login) {
    const id    = process.env.TWITCH_CLIENT_ID;
    const token = await getAppToken();
    const res   = await httpsGet(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`, {
        'Client-Id': id,
        'Authorization': `Bearer ${token}`,
    });
    return res.body?.data?.[0] ?? null;
}

module.exports = { getLiveStreams, getUserByLogin };
