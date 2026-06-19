# Sigil — Session Context

> This file exists so that any AI assistant (or developer) can read it and instantly understand the full state of the project, what has been built, what is planned, and how to continue without needing re-explanation.
>
> **Last updated: 2026-06-18 | Current version: v2.0.0**

---

## Project Overview

**Sigil** is a Discord server branding bot and browser-based GUI brand builder.
- **Owner:** ShadowWalkerNC (GitHub: https://github.com/ShadowWalkerNC)
- **Repo:** https://github.com/ShadowWalkerNC/Sigil
- **Current version:** v2.0.0 (in progress — unreleased)
- **Stack:** Node.js 20+, Discord.js v14, node-canvas, Google Gemini API (disabled), Express, better-sqlite3
- **Deployment:** Railway (railpack.json + railway.toml configured)
- **Primary community:** Demonfall — dark fantasy fighting guild

## Origin

Sigil was inspired by [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen). Sigil has since evolved into a full branding, community, and automation platform.

---

## Repository Structure (current)

```
Sigil/
├── gui/
│   ├── gui-server.js             # Express server: render API, rate limiting, static routes
│   ├── index.html                # GUI landing / home page
│   ├── sigil-gui-builder.html    # Brand Builder (4-step wizard)
│   ├── sigil-community.html      # Community Tools (welcome, rank, serverstats)
│   ├── developers.html           # Developers / API reference
│   └── 404.html                  # Branded 404 page (catch-all)
├── src/
│   ├── index.js                  # Bot entry point, command/event loader, cooldowns
│   ├── deploy-commands.js        # Registers slash commands with Discord
│   ├── automation/               # v2.0 automation engine (placeholder dir)
│   ├── commands/                 # 32 slash command files
│   ├── events/                   # Discord.js event handlers
│   ├── fonts/                    # Bundled font files
│   └── utils/
│       ├── canvas.js             # renderKit, renderIcon, renderBanner, renderPalette
│       ├── gemini.js             # Gemini API wrapper (disabled)
│       ├── backgrounds.js        # 32 background presets
│       ├── borders.js            # 8 border styles
│       ├── fonts.js              # Font registration
│       ├── history.js            # Per-user command history (file-based)
│       └── colors.js
├── docs/
│   ├── CONTEXT.md                # This file
│   ├── ROADMAP.md                # Feature roadmap v1.0 → v3.0
│   ├── API.md                    # GUI server endpoint reference
│   └── FONTS.md
├── data/                         # Runtime data (gitignored)
├── setup.html                    # Setup wizard (served at /setup)
├── .env.example
├── railpack.json
├── railway.toml
└── package.json
```

---

## Bot Commands (v2.0.0) — 32 commands

### Branding & Icons
`/icon`, `/banner`, `/logo`, `/avatar`, `/brand kit`, `/brand ai`, `/brand share`, `/compare`

### Nitro-Free Features
`/sticker`, `/emote`, `/rolebadge`, `/resize`, `/namecard`, `/splash`, `/servercard`, `/texteffect`, `/reactionpack`, `/profilecard`, `/themepreview`

### Community Tools
`/welcomecard`, `/rankcard`, `/announcebanner`, `/eventbanner`, `/certificate`, `/invitecard`, `/serverstats`

### AI & Utilities
`/mood`, `/template`, `/palette`, `/saveme`, `/history`, `/gui open`, `/gui status`, `/sigilconfig`, `/status`, `/help`

---

## GUI Pages & Routes

| Route | File | Status |
|---|---|---|
| `/` | `index.html` | ✅ Live |
| `/brand` | `sigil-gui-builder.html` | ✅ Live |
| `/community` | `sigil-community.html` | ✅ Live |
| `/developers` | `developers.html` | ✅ Live |
| `/setup` | `setup.html` (root) | ✅ Live |
| `/health` | JSON response | ✅ Live |
| `/404` catch-all | `404.html` | ✅ Live |

---

## GUI Server API Endpoints

| Method | Endpoint | Rate Limited | Description |
|---|---|---|---|
| POST | `/preview` | ✅ 20/min | Full brand kit render |
| POST | `/preview/welcome` | ✅ 20/min | Welcome card render |
| POST | `/preview/rankcard` | ✅ 20/min | Rank card render |
| POST | `/preview/serverstats` | ✅ 20/min | Server stats card render |
| POST | `/generate` | — | AI generate (disabled, returns 503) |
| GET | `/health` | — | Server health check |

See `docs/API.md` for full request/response schemas.

---

## Key Design Decisions

- **Single HTML file per page** — no build step, no npm for the GUI frontend
- **URL hash = source of truth for sharing** — all brand builder state serialized to URL hash
- **Canvas rendering server-side** — Express GUI server handles PNG generation via node-canvas
- **AI disabled** — Gemini `/generate` returns 503; re-enable by setting `AI_ENABLED = true` in `gui-server.js`
- **Rate limiting** — `express-rate-limit` applied to all `/preview/*` routes (20 req/min/IP)
- **Input sanitization** — `safeText()` strips control characters from all user-supplied canvas text
- **SQLite ready** — `better-sqlite3` in deps, `src/automation/` dir created, not yet wired

---

## Next Steps (v2.0.0)

1. **Phase 3** — GUI UX polish: shared CSS/JS, mobile nav, loading spinners, toast notifications
2. **Phase 4** — DevOps: ESLint config, GitHub Actions CI workflow
3. **Phase 5** — v2.0 Automation: `guildMemberAdd` auto-welcome, SQLite guild config, `/sigilconfig` persistence

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Discord bot token |
| `CLIENT_ID` | ✅ | Discord application client ID |
| `GUILD_ID` | Optional | Guild-scoped command deployment |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (AI commands — currently disabled) |
| `GUI_URL` | Optional | Public URL of the GUI server |
| `PORT` | Optional | GUI server port (default 8080) |
