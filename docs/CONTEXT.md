# Sigil — Session Context

> This file exists so that any AI assistant (or developer) can read it and instantly understand the full state of the project, what has been built, what is planned, and how to continue without needing re-explanation.
>
> **Last updated: 2026-06-18**

---

## Project Overview

**Sigil** is a Discord server branding bot and browser-based GUI brand builder.
- **Owner:** ShadowWalkerNC (GitHub: https://github.com/ShadowWalkerNC)
- **Repo:** https://github.com/ShadowWalkerNC/Sigil
- **Current version:** 1.4.0
- **Stack:** Node.js 18+, Discord.js v14, node-canvas, Google Gemini API, Express
- **Deployment:** Railway (railpack.json + railway.toml configured)
- **Primary server/community:** Demonfall — dark fantasy fighting guild

## Origin

Sigil was inspired by [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen), a simple Discord bot for generating customized icons. Sigil has since evolved into a full brand kit platform.

---

## Repository Structure

```
Sigil/
├── src/
│   ├── index.js               # Bot entry point, auto-loads commands + events
│   ├── deploy-commands.js     # Registers slash commands with Discord
│   ├── commands/              # All slash commands (one file per command)
│   │   ├── icon.js
│   │   ├── banner.js
│   │   ├── logo.js
│   │   ├── avatar.js
│   │   ├── brand.js           # Subcommands: kit, ai
│   │   ├── mood.js
│   │   ├── compare.js
│   │   ├── random.js
│   │   ├── preview.js
│   │   ├── saveme.js
│   │   ├── history.js
│   │   ├── gui.js             # Subcommands: open, status
│   │   └── help.js
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   └── utils/
│       ├── canvas.js          # renderIcon, renderBanner, renderPalette, renderKit
│       ├── gemini.js          # geminiRequest, geminiImageRequest, extractJson
│       ├── backgrounds.js     # 12 background presets
│       ├── borders.js         # 6 border styles
│       ├── fonts.js           # Font registration
│       └── history.js         # Per-user command history (file-based)
├── gui/
│   ├── gui-server.js          # Express server: /preview, /generate, /health endpoints
│   └── sigil-gui-builder.html # Full SPA GUI wizard
├── docs/
│   ├── CONTEXT.md             # This file
│   ├── ROADMAP.md             # Future feature plan
│   ├── FONTS.md               # Font documentation
│   └── index.html             # GitHub Pages landing page
├── data/                      # Runtime data (saved kits, history)
├── fonts/                     # Bundled font files
├── .env.example               # Environment variable template
├── package.json
├── railpack.json              # Railway build config (canvas native deps)
├── railway.toml               # Railway start command
├── start.js                   # Alternative entry point
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

---

## Current GUI State (v1.4.0)

The GUI (`gui/sigil-gui-builder.html`) is a 4-step wizard SPA:

### Step 1 — Identity
- 8 brand templates displayed as a card grid at the top
- Templates: Demonfall, Cyber Nexus, Arcane Order, Cozy Den, Neon Drift, Polar Ops, Emerald Fang, Void Protocol
- Clicking a template loads ALL state: name, tagline, description, icon text, colors, background, border, font, glow, opacity, gradient, image prompt
- Fields: Brand name, Tagline, Description, Icon text, Banner text

### Step 2 — Colors
- Primary + Secondary color pickers (color wheel + hex input, synced)
- Color library: 7 groups (Reds, Purples, Blues, Greens, Oranges, Cyans, Neutrals), 28 swatches
- Tap = primary, Shift+tap or long-press (mobile) = secondary

### Step 3 — Style
- 12 background chips (gradient previews)
- 6 border style chips
- Glow intensity range slider (0–25)
- Font selector (8 fonts)
- Overlay opacity range slider (0–100%)
- 7 output size presets: Discord Icon 512×512, Discord Banner 960×540, Twitch Panel 320×160, Twitch Banner 1200×480, YouTube Art 2560×1440, Reddit Banner 1920×384, Square 1024×1024

### Step 4 — Generate
- Manual build info (Preview button, no API key needed)
- AI Generate info (requires Gemini API key)
- Gemini API key input
- Image prompt textarea
- Advanced: model selector, temperature slider, gradient toggle

### Main Panel Tabs
- **Preview** — live icon card, banner card, palette card, embed card
- **Output & Palette** — color palette table + Config JSON with copy button
- **AI Image** — shows AI-generated image after Generate

### Navbar
- Theme toggle (dark/light)
- Randomize button
- Share button (copies URL hash link)
- Export button (dialog with full JSON)
- Preview button
- Generate button (primary)
- Server health pill (online/offline, polls every 8s)

### State / URL Hash
- All brand state serialized to URL hash on every change
- Shareable links restore full state including active template
- Keys: brandName, tagline, description, iconText, bannerText, primaryHex, secondaryHex, background, border, glow, font, opacity, gradient, sizePreset, activeTemplate

---

## Bot Commands (v1.4.0)

| Command | Status |
|---|---|
| `/icon` | ✅ Stable |
| `/banner` | ✅ Stable |
| `/logo` | ✅ Stable |
| `/avatar` | ✅ Stable |
| `/brand kit` | ✅ Stable |
| `/brand ai` | ✅ Stable |
| `/mood` | ✅ Stable |
| `/compare` | ✅ Stable |
| `/random` | ✅ Stable |
| `/preview` | ✅ Stable |
| `/saveme` | ✅ Stable |
| `/history` | ✅ Stable |
| `/gui open` | ✅ Stable |
| `/gui status` | ✅ Stable |
| `/help` | ⚠️ Needs refresh for v1.4.0 features |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Discord bot token |
| `CLIENT_ID` | ✅ | Discord application client ID |
| `GUILD_ID` | Optional | For guild-scoped command deployment |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (AI commands) |
| `GUI_URL` | Optional | Public URL of the GUI server |
| `GUI_PORT` | Optional | Port for GUI server (default 3420) |

---

## Key Design Decisions

- **Single HTML file GUI** — entire builder is one self-contained HTML file, no build step, no npm
- **Templates are starting points** — loading a template does not lock any fields; everything is editable
- **Active template deselects on any manual change** — colors, borders, backgrounds all clear the active template highlight
- **URL hash = source of truth for sharing** — no backend session needed, all state lives in the URL
- **Canvas rendering happens server-side** — the Express GUI server handles PNG generation via node-canvas
- **Gemini API key stays client-side** — the key is sent per-request, never stored server-side

---

## Session Notes (2026-06-18)

- Discussed connecting Discord to Minecraft via DiscordSRV
- Identified NoVa-Gh0ul as original Discord-Icon-Gen author; added Credits to README
- Confirmed Sigil is NOT a GitHub fork (fork relationship was not established)
- NoVa-Gh0ul also has an MCBE addon repo (Item-Disabler) and links to discord.gg/aras
