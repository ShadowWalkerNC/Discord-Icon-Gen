// gui/auth.js — Sigil GUI auth token helper
// Reads the auth token from a <meta name="gui-auth-token" content="..."> tag
// that gui-server.js injects into every HTML response at serve time.
//
// Usage in any GUI page:
//   SigilAuth.authFetch('/api/packages?guild_id=...')         // GET
//   SigilAuth.authFetch('/api/packages', { method:'POST', ... }) // POST
//   SigilAuth.authHeaders()  → { 'Authorization': 'Bearer ...' }
//   SigilAuth.getToken()     → 'abc123...'
//
// WebSocket usage:
//   const ws = new WebSocket(`/ws/logs?token=${SigilAuth.getToken()}`);

(function () {
    'use strict';

    let _token = null;

    function getToken() {
        if (_token) return _token;
        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="gui-auth-token"]');
            if (meta && meta.getAttribute('content')) {
                _token = meta.getAttribute('content');
                return _token;
            }
        }
        console.warn(
            '[SigilAuth] GUI_AUTH_TOKEN not found in <meta name="gui-auth-token">. ' +
            'Ensure GUI_AUTH_TOKEN is set in your environment.'
        );
        return '';
    }

    /** Returns { 'Authorization': 'Bearer <token>' } or {} if no token. */
    function authHeaders() {
        const token = getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    /**
     * Auth-aware drop-in replacement for fetch().
     * Automatically appends the Authorization header.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    function authFetch(url, options) {
        const opts    = options || {};
        const headers = Object.assign({}, opts.headers || {}, authHeaders());
        return fetch(url, Object.assign({}, opts, { headers: headers }));
    }

    if (typeof window !== 'undefined') {
        window.SigilAuth = { getToken: getToken, authHeaders: authHeaders, authFetch: authFetch };
    }
}());
