// gui/auth.js — Sigil GUI auth helper v1.1
'use strict';

const _SERVER = window.location.origin;

let _token = null;
let _valid = false;

function _save(tok) {
    sessionStorage.setItem('gui_auth_token', tok);
    _token = tok;
    _valid = true;
}

function _load() {
    const t = sessionStorage.getItem('gui_auth_token');
    if (t && t.length >= 8) { _token = t; _valid = true; return true; }
    return false;
}

function clearAuthToken() {
    sessionStorage.removeItem('gui_auth_token');
    _token = null;
    _valid = false;
}

function getToken() {
    return _token || '';
}

function authBootstrap() {
    const params = new URLSearchParams(window.location.search);
    const tok    = params.get('token');
    if (tok && tok.length >= 8) {
        _save(tok);
        const clean = new URL(window.location.href);
        clean.searchParams.delete('token');
        history.replaceState(null, '', clean.toString());
        return true;
    }
    return _load();
}

async function authFetch(url, options = {}) {
    if (!_valid || !_token) {
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`;
        return Promise.reject(new Error('Not authenticated'));
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

// Expose BOTH as window.SigilAuth (used by pages) AND as top-level globals
window.SigilAuth = { authFetch, authBootstrap, clearAuthToken, getToken };
window.authFetch       = authFetch;
window.authBootstrap   = authBootstrap;
window.clearAuthToken  = clearAuthToken;
window.getToken        = getToken;

authBootstrap();
