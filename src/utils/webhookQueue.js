/**
 * src/utils/webhookQueue.js
 * Replaces global.sigilClient IPC for webhook dispatch.
 *
 * gui-server writes a row to webhook_queue via enqueueWebhook().
 * The bot polls processWebhookQueue() on an interval and dispatches
 * events using the live discord.js client — no global required.
 */

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'sigil.db');

// ── Writer (called from gui-server process) ───────────────────────────────────

/**
 * Enqueue a webhook event for the bot to dispatch.
 * @param {string} type       - e.g. 'twitch.live'
 * @param {string} guildId
 * @param {object} payload    - event-specific data
 */
function enqueueWebhook(type, guildId, payload) {
    let db;
    try {
        db = new Database(DB_PATH);
        db.prepare(`
            INSERT INTO webhook_queue (type, guild_id, payload, processed)
            VALUES (?, ?, ?, 0)
        `).run(type, guildId, JSON.stringify(payload));
    } finally {
        if (db) db.close();
    }
}

// ── Reader / processor (called from bot process) ──────────────────────────────

/**
 * Poll the queue and dispatch any unprocessed events.
 * Call this on an interval (e.g. every 5 s) from the bot process.
 * @param {import('discord.js').Client} client
 * @param {object} handlers  - { 'twitch.live': fn, 'youtube.upload': fn, 'github.push': fn }
 */
async function processWebhookQueue(client, handlers) {
    const db = new Database(DB_PATH);
    try {
        const rows = db.prepare(`
            SELECT * FROM webhook_queue
            WHERE processed = 0
            ORDER BY ts ASC
            LIMIT 20
        `).all();

        for (const row of rows) {
            let error = null;
            try {
                const payload = JSON.parse(row.payload || '{}');
                payload.guildId = row.guild_id;
                payload.client  = client;
                const handler = handlers[row.type];
                if (handler) {
                    await handler(payload);
                } else {
                    error = `Unknown event type: ${row.type}`;
                }
            } catch (err) {
                error = err.message;
                console.error(`[webhookQueue] Error processing row ${row.id} (${row.type}):`, err);
            }

            db.prepare(`
                UPDATE webhook_queue
                SET processed = 1, error = ?
                WHERE id = ?
            `).run(error, row.id);
        }

        // Prune processed rows older than 24 h to keep the table small
        db.prepare(`
            DELETE FROM webhook_queue
            WHERE processed = 1
              AND ts < (unixepoch('now') * 1000 - 86400000)
        `).run();
    } finally {
        db.close();
    }
}

module.exports = { enqueueWebhook, processWebhookQueue };
