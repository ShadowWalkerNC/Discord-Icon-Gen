/**
 * src/db.js
 * Single source of truth for the SQLite database connection.
 * All CREATE TABLE IF NOT EXISTS + ALTER TABLE migrations run here
 * before any command file calls db.prepare().
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'sigil.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    -- Scheduler / MyShift bridge
    CREATE TABLE IF NOT EXISTS shift_links (
        discord_id  TEXT PRIMARY KEY,
        staff_name  TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scheduler_config (
        guild_id        TEXT PRIMARY KEY,
        api_url         TEXT NOT NULL,
        bridge_key      TEXT NOT NULL,
        post_channel    TEXT,
        post_time       TEXT NOT NULL DEFAULT '07:00',
        timezone        TEXT NOT NULL DEFAULT 'America/New_York'
    );

    -- Giveaways
    CREATE TABLE IF NOT EXISTS giveaways (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id    TEXT NOT NULL,
        channel_id  TEXT NOT NULL,
        message_id  TEXT,
        prize       TEXT NOT NULL,
        winners     INTEGER NOT NULL DEFAULT 1,
        ends_at     INTEGER NOT NULL,
        ended       INTEGER NOT NULL DEFAULT 0,
        host_id     TEXT NOT NULL
    );

    -- Welcome config (base schema — migrations below add new columns)
    CREATE TABLE IF NOT EXISTS welcome_config (
        guild_id    TEXT PRIMARY KEY,
        channel_id  TEXT,
        message     TEXT,
        enabled     INTEGER NOT NULL DEFAULT 1
    );

    -- Autorole
    CREATE TABLE IF NOT EXISTS autorole (
        guild_id    TEXT NOT NULL,
        role_id     TEXT NOT NULL,
        PRIMARY KEY (guild_id, role_id)
    );

    -- Reminders
    CREATE TABLE IF NOT EXISTS reminders (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     TEXT NOT NULL,
        guild_id    TEXT,
        channel_id  TEXT,
        message     TEXT NOT NULL,
        remind_at   INTEGER NOT NULL,
        done        INTEGER NOT NULL DEFAULT 0
    );

    -- Guild config (general)
    CREATE TABLE IF NOT EXISTS guild_config (
        guild_id    TEXT PRIMARY KEY,
        prefix      TEXT NOT NULL DEFAULT '/'
    );

    -- CulinaryOS bridge
    CREATE TABLE IF NOT EXISTS culinaryos_config (
        guild_id        TEXT PRIMARY KEY,
        api_url         TEXT NOT NULL,
        api_key         TEXT NOT NULL,
        menu_channel    TEXT,
        alert_channel   TEXT
    );

    -- ── IPC bridge: bot → gui-server ─────────────────────────────────────────
    -- Single-row heartbeat written by the bot every 30 s.
    -- gui-server reads this instead of global.sigilClient.
    CREATE TABLE IF NOT EXISTS bot_heartbeat (
        id          INTEGER PRIMARY KEY CHECK (id = 1),
        ts          INTEGER NOT NULL,   -- epoch ms of last write
        guilds      INTEGER NOT NULL DEFAULT 0,
        latency     INTEGER NOT NULL DEFAULT 0,
        tag         TEXT    NOT NULL DEFAULT ''
    );

    -- Per-service health rows written by the bot after each registry flush.
    CREATE TABLE IF NOT EXISTS service_registry (
        name          TEXT PRIMARY KEY,
        status        TEXT NOT NULL DEFAULT 'starting',
        last_heartbeat INTEGER,
        last_error    TEXT,
        error_count   INTEGER NOT NULL DEFAULT 0,
        meta          TEXT    NOT NULL DEFAULT '{}',
        options       TEXT    NOT NULL DEFAULT '{}'
    );

    -- Rolling log buffer written by the bot process.
    -- gui-server tails this for /api/logs and /ws/logs (bot-side lines).
    CREATE TABLE IF NOT EXISTS log_buffer (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        ts      INTEGER NOT NULL,
        level   TEXT    NOT NULL DEFAULT 'info',
        text    TEXT    NOT NULL
    );
`);

// ── Migrations (safe to re-run — each is wrapped in a try/catch) ─────────────
const migrate = (sql) => { try { db.exec(sql); } catch (_) {} };

// welcome_config v2 — added embed support + DM
migrate(`ALTER TABLE welcome_config ADD COLUMN embed_title  TEXT`);
migrate(`ALTER TABLE welcome_config ADD COLUMN embed_color  TEXT DEFAULT '#5865F2'`);
migrate(`ALTER TABLE welcome_config ADD COLUMN dm_enabled   INTEGER DEFAULT 0`);
migrate(`ALTER TABLE welcome_config ADD COLUMN dm_message   TEXT`);

// guild_config v2 — package system
// packages_disabled stores a JSON array of package keys that are OFF for this guild.
// Omitted = all packages enabled (default-on behaviour).
migrate(`ALTER TABLE guild_config ADD COLUMN packages_disabled TEXT DEFAULT '[]'`);

module.exports = db;
