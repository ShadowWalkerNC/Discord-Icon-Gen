const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../sigil.db');

const db = new Database(DB_PATH);

function initDatabase() {
    db.prepare(`CREATE TABLE IF NOT EXISTS server_profiles (
        guild_id        TEXT PRIMARY KEY,
        brand_name      TEXT,
        tagline         TEXT,
        primary_color   TEXT DEFAULT '#FF0000',
        secondary_color TEXT DEFAULT '#000000',
        font_key        TEXT DEFAULT 'oswald',
        background_key  TEXT DEFAULT 'plain-black',
        theme_key       TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS user_profiles (
        user_id         TEXT PRIMARY KEY,
        primary_color   TEXT DEFAULT '#FF0000',
        secondary_color TEXT DEFAULT '#000000',
        font_key        TEXT DEFAULT 'oswald',
        glow_level      INTEGER DEFAULT 10,
        border_style    TEXT DEFAULT 'none'
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS server_settings (
        guild_id           TEXT PRIMARY KEY,
        automation_mode    TEXT DEFAULT 'off',
        welcome_channel_id TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS jobs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        type       TEXT NOT NULL,
        payload    TEXT NOT NULL DEFAULT '{}',
        status     TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id  TEXT NOT NULL,
        points   INTEGER DEFAULT 0,
        UNIQUE(guild_id, user_id)
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS clans (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        name     TEXT NOT NULL,
        color    TEXT DEFAULT '#FF0000',
        role_id  TEXT,
        UNIQUE(guild_id, name)
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS recurring_events (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id  TEXT NOT NULL,
        name      TEXT NOT NULL,
        interval  TEXT NOT NULL,
        next_run  TEXT NOT NULL
    )`).run();

    console.log('\u2713 Database initialised');
}

module.exports = { db, initDatabase };
