// src/services/postpilot.js
// Post-Pilot bridge for Sigil — wraps the Post-Pilot /v1/ REST API.
// All public methods return { success, data } or throw on network failure.

'use strict';

const https = require('https');
const http  = require('http');
const { URL } = require('url');

// ---- Config (loaded once at import) ----------------------------------------
const BASE_URL  = (process.env.POSTPILOT_URL  || '').replace(/\/$/, '');
const API_KEY   = process.env.POSTPILOT_API_KEY  || '';
const USER_ID   = process.env.POSTPILOT_USER_ID  || '';
const SRN_APP   = process.env.POSTPILOT_SRN_APP  || 'sigil';
const TIMEOUT_MS = parseInt(process.env.POSTPILOT_TIMEOUT_MS || '12000', 10);

// ---- Internals -------------------------------------------------------------

/**
 * Low-level JSON fetch. Returns parsed body or throws.
 * @param {'GET'|'POST'} method
 * @param {string} path  e.g. '/v1/health'
 * @param {object|null} body
 * @returns {Promise<object>}
 */
function _request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    if (!BASE_URL) {
      return reject(new Error('POSTPILOT_URL is not set in environment'));
    }

    const url     = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    const lib     = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-SRN-App':     SRN_APP,
      },
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = lib.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            const msg = parsed?.error || `HTTP ${res.statusCode}`;
            return reject(new Error(msg));
          }
          resolve(parsed);
        } catch {
          reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 120)}`));
        }
      });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`Post-Pilot request timed out after ${TIMEOUT_MS}ms`));
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---- Public API ------------------------------------------------------------

/**
 * GET /v1/health — no auth required.
 * @returns {Promise<{status:string, version:string, uptime:number}>}
 */
async function health() {
  const res = await _request('GET', '/v1/health');
  return res;
}

/**
 * POST /v1/generate_post
 * @param {object} opts
 * @param {string}  opts.topic
 * @param {string}  [opts.platform='instagram']
 * @param {string}  [opts.tone='engaging']
 * @param {string}  [opts.userId]
 * @returns {Promise<{caption:string, hashtags:string[]}>}
 */
async function generatePost({ topic, platform = 'instagram', tone = 'engaging', userId } = {}) {
  const res = await _request('POST', '/v1/generate_post', {
    topic,
    platform,
    tone,
    user_id: userId || USER_ID,
  });
  return res.data;
}

/**
 * POST /v1/publish_post
 * @param {object} opts
 * @param {string}   opts.caption
 * @param {string[]} [opts.platforms]
 * @param {string}   [opts.imageUrl]
 * @param {number}   [opts.scheduledAt]  Unix timestamp
 * @param {string}   [opts.userId]
 * @returns {Promise<{post_id:string, results:object}>}
 */
async function publishPost({ caption, platforms, imageUrl, scheduledAt, userId } = {}) {
  const body = {
    caption,
    platforms: platforms || ['facebook', 'instagram'],
    user_id:   userId || USER_ID,
  };
  if (imageUrl)    body.image_url    = imageUrl;
  if (scheduledAt) body.scheduled_at = scheduledAt;

  const res = await _request('POST', '/v1/publish_post', body);
  return res.data;
}

/**
 * POST /v1/generate_and_publish — one-shot.
 * @param {object} opts
 * @param {string}   opts.topic
 * @param {string[]} [opts.platforms]
 * @param {string}   [opts.tone='engaging']
 * @param {string}   [opts.imageUrl]
 * @param {string}   [opts.userId]
 * @returns {Promise<{caption:string, hashtags:string[], post_id:string, results:object}>}
 */
async function generateAndPublish({ topic, platforms, tone = 'engaging', imageUrl, userId } = {}) {
  const body = {
    topic,
    platforms: platforms || ['facebook', 'instagram'],
    tone,
    user_id:   userId || USER_ID,
  };
  if (imageUrl) body.image_url = imageUrl;

  const res = await _request('POST', '/v1/generate_and_publish', body);
  return res.data;
}

/**
 * GET /v1/get_history
 * @param {object} opts
 * @param {number} [opts.limit=5]
 * @param {string} [opts.userId]
 * @returns {Promise<{posts:object[], count:number}>}
 */
async function getHistory({ limit = 5, userId } = {}) {
  const uid = userId || USER_ID;
  const res = await _request('GET', `/v1/get_history?user_id=${encodeURIComponent(uid)}&limit=${limit}`);
  return res.data;
}

/**
 * GET /v1/get_site_config
 * @param {string} [userId]
 * @returns {Promise<object>}
 */
async function getSiteConfig(userId) {
  const uid = userId || USER_ID;
  const res = await _request('GET', `/v1/get_site_config?user_id=${encodeURIComponent(uid)}`);
  return res.data;
}

/**
 * Returns true if POSTPILOT_URL and POSTPILOT_API_KEY are set.
 */
function isConfigured() {
  return Boolean(BASE_URL && API_KEY && USER_ID);
}

// ---- Helpers ---------------------------------------------------------------

/**
 * Format a results object { facebook: {success, url}, ... } into a short string.
 * e.g. "✅ Facebook  ✅ Instagram  ❌ TikTok"
 */
function formatResults(results = {}) {
  return Object.entries(results)
    .map(([platform, r]) => {
      const icon  = r.success ? '✅' : '❌';
      const label = platform.charAt(0).toUpperCase() + platform.slice(1);
      return `${icon} ${label}`;
    })
    .join('  ');
}

/**
 * Parse a comma/space-separated platform string into the canonical array.
 * "facebook instagram" → ['facebook','instagram']
 */
function parsePlatforms(str) {
  const valid = ['facebook','instagram','tiktok','youtube','google','website'];
  return str
    .toLowerCase()
    .split(/[,\s]+/)
    .map(p => p.trim())
    .filter(p => valid.includes(p));
}

module.exports = {
  health,
  generatePost,
  publishPost,
  generateAndPublish,
  getHistory,
  getSiteConfig,
  isConfigured,
  formatResults,
  parsePlatforms,
};
