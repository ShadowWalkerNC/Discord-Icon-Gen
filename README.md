<div align="center">

# ✦ Sigil

**The all-in-one Discord bot platform — built to be forked, owned, and made yours.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sigil.up.railway.app-7c3aed?style=for-the-badge&logo=railway)](https://sigil.up.railway.app)
[![Discord](https://img.shields.io/badge/Demo%20Server-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/7c89HKrVe)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs)]()

</div>

---

## What is Sigil?

Sigil is a production-ready Discord bot platform that pairs a full-featured bot with a live web dashboard. It ships with 71+ slash commands, a visual brand builder, a setup wizard, and a developer-friendly CLI — all self-hosted, all open source.

The live URL is both a **marketing site** and a **working demo**. Anyone can browse the GUI, preview features, and use the brand builder live. When you fork the project, that same URL becomes yours — preconfigured, styled, and ready to deploy.

Sigil is a node in the [ShadowRealm Network](docs/SHADOWREALM_NETWORK.md) — a personal microservices ecosystem. It follows the shared `/v1/health`, `/v1/manifest`, and auth envelope contracts across all connected apps.

> **Who it's for:** Community managers, developers, content creators, faith communities, gaming servers, nonprofits, small teams, and any server that deserves more than a generic bot.

---

## Live Pages

| Page | URL | Purpose |
|---|---|---|
| **Home** | `/` | Feature overview and bot intro — your marketing landing page |
| **Brand Builder** | `/brand` | Live canvas GUI for icons, banners, palettes |
| **Community Tools** | `/community` | Welcome card previews, reaction roles, giveaway controls |
| **Status Dashboard** | `/status` | Real-time bot health, service heartbeats, live log tail |
| **Packages** | `/packages` | Toggle feature packages per guild from the browser |
| **Setup Wizard** | `/setup` | Step-by-step guided setup for new deployments |
| **Developer Docs** | `/developers` | API reference, webhook config, integration guide |
| **Health Check** | `/health` | JSON endpoint — uptime, version, service status |

---

## Feature Packages

All commands are grouped into **packages** that can be toggled per guild from the `/packages` dashboard page or via `POST /api/packages`. Disabling a package silently blocks its commands with a friendly ephemeral message — no re-registration with Discord required.

> **Default:** All packages are **enabled** for every guild until explicitly disabled.

### Command Quality Tiers

| Tag | Meaning |
|---|---|
| ✅ **Production** | Tested, stable, actively maintained |
| 🔨 **Beta** | Functional — edge cases may exist |
| ⚠️ **Stub** | Core feature implemented, not fully tested |
| 📋 **Planned** | Declared but not yet built |

---

### 🎨 Branding (`branding`) — ✅ Production

Professional server icons, banners, logos, palette cards, and templated graphics — all rendered server-side with node-canvas.

`/brand` `/icon` `/banner` `/logo` `/avatar` `/compare` `/template`

### ✨ Nitro-Free (`nitrofree`) — ✅ Production

Canvas tools that replicate Nitro perks for free: custom stickers, emotes, profile cards, name cards, and image effects.

`/sticker` `/emote` `/reactionpack` `/rolebadge` `/resize` `/splash` `/namecard` `/servercard` `/profilecard` `/texteffect` `/themepreview`

### 🏨 Community (`community`) — ✅ Production

Welcome cards, event graphics, certificates, rank cards, and invite cards for member engagement.

`/welcomecard` `/rankcard` `/announcebanner` `/eventbanner` `/eventrecap` `/certificate` `/invitecard`

### ⛪ Faith & Devotional (`faith`) — 🔨 Beta

Built-in tools for churches, ministries, and faith-based communities.

`/bible` `/devotional` `/sermon` `/prayer`

- Daily Bible verse posts via API.Bible (400+ translations)
- Morning devotional scheduler — posts automatically every day
- Sermon notes and event recaps with branded embeds
- Requires `BIBLE_API_KEY`. Package is gracefully disabled if the key is absent — commands return a friendly message, no crash.

### 🗳️ Polls (`polls`) — ✅ Production

Multi-option polls with auto-close and timed giveaways.

`/poll` `/giveaway`

### 📊 Analytics (`analytics`) — 🔨 Beta

Live server health and member metrics.

`/serverstats`

### ⭐ XP & Levels (`xp`) — ✅ Production

A full XP economy with rank cards, weekly leaderboards, and level-based role rewards.

`/xprank` `/xpleaderboard` `/weeklyleaderboard` `/loyalty` `/levelroles` `/xpadmin`

- Configurable XP rate and cooldown per server
- Weekly XP tracking with automatic Sunday reset
- Level-based auto-role assignment

### 🎟️ Tickets (`tickets`) — ✅ Production

Structured support thread system.

`/ticket`

### 🧠 AI Tools (`aitools`) — 🔨 Beta

AI-powered utilities backed by Anthropic Claude.

`/mood` `/palette` `/saveme` `/history`

> AI calls are made directly to Anthropic (`ANTHROPIC_API_KEY`). Planned: route through ShadowRealm Network's `/v1/generate` endpoint so the AI key lives centrally. See [docs/SHADOWREALM_NETWORK.md](docs/SHADOWREALM_NETWORK.md).

---

### 🛡️ Moderation *(always on)*

A complete automod suite with configurable rules, persistent case logging, and mod-log channels.

`/automod` `/ban` `/kick` `/unban` `/timeout` `/warn` `/history` `/purge` `/slowmode` `/logging` `/modlog` `/ticket` `/compare`

- Anti-spam, anti-links, anti-mentions, anti-caps, bad-words filter
- Per-rule thresholds, bypass roles, allowed domain whitelist
- Persistent case numbers and ticket thread system

### 🎉 Community Engagement *(always on)*

Core engagement tools that run regardless of package state.

`/welcome` `/reactionroles` `/bumpreminder` `/autorole` `/starboard` `/rsvp` `/volunteer` `/lfg`

### 📅 Scheduler & Staff *(always on)*

Shift management, scheduled posts, and announcement engine.

`/shift` `/myshift` `/callout` `/schedule` `/remind` `/announce` `/embed`

### 🔗 Integrations *(always on)*

YouTube alerts, Twitch live notifications, and custom server commands.

`/youtube` `/twitch` `/customcmd` `/integrations`

> **Music commands** (`/nowplaying`, `/play`, `/queue`) — ⚠️ Stub. No audio library is wired in the current `package.json`. These commands exist in the codebase but call an external service stub. Do not rely on them for production music playback until a library (e.g. `discord-player`, Lavalink) is integrated.

### 🍳 CulinaryOS Bridge *(in development — hidden until live)*

A first-party Discord integration for **CulinaryOS**. Connects live menu, recipe, and inventory data into Discord. Commands are registered but gated behind a config check — they do **not** appear in Discord autocomplete until `CULINARYOS_API_URL` and `CULINARYOS_API_KEY` are both set and CulinaryOS is live.

`/menu` `/recipe` `/inventory`

> See [docs/CULINARYOS_BRIDGE.md](docs/CULINARYOS_BRIDGE.md) for architecture details.

---

## Getting Started

### Option 1 — Setup Wizard (Recommended for most users)

Fork the repo, deploy to Railway, then open your live URL and go to `/setup`. The wizard walks you through:

1. Connecting your bot token and client ID
2. Selecting which feature packages to enable
3. Registering slash commands with one click
4. Configuring channels, roles, and API keys per feature

No terminal required for basic setup.

### Option 2 — CLI (Recommended for developers)

```bash
npx sigil setup
```

```bash
# Available CLI commands
sigil setup          # Interactive setup wizard
sigil deploy         # Register/update slash commands
sigil status         # Check bot and service health
sigil logs           # Tail live bot logs
sigil restart        # Trigger a graceful restart (requires CONTROL_SECRET)
```

### Option 3 — Manual

```bash
git clone https://github.com/ShadowWalkerNC/Sigil
cd Sigil
npm install
cp .env.example .env    # fill in your values
npm run deploy-commands # register slash commands with Discord
npm start               # bot process
npm run gui             # web dashboard (separate process or combined via PM2)
```

---

## Environment Variables

All variables are documented in [`.env.example`](.env.example). Required ones are needed to start. Everything else unlocks an optional feature.

> ⚠️ **Never commit `.env`** — it is listed in `.gitignore`. Use `.env.example` as your template.

### Core (required)

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot login token from Discord Developer Portal |
| `CLIENT_ID` | Your Discord application's client ID |
| `GUI_AUTH_TOKEN` | Shared secret for all GUI API access. Generate: `openssl rand -hex 32` |

### GUI Dashboard

| Variable | Description |
|---|---|
| `GUI_URL` | Your public dashboard URL (shown in Discord `/gui open`) |
| `CONTROL_SECRET` | Enables `/api/control/restart` and `/api/control/deploy-commands` endpoints |
| `PORT` | HTTP port (default `8080`). Railway sets this automatically. |

### Discord OAuth login (recommended for production)

| Variable | Description |
|---|---|
| `DISCORD_CLIENT_ID` | Your Discord application's client ID (same as `CLIENT_ID`) |
| `DISCORD_CLIENT_SECRET` | OAuth2 secret — Discord Dev Portal → OAuth2 tab |
| `DISCORD_REDIRECT_URI` | Must match exactly: `https://YOUR-DOMAIN/auth/discord/callback` |
| `DISCORD_OAUTH_URL` | Full authorization URL — Discord Dev Portal → OAuth2 → URL Generator (scope: `identify`) |

Without these, `/login` token-entry page is used as a fallback.

### Optional features

| Variable | Unlocks |
|---|---|
| `ANTHROPIC_API_KEY` | `/mood`, `/palette`, `/saveme`, `/history` — AI features (Anthropic Claude) |
| `YOUTUBE_API_KEY` | YouTube upload alerts |
| `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` | Twitch live alerts |
| `BIBLE_API_KEY` | Daily devotionals via API.Bible |
| `CULINARYOS_API_URL` + `CULINARYOS_API_KEY` | CulinaryOS bridge (commands hidden until both are set) |
| `SRN_REGISTRY_URL` | ShadowRealm Network AI routing (future — replaces direct Anthropic calls) |

---

## Deployment

### Railway (recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

Sigil uses a **Dockerfile** for Railway deployments. Railway detects it automatically and builds the container, which includes all canvas native dependencies (`libcairo2`, `libuuid`, etc.). Set your env vars in the Railway dashboard and push to deploy.

> ⚠️ If Railway falls back to Nixpacks (canvas commands skip with `libuuid.so.1` errors), verify `railway.toml` has `dockerfilePath = "Dockerfile"`.

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full Railway + Discord OAuth setup walkthrough.

### PM2 (self-hosted VPS)

```bash
npm install
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 startup
```

The `ecosystem.config.js` starts both the bot process and the GUI server, keeps them alive, and restarts on crash.

### Docker

```bash
docker build -t sigil .
docker run -d --env-file .env -p 8080:8080 sigil
```

The included `Dockerfile` uses `node:20-slim` with all canvas native deps pre-installed.

---

## NPM Scripts

```bash
npm start              # Start the bot (src/index.js)
npm run dev            # Start the bot with --watch (live reload)
npm run gui            # Start the GUI server (gui/gui-server.js)
npm run gui:dev        # Start GUI with --watch
npm run lint           # ESLint across src/ and gui/
npm run deploy-commands  # Register/refresh slash commands with Discord API
npm test               # Run test suite (node:test)
```

---

## Architecture

```
Sigil/
├── src/
│   ├── index.js             # Bot entry — loads commands, events, IPC bridge
│   ├── db.js                # SQLite schema + migrations (runs at boot)
│   ├── server.js            # Lightweight API server for GUI reads/writes
│   ├── commands/            # 71+ slash command files
│   │   ├── _*_impl.js       # Heavy impl logic (canvas, DB, API calls)
│   │   └── *.js             # Thin entry points: package gate → impl.execute()
│   ├── events/              # Discord.js event handlers
│   ├── services/            # Background pollers and scheduled runners
│   │   ├── pollers.js       # Twitch (15s) + YouTube (60s) live pollers
│   │   ├── scheduler.js     # Scheduled posts, polls, giveaways, bump reminders
│   │   └── statsRunner.js   # Weekly stats poster (Mon 09:00 UTC)
│   ├── automation/          # Webhook handler (Twitch, YouTube, GitHub triggers)
│   ├── utils/
│   │   ├── packages.js      # isEnabled / enablePackage / disablePackage helpers
│   │   ├── ssrfGuard.js     # SSRF protection for user-supplied URLs
│   │   └── webhookQueue.js  # Debounced webhook event dispatcher
│   └── util/
│       ├── serviceRegistry.js  # In-process service health tracker
│       └── logBuffer.js        # In-process log ring buffer
├── gui/
│   ├── gui-server.js        # Express server — API + WebSocket + static pages
│   ├── auth.js              # Client-side auth helper — token bootstrap, authFetch()
│   ├── login.html           # Token-entry fallback login page
│   ├── index.html           # Home / marketing landing page
│   ├── sigil-gui-builder.html  # Brand builder live canvas GUI
│   ├── sigil-community.html    # Community tools GUI
│   ├── status.html          # Real-time status dashboard
│   ├── packages.html        # Feature package toggle panel
│   ├── developers.html      # Developer API reference
│   ├── setup.html           # First-time setup wizard
│   └── 404.html
├── data/
│   └── sigil.db             # SQLite database (auto-created, WAL mode, git-ignored)
├── docs/
│   ├── DEPLOY.md            # Full Railway + Discord OAuth setup walkthrough
│   ├── CULINARYOS_BRIDGE.md # CulinaryOS integration contract
│   ├── SHADOWREALM_NETWORK.md # ShadowRealm Network node contract
│   ├── SCHEDULER_INTEGRATION.md # Scheduler integration details
│   └── ARCHITECTURE.md      # SQLite ceiling, two-process model, IPC (see below)
├── tests/
│   ├── unit/
│   │   ├── packages.test.js # isEnabled / enablePackage / disablePackage
│   │   ├── db.test.js       # Schema creates correctly, migrations idempotent
│   │   └── ssrfGuard.test.js
│   ├── integration/
│   │   ├── commands.test.js # All command files load without throwing
│   │   └── gui-api.test.js  # /health, /api/status respond correctly
│   └── setup.js             # In-memory SQLite, no Railway/Discord required
├── Dockerfile
├── railway.toml
├── .env.example
├── ecosystem.config.js
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

**Stack at a glance:**

| Layer | Technology |
|---|---|
| Bot runtime | Discord.js v14, Node.js 20+ |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Web server | Express 4 + native WebSocket (ws) |
| Canvas rendering | node-canvas 2 |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Hosting | Railway (Docker) / PM2 / Docker |
| IPC | SQLite cross-process bridge (bot → GUI server) |

The bot and GUI server run as **separate processes**. They share one SQLite database file. The bot writes heartbeat, service registry, and log rows every 30–60 seconds. The GUI server reads them via a lightweight read-only connection — no in-memory globals, no sockets, no restarts required when either process recycles.

---

## Scale & Architecture Limits

Sigil uses SQLite (WAL mode) as its database. This is an intentional choice for the current scale — honest, simple, and zero-dependency.

**Works well for:**
- Single-server deployments (Railway, VPS, Docker)
- Up to ~100 active guilds with normal usage patterns
- XP writes from typical community activity levels

**Does NOT support:**
- Multiple concurrent Railway replicas — SQLite is a single-file database; horizontal scaling breaks the IPC bridge and causes write contention
- High-frequency XP write loads at >500 concurrent active members sustained

**Migration path if you hit the ceiling:**  
Replace the DB layer with PostgreSQL. [Supabase](https://supabase.com) is the recommended target — `better-sqlite3` calls map cleanly to `pg` with minimal changes to `src/db.js`. The rest of the codebase stays the same.

> If you are deploying Sigil for a large server (5,000+ active members), open an issue — we can advise on the migration path.

---

## Packages System

Features are grouped into **packages** that can be toggled per guild from the `/packages` dashboard page or via `POST /api/packages`.

### How it works

Every gated command entry point checks `isEnabled(guildId, packageName)` before delegating to its impl:

```js
// Example: src/commands/bible.js
if (!isEnabled(interaction.guild.id, 'faith')) {
    return interaction.reply({
        content: '📦 The **Faith** package is not enabled...',
        ephemeral: true,
    });
}
return impl.execute(interaction);
```

Disabling a package does **not** remove commands from Discord's command list — users see the commands in autocomplete but get a friendly "package not enabled" message if they try to use one. No re-registration needed.

### Package reference

| Package key | Commands | Status | Default |
|---|---|---|---|
| `branding` | `/brand` `/icon` `/banner` `/logo` `/avatar` `/compare` `/template` | ✅ Production | Enabled |
| `nitrofree` | `/sticker` `/emote` `/reactionpack` `/rolebadge` `/resize` `/splash` `/namecard` `/servercard` `/profilecard` `/texteffect` `/themepreview` | ✅ Production | Enabled |
| `community` | `/welcomecard` `/rankcard` `/announcebanner` `/eventbanner` `/eventrecap` `/certificate` `/invitecard` | ✅ Production | Enabled |
| `faith` | `/bible` `/devotional` `/sermon` `/prayer` | 🔨 Beta | Enabled |
| `polls` | `/poll` `/giveaway` | ✅ Production | Enabled |
| `analytics` | `/serverstats` | 🔨 Beta | Enabled |
| `xp` | `/xprank` `/xpleaderboard` `/weeklyleaderboard` `/loyalty` `/levelroles` `/xpadmin` | ✅ Production | Enabled |
| `tickets` | `/ticket` | ✅ Production | Enabled |
| `aitools` | `/mood` `/palette` `/saveme` `/history` | 🔨 Beta | Enabled |

---

## Security

- All `/api/*` and `/preview/*` routes require a valid `GUI_AUTH_TOKEN` (Bearer header or `?token=` query param) enforced by `guiAuthMiddleware`
- `/api/setup/validate-token` and `/api/status/full` are intentionally exempt (pre-auth setup flow and public health reads)
- `/api/control/restart` and `/api/control/deploy-commands` require a separate `CONTROL_SECRET` header in addition to GUI auth. No arbitrary shell execution is exposed over HTTP.
- Webhook HMAC verification on `/webhook/trigger` via `x-sigil-signature`
- SSRF guard on all user-supplied URLs via `src/utils/ssrfGuard.js`
- Rate limiting on every endpoint group (auth: 10/min, render: 20/min, control: 5/min)
- `.env` is git-ignored — **never commit real secrets**; use `.env.example` as the template

---

## REST & WebSocket API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/status/full` | GET | None | Aggregated health — bot, GUI, services, last error |
| `/api/logs` | GET | ✅ | Merged bot + GUI log tail (`?tail=50&level=error`) |
| `/api/packages` | GET / POST | ✅ | Read or toggle feature packages per guild |
| `/api/media/*` | GET / POST | ✅ | ASCILINE media queue proxy |
| `/api/control/restart` | POST | ✅ + control secret | Graceful process restart |
| `/api/control/deploy-commands` | POST | ✅ + control secret | Re-register slash commands with Discord |
| `/webhook/trigger` | POST | HMAC | External event trigger (Twitch, YouTube, GitHub) |
| `/health` | GET | None | Simple uptime + version check |
| `/ws/logs` | WebSocket | token param | Live log stream (`?token=&level=error`) |

All endpoints are rate-limited. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full API reference and rate limit table.

---

## Developer Guide

### Adding a Command

1. Create `src/commands/yourcommand.js` — thin entry point with package gate + `impl.execute()`.
2. Create `src/commands/_yourcommand_impl.js` — all heavy logic lives here.
3. Export `{ data, execute }` where `data` is a `SlashCommandBuilder`.
4. Run `npm run deploy-commands` to register it with Discord.
5. To add a cooldown, export `cooldown: N` (seconds) from the entry point. Default is `0` (no throttle).

```js
// src/commands/mycommand.js
'use strict';
const { SlashCommandBuilder } = require('discord.js');
const impl = require('./_mycommand_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    cooldown: 5, // optional — omit for no throttle
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('Does something cool.'),
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'mypackage')) {
            return interaction.reply({ content: '📦 Package not enabled.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
```

### Adding a Background Service

1. Create your service file and call `registry.register('your-service', { interval, description })`.
2. Call `registry.heartbeat('your-service')` after each successful tick.
3. Call `registry.setError('your-service', err)` on failure.
4. Import and start it from `src/index.js` inside the `clientReady` handler.

The service will automatically appear on the `/status` dashboard within 60 seconds.

---

## Contributing

PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on new commands, GUI panels, and integration connectors.

Key areas for contribution:
- Unit and integration tests (`tests/` — `node:test`, see test scaffolding)
- Additional webhook integrations (Patreon, Ko-fi, GitHub Actions)
- Dashboard component system (shared nav/auth header — before the GUI grows further)
- CulinaryOS bridge completion

---

## License

MIT — see [LICENSE](LICENSE). Fork it, own it, ship it.

---

<div align="center">

🌐 [sigil.up.railway.app](https://sigil.up.railway.app) &nbsp;·&nbsp; 💬 [Discord](https://discord.gg/7c89HKrVe) &nbsp;·&nbsp; ⭐ Star the repo if it saves you time

</div>
