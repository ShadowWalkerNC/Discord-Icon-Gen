// gui/auth.js — Sigil GUI auth helper v1.0
// Session bootstrap + authFetch() wrapper for authenticated API routes.
// Loaded by all GUI pages via <script type="module" src="/auth.js">.

'use strict';

const _SERVER = window.location.origin;

// ── Session state ─────────────────────────────────────────────────────────
let _token  = null;
let _valid  = false;

// ── Helpers ───────────────────────────────────────────────────────────────
function _save(tok) {
    sessionStorage.setItem('gui_auth_token', tok);
    _token = tok;
    _valid = true;
}

function _load() {
    const t = sessionStorage.getItem('gui_auth_token');
    if (t && t.length >= 20) { _token = t; _valid = true; return true; }
    return false;
}

/** Remove token + invalidate session (call on logout). */
function clearAuthToken() {
    sessionStorage.removeItem('gui_auth_token');
    _token = null;
    _valid = false;
}

/**
 * Bootstrap: check URL ?token= (post-OAuth redirect) → sessionStorage.
 * Called automatically on script load.
 */
function authBootstrap() {
    const params = new URLSearchParams(window.location.search);
    const tok    = params.get('token');
    if (tok && tok.length >= 20) {
        _save(tok);
        // Strip the token from the visible URL without reloading
        const clean = new URL(window.location.href);
        clean.searchParams.delete('token');
        history.replaceState(null, '', clean.toString());
        return true;
    }
    return _load();
}

/**
 * Authenticated fetch wrapper.
 *
 * - POST / PUT / DELETE → injects `Authorization: Bearer <token>` header.
 * - GET                 → appends `?token=<token>` query param.
 *
 * If no valid session exists the browser is redirected to /auth/discord.
 *
 * @param {string}      url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
async function authFetch(url, options = {}) {
    if (!_valid || !_token) {
        window.location.href = `${_SERVER}/auth/discord?return=${encodeURIComponent(window.location.pathname)}`;
        return Promise.reject(new Error('Not authenticated — redirecting to login.'));
    }

    const method = (options.method || 'GET').toUpperCase();
    const opts   = { ...options };

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        opts.headers = { ...(options.headers || {}), 'Authorization': `Bearer ${_token}` };
    } else {
        const u = new URL(url, _SERVER);
        u.searchParams.set('token', _token);
        url = u.toString();
    }

    return fetch(url, opts);
}

// ── Global exports ────────────────────────────────────────────────────────
// Exposed on window so non-module inline scripts can call them directly.
window.authBootstrap   = authBootstrap;
window.authFetch       = authFetch;
window.clearAuthToken  = clearAuthToken;

// Auto-run bootstrap
authBootstrap();
