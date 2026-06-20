'use strict';

const { apiRequest, getServer } = require('../lib/request.js');
const { err, divider } = require('../lib/output.js');

/**
 * sigil logs [--tail N]
 *
 * Calls GET /api/logs on gui-server (if that endpoint exists),
 * otherwise falls back to polling /health to confirm the server is alive
 * and prints a note that live log streaming requires a TTY session.
 *
 * Full log tailing (via process stdout pipe) isn't possible over HTTP
 * without a persistent WebSocket — that's Phase 2 of the CLI.
 */
module.exports = async function logs({ flags }) {
    const srv   = getServer(flags);
    const tail  = Number(flags.tail || 50);

    divider(`Logs — last ${tail} lines`);

    // Try the /api/logs endpoint (not yet implemented, future placeholder)
    try {
        const { status, body: res } = await apiRequest('GET', `/api/logs?tail=${tail}`, null, srv);
        if (status === 200 && Array.isArray(res.lines)) {
            for (const line of res.lines) {
                console.log(`  \x1b[90m${line}\x1b[0m`);
            }
            console.log();
            return;
        }
    } catch {
        // endpoint not available yet — fall through
    }

    // Fallback: confirm server is live and guide the user
    try {
        const { body: health } = await apiRequest('GET', '/health', null, srv);
        if (health.ok) {
            console.log(`  \x1b[32m✔\x1b[0m  gui-server v${health.version} is running on port ${srv.port}.`);
            console.log(`  \x1b[90m  Live log streaming not yet available over HTTP.\x1b[0m`);
            console.log(`  \x1b[90m  To tail logs now, run: \x1b[36mnode gui/gui-server.js 2>&1 | tail -f\x1b[0m`);
        }
    } catch (e) {
        err(`Cannot reach gui-server: ${e.message}`);
        process.exit(1);
    }
    console.log();
};
