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

Sigil is a production-ready Discord bot platform that pairs a full-featured bot with a live web dashboard. It ships with 71+ slash commands, a visual brand builder, and a developer-friendly architecture — all self-hosted, all open source.

The live URL is both a **marketing site** and a **working demo**. Anyone can browse the GUI, preview features, and use the brand builder live. When you fork the project, that same URL becomes yours — preconfigured, styled, and ready to deploy.

Sigil is a node in the [ShadowRealm Network](SHADOWREALM_NETWORK.md) — a personal microservices ecosystem. It follows the shared `/v1/health`, `/v1/manifest`, and auth envelope contracts across all connected apps.

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
| **Developer Docs** | `/developers` | API reference, webhook config, integration guide |
| **Health Check** | `/health` | JSON endpoint — uptime, version, service status |

> ⚠️ The `/setup` wizard has been deprecated. Use `/sigilconfig` in Discord instead — it covers all setup from inside your server with no web UI required.

---

## Feature Packages

All commands are grouped into **packages** that can be toggled per guild via `/sigilconfig packages` in Discord or via `POST /api/packages`. Disabling a package silently blocks its commands with a friendly ephemeral message — no re-registration with Discord required.

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
- `/sermon` supports Discord Stage channels — bot joins as a speaker
- Requires `BIBLE_API_KEY`. Package is gracefully disabled if the key is absent.

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

> AI calls are made directly to Anthropic (`ANTHROPIC_API_KEY`). Planned: route through ShadowRealm Network's `/v1/generate` endpoint so the AI key lives centrally.

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

> **Music commands** (`/nowplaying`, `/play`, `/queue`) — ⚠️ Stub. No audio library is wired in the current `package.json`. These commands exist but call an external service stub. Do not rely on them for production music until a library (e.g. `discord-player`, Lavalink) is integrated.

### 🍳 CulinaryOS Bridge *(in development — hidden until live)*

A first-party Discord integration for **CulinaryOS**. Commands are registered but gated — they do **not** appear in Discord autocomplete until `CULINARYOS_API_URL` and `CULINARYOS_API_KEY` are both set.

`/menu` `/recipe` `/inventory`

> See [CULINARYOS_BRIDGE.md](CULINARYOS_BRIDGE.md) for architecture details.

---

## Getting Started

### Option 1 — Discord-native setup (Recommended)

Fork the repo, deploy to Railway, then use `/sigilconfig` in Discord:

```
/sigilconfig status          — see current automation status
/sigilconfig welcome         — configure welcome cards + channel
/sigilconfig xp              — enable XP leveling
/sigilconfig packages        — enable/disable feature bundles
/sigilconfig webhook         — set up external webhook triggers
```

No web UI required for setup.

### Option 2 — Manual

```bash
git clone https://github.com/ShadowWalkerNC/Sigil
cd Sigil
npm install
cp .env.example .env    # fill in your values
npm run deploy-commands # register slash commands with Discord
npm start               # bot process
npm run gui             # web dashboard (separate process or combined via PM2)
```

> ⚠️ **After any push that adds or changes command options**, you must re-register with Discord:
> ```bash
> node scripts/deploy-commands-standalone.js
> # or via the API:
> POST /api/control/deploy-commands  (requires CONTROL_SECRET header)
> ```
> Discord caches command definitions — stale definitions cause silent timeouts and missing options.

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

See [DEPLOY.md](DEPLOY.md) for the full Railway + Discord OAuth setup walkthrough.

### PM2 (self-hosted VPS)

```bash
npm install
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 startup
```

### Docker

```bash
docker build -t sigil .
docker run -d --env-file .env -p 8080:8080 sigil
```

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
│   │   └── *.js             # Thin entry points: package gate → impl.data + impl.execute()
│   ├── events/              # Discord.js event handlers
│   │   └── interactionCreate.js  # Global error handler — all interactions routed here
│   ├── services/            # Background pollers and scheduled runners
│   │   ├── pollers.js       # Twitch (15s) + YouTube (60s) live pollers
│   │   ├── scheduler.js     # Scheduled posts, polls, giveaways, bump reminders
│   │   └── statsRunner.js   # Weekly stats poster (Mon 09:00 UTC)
│   ├── automation/          # Webhook handler (Twitch, YouTube, GitHub triggers)
│   └── utils/
│       ├── packages.js      # isEnabled / enablePackage / disablePackage helpers
│       ├── ssrfGuard.js     # SSRF protection for user-supplied URLs
│       └── webhookQueue.js  # Debounced webhook event dispatcher
├── gui/
│   ├── gui-server.js        # Express server — API + WebSocket + static pages
│   ├── index.html           # Home / marketing landing page
│   ├── sigil-gui-builder.html  # Brand builder live canvas GUI
│   ├── status.html          # Real-time status dashboard
│   ├── packages.html        # Feature package toggle panel
│   └── developers.html      # Developer API reference
├── data/
│   └── sigil.db             # SQLite database (WAL mode, git-ignored, mount Railway volume)
├── scripts/
│   └── deploy-commands-standalone.js  # Re-register slash commands with Discord
├── docs/
│   ├── DEPLOY.md
│   ├── CULINARYOS_BRIDGE.md
│   ├── SHADOWREALM_NETWORK.md
│   └── SCHEDULER_INTEGRATION.md
├── TASKS.md                 # Daily work tracker — start here each session
├── Dockerfile
├── railway.toml
└── .env.example
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

---

## Scale & Architecture Limits

Sigil uses SQLite (WAL mode) as its database. This is an intentional choice for the current scale.

**Works well for:**
- Single-server deployments (Railway, VPS, Docker)
- Up to ~100 active guilds with normal usage patterns

**Does NOT support:**
- Multiple concurrent Railway replicas
- High-frequency XP write loads at >500 concurrent active members sustained

**Migration path:** Replace the DB layer with PostgreSQL. [Supabase](https://supabase.com) is the recommended target.

---

## Developer Guide

### Adding a Command

**Critical convention:** The wrapper file MUST export `data: impl.data`. Never re-declare a new `SlashCommandBuilder` in the wrapper — it will strip all options from the command definition, causing silent timeouts.

```js
// src/commands/mycommand.js — CORRECT pattern
'use strict';
const impl = require('./_mycommand_impl.js');
const { isEnabled } = require('../utils/packages.js');

module.exports = {
    cooldown: 5, // optional
    data: impl.data, // ← ALWAYS use impl.data, never re-declare
    async execute(interaction) {
        if (!isEnabled(interaction.guild.id, 'mypackage')) {
            return interaction.reply({ content: '📦 Package not enabled.', ephemeral: true });
        }
        return impl.execute(interaction);
    },
};
```

```js
// src/commands/_mycommand_impl.js
'use strict';
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('Does something cool.')
    .addStringOption(opt => opt.setName('input').setDescription('Your input').setRequired(true));

async function execute(interaction) {
    await interaction.deferReply(); // ← required for any async work >1s
    const input = interaction.options.getString('input');
    return interaction.editReply({ content: `You said: ${input}` });
}

module.exports = { data, execute };
```

> After adding or changing a command, run `npm run deploy-commands` to register it with Discord.

### Button & Modal Handlers

Register handlers on `client.buttonHandlers` and `client.modalHandlers` (both are `Map` instances) using a prefix string that matches the start of your `customId`:

```js
// In your command's _impl.js or a dedicated handler file:
client.buttonHandlers.set('ticket', async (interaction) => {
    const [, action, ticketId] = interaction.customId.split(':');
    // handle ticket:claim:123, ticket:close:123, etc.
});
```

### Adding a Background Service

1. Create your service file and call `registry.register('your-service', { interval, description })`.
2. Call `registry.heartbeat('your-service')` after each successful tick.
3. Call `registry.setError('your-service', err)` on failure.
4. Import and start it from `src/index.js` inside the `clientReady` handler.

---

## Packages System

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

- All `/api/*` routes require a valid `GUI_AUTH_TOKEN` (Bearer header or `?token=` query param)
- `/api/control/restart` and `/api/control/deploy-commands` require a separate `CONTROL_SECRET` header
- Webhook HMAC verification on `/webhook/trigger` via `x-sigil-signature`
- SSRF guard on all user-supplied URLs via `src/utils/ssrfGuard.js`
- Rate limiting on every endpoint group
- `.env` is git-ignored — never commit real secrets

---

## REST & WebSocket API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/status/full` | GET | None | Aggregated health — bot, GUI, services, last error |
| `/api/logs` | GET | ✅ | Merged bot + GUI log tail (`?tail=50&level=error`) |
| `/api/packages` | GET / POST | ✅ | Read or toggle feature packages per guild |
| `/api/control/restart` | POST | ✅ + control secret | Graceful process restart |
| `/api/control/deploy-commands` | POST | ✅ + control secret | Re-register slash commands with Discord |
| `/webhook/trigger` | POST | HMAC | External event trigger (Twitch, YouTube, GitHub) |
| `/health` | GET | None | Simple uptime + version check |
| `/ws/logs` | WebSocket | token param | Live log stream (`?token=&level=error`) |

---

## Contributing

PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Key areas for contribution:
- Unit and integration tests (`tests/` — `node:test`)
- Additional webhook integrations (Patreon, Ko-fi, GitHub Actions)
- Dashboard component system
- CulinaryOS bridge completion

---

## License

MIT — see [LICENSE](LICENSE). Fork it, own it, ship it.

---

<div align="center">

🌐 [sigil.up.railway.app](https://sigil.up.railway.app) &nbsp;·&nbsp; 💬 [Discord](https://discord.gg/7c89HKrVe) &nbsp;·&nbsp; ⭐ Star the repo if it saves you time

</div>
