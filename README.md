# Sigil — The Discord God Mode Bot

[![Version](https://img.shields.io/badge/version-v2.0.0-crimson?style=flat-square)](https://github.com/ShadowWalkerNC/Sigil/releases)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Railway](https://img.shields.io/badge/deployed-Railway-blueviolet?style=flat-square)](https://railway.app)

**Sigil** is the free, open-source layer that gives every Discord server what Nitro charges for — and what Discord itself will never build. Custom branding, community tools, creator kits, server automation, analytics, and more. All from slash commands. No subscription. No paywall. Power back to the server.

> **"Like Windows God Mode, but for Discord."**

---

> **Current version: v2.0.0** — 32 commands across 4 categories
> **Roadmap target: v3.0** — 70+ commands across 8 verticals

---

## Why Sigil Exists

Discord has two problems:

1. **It locks visual quality behind Nitro** — small servers look amateur, large servers look polished. Sigil removes that wall entirely.
2. **It only does messaging** — no analytics, no automation, no lifecycle tools, no cross-platform brand consistency. Sigil builds that layer on top.

Every image Sigil generates carries a subtle `made with Sigil` watermark. Every server that uses it spreads it. That's the distribution model.

---

## Current Commands (v2.0.0)

### 🎨 Branding & Icons
| Command | Description |
|---|---|
| `/icon` | Server icon — shape, background, border, colors, font, glow |
| `/banner` | Wide server banner with subtitle and alignment |
| `/logo` | Logo-style icon with optional transparent background |
| `/avatar` | Server avatar with optional overlay image |
| `/brand kit` | Full brand kit (icon + banner + palette) built manually |
| `/brand ai` | AI-designed brand kit from a plain-text description |
| `/compare` | Side-by-side comparison of two icon designs |

### 🚀 Nitro-Free Features
| Command | Description |
|---|---|
| `/sticker` | Discord sticker (320×320 PNG) — upload free to any server |
| `/emote` | Custom emoji (128×128 PNG) — upload free to any server |
| `/rolebadge` | Styled role badge (pill, rounded, hex, diamond) |
| `/resize` | Resize any image to Discord-optimal dimensions (8 presets) |
| `/namecard` | Shareable identity card — username, tagline, roles, avatar |
| `/splash` | Invite splash or discovery banner (up to 1920×1080) |
| `/servercard` | Shareable server preview card — icon, description, member count |
| `/texteffect` | Stylised text PNG — neon, chrome, fire, glitch, ice, gold, shadow, outline |
| `/reactionpack` | 5 themed reaction emojis + ZIP download |
| `/profilecard` | Nitro-style profile card — banner, avatar, bio, badge |
| `/themepreview` | Full Discord UI mockup with your color scheme applied |

### 🏆 Community Tools
| Command | Description |
|---|---|
| `/welcomecard` | Custom welcome image — replaces MEE6 Pro welcome cards |
| `/rankcard` | XP rank card — replaces MEE6 Pro / Tatsu premium rank cards |
| `/announcebanner` | Professional announcement graphic (6 types) |
| `/eventbanner` | Event banner — title, date, description, host |
| `/certificate` | Achievement or award certificate (8 types) |
| `/invitecard` | Branded invite card with QR code — shareable anywhere |

### 🧠 AI & Utilities
| Command | Description |
|---|---|
| `/mood` | AI color palette from a mood description |
| `/template` | Load a built-in brand template and render its full kit |
| `/saveme` | Save most recent design as a named kit |
| `/history` | View recent command history |
| `/gui open` | Link to the visual GUI builder |
| `/gui status` | Check if the GUI server is online |
| `/status` | Bot uptime and version |
| `/help` | Full command reference |

---

## Anti-Paywall Reference

| What Discord / Other Bots Charge For | Monthly Cost | Sigil's Free Alternative |
|---|---|---|
| MEE6 Pro welcome images | $5.99/mo | `/welcomecard` |
| MEE6 Pro / Tatsu rank cards | $4–$10/mo | `/rankcard` |
| Discord Nitro — custom stickers | $9.99/mo | `/sticker` |
| Discord Nitro — profile banner | $9.99/mo | `/profilecard` |
| Nitro Boost — server invite splash | $4.99/mo | `/splash` |
| Nitro Boost — extra emoji slots | $4.99/mo | `/emote` + `/reactionpack` |

---

## Built-in Brand Templates

`/template name:<template>` — generates a full kit instantly.

| Template | Genre | Shape | Primary |
|---|---|---|---|
| Demonfall | Dark Fantasy | Circle | `#8B0000` |
| Cyber Nexus | Cyberpunk | Square | `#00FFFF` |
| Arcane Order | Fantasy RPG | Hexagon | `#9966CC` |
| Cozy Den | Community | Rounded | `#FF6B35` |
| Neon Drift | Racing / Sports | Diamond | `#FF4500` |
| Polar Ops | Tactical FPS | Square | `#7DF9FF` |
| Emerald Fang | Survival / RPG | Hexagon | `#39FF14` |
| Void Protocol | Sci-Fi | Circle | `#C0C0C0` |

---

## GUI Visual Brand Builder

Browser-based 4-step wizard — no slash commands required.

**Steps:** Identity → Colors → Style → Generate

**Features:** 8 templates, 5 shapes, 32 backgrounds, 8 borders, 7 output presets, shareable links, randomizer, light/dark theme, export config JSON.

> ⚠️ **AI Generate** is temporarily disabled — coming in a future update.

For full API reference see [`docs/API.md`](docs/API.md).

---

## Setup

### Prerequisites
- Node.js 20+
- Discord bot token — [Discord Developer Portal](https://discord.com/developers/applications)
- Google Gemini API key — [Google AI Studio](https://aistudio.google.com/app/apikey) *(optional — AI commands only)*

### Installation

```bash
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil
npm install
cp .env.example .env
# Fill in DISCORD_TOKEN, CLIENT_ID, and optionally GEMINI_API_KEY
node src/deploy-commands.js   # Register slash commands
node src/index.js              # Start the bot
```

### GUI Server (optional)

```bash
node gui/gui-server.js
# Open http://localhost:8080
```

---

## Deployment (Railway)

1. Push to GitHub
2. New Railway project from repo
3. Add env vars: `DISCORD_TOKEN`, `CLIENT_ID`, `GEMINI_API_KEY` (optional), `GUI_URL` (optional)
4. Start command: `node src/index.js`

For the GUI server, create a second Railway service with start command `node gui/gui-server.js`.

---

## Project Structure

```
Sigil/
├── gui/
│   ├── gui-server.js             # Express server: render API + static routes
│   ├── index.html                # GUI landing page
│   ├── sigil-gui-builder.html    # Brand Builder (4-step wizard)
│   ├── sigil-community.html      # Community Tools page
│   ├── developers.html           # Developers / API reference page
│   └── 404.html                  # Branded 404 error page
├── src/
│   ├── commands/                 # 32 slash command handlers
│   ├── events/                   # Discord.js event handlers
│   ├── automation/               # v2.0 automation engine (in progress)
│   ├── fonts/                    # Bundled font files
│   ├── utils/
│   │   ├── backgrounds.js
│   │   ├── borders.js
│   │   ├── canvas.js
│   │   ├── fonts.js
│   │   ├── gemini.js
│   │   ├── history.js
│   │   └── colors.js
│   ├── deploy-commands.js
│   └── index.js
├── docs/
│   ├── ROADMAP.md
│   ├── CONTEXT.md
│   ├── API.md
│   └── FONTS.md
├── .env.example
├── railpack.json
├── railway.toml
└── package.json
```

---

## Credits

Built on the original concept from [**NoVa-Gh0ul/Discord-Icon-Gen**](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen). Sigil has evolved into a full branding, community, and automation platform.

---

## License

MIT
