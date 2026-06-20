/**
 * Service Health Registry
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight in-process registry that lets any service self-report its
 * health.  The GUI server's /api/status/full endpoint reads from here so
 * the status layer gets per-service detail without extra HTTP calls.
 *
 * Usage (in a service):
 *   const registry = require('../util/serviceRegistry');
 *   registry.register('twitch-poller', { interval: 15_000 });
 *   registry.heartbeat('twitch-poller');          // mark alive
 *   registry.setError('twitch-poller', err);      // record last error
 *   registry.setMeta('twitch-poller', { guilds: 5 }); // attach extra data
 */

/** @type {Map<string, ServiceEntry>} */
const services = new Map();

/**
 * @typedef {Object} ServiceEntry
 * @property {string}        name
 * @property {number}        registeredAt  — epoch ms
 * @property {number|null}   lastHeartbeat — epoch ms
 * @property {string|null}   lastError
 * @property {number}        errorCount
 * @property {Object}        meta          — arbitrary extra data
 * @property {Object}        options       — options passed to register()
 */

/**
 * Register a service.  Safe to call multiple times (idempotent after first).
 * @param {string} name     Unique service key, e.g. 'twitch-poller'
 * @param {Object} [opts]   { interval, description }
 */
function register(name, opts = {}) {
    if (services.has(name)) return;
    services.set(name, {
        name,
        registeredAt:  Date.now(),
        lastHeartbeat: null,
        lastError:     null,
        errorCount:    0,
        meta:          {},
        options:       opts,
    });
}

/**
 * Record a successful tick / poll for a service.
 * @param {string} name
 */
function heartbeat(name) {
    const svc = services.get(name);
    if (!svc) return;
    svc.lastHeartbeat = Date.now();
}

/**
 * Record an error for a service.
 * @param {string}         name
 * @param {Error|string}   err
 */
function setError(name, err) {
    const svc = services.get(name);
    if (!svc) return;
    svc.lastError  = err?.message ?? String(err);
    svc.errorCount += 1;
}

/**
 * Attach arbitrary metadata to a service entry (merges, not replaces).
 * @param {string} name
 * @param {Object} data
 */
function setMeta(name, data) {
    const svc = services.get(name);
    if (!svc) return;
    Object.assign(svc.meta, data);
}

/**
 * Returns a plain-object snapshot of all registered services.
 * Includes a derived `status` field:
 *   'ok'       — heartbeat within 3× interval (or within 5 min if no interval)
 *   'stale'    — heartbeat too old
 *   'error'    — has a recent error AND no heartbeat since
 *   'starting' — never heartbeated yet
 * @returns {Object[]}
 */
function getSnapshot() {
    const now = Date.now();
    return [...services.values()].map(svc => {
        const intervalMs = svc.options.interval ?? 5 * 60_000;
        const threshold  = intervalMs * 3;

        let status;
        if (!svc.lastHeartbeat) {
            status = 'starting';
        } else if (now - svc.lastHeartbeat > threshold) {
            status = svc.lastError ? 'error' : 'stale';
        } else {
            status = 'ok';
        }

        return {
            name:          svc.name,
            status,
            lastHeartbeat: svc.lastHeartbeat,
            lastError:     svc.lastError,
            errorCount:    svc.errorCount,
            meta:          svc.meta,
            options:       svc.options,
        };
    });
}

/**
 * Returns the entry for a single service, or null.
 * @param {string} name
 */
function get(name) {
    return services.get(name) ?? null;
}

module.exports = { register, heartbeat, setError, setMeta, getSnapshot, get };
