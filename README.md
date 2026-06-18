# Sigil — Discord Branding & Community Tools Bot

**Sigil** gives every Discord server premium-quality branding and community tools — completely free. Generate server icons, banners, welcome cards, rank cards, event banners, certificates, invite cards, stickers, custom emoji, profile cards, and more — all from slash commands. No Nitro required. No paywall. Power back to the server.

Also includes a browser-based **Visual Brand Builder** GUI with live preview, 8 brand templates, shape selector, and optional AI generation.

> **Current version: v1.9.0** — 32 commands

---

## Commands

### 🎨 Branding & Icons
| Command | Description |
|---|---|
| `/icon` | Generate a server icon with shape, background, border, colors, font, glow |
| `/banner` | Generate a wide server banner with subtitle and alignment |
| `/logo` | Generate a logo-style icon with optional transparent background |
| `/avatar` | Generate a server avatar with optional overlay image |
| `/brand kit` | Build a full brand kit (icon + banner + palette) manually |
| `/brand ai` | AI-designed brand kit from a plain-text description |
| `/compare` | Side-by-side comparison of two icon designs |

### 🚀 Nitro-Free Features
| Command | Description |
|---|---|
| `/sticker` | Generate a Discord-format sticker (320×320 PNG) — upload free to any server |
| `/emote` | Generate a custom emoji (128×128 PNG) — upload free to any server |
| `/rolebadge` | Generate a styled role badge graphic (pill, rounded, hex, diamond) |
| `/resize` | Resize any image URL to Discord-optimal dimensions (8 presets) |
| `/namecard` | Shareable identity card with username, tagline, roles, and avatar |
| `/splash` | Full-size invite splash or discovery banner (up to 1920×1080) |
| `/servercard` | Shareable server preview card with icon, description, and member count |
| `/texteffect` | Stylised text PNG — neon, chrome, fire, glitch, ice, gold, shadow, outline |
| `/reactionpack` | Generate 5 themed reaction emojis + ZIP download |
| `/profilecard` | Nitro-style profile card mockup with banner, avatar, bio, and badge |
| `/themepreview` | Full Discord UI mockup showing your color scheme applied to a server |

### 🏆 Community Tools
| Command | Description |
|---|---|
| `/welcomecard` | Custom welcome image for new members — replaces MEE6 Pro welcome cards |
| `/rankcard` | XP / level rank card — replaces MEE6 Pro and Tatsu premium rank cards |
| `/announcebanner` | Professional announcement graphic (6 types: announcement, alert, update, etc.) |
| `/eventbanner` | Event banner with title, date, description, and host |
| `/certificate` | Achievement or award certificate (8 types: Staff of the Month, Tournament Winner, etc.) |
| `/invitecard` | Branded invite card with QR code — shareable on social media and IRL |

### 🧠 AI & Utilities
| Command | Description |
|---|---|
| `/mood` | AI color palette from a mood description |
| `/template` | Load a built-in brand template and render its full kit |
| `/saveme` | Save your most recent design as a named kit |
| `/history` | View recent command history |
| `/gui open` | Get the link to the visual GUI builder |
| `/gui status` | Check if the GUI server is online |
| `/status` | Bot uptime and version |
| `/help` | Full command reference |

---

## Nitro-Free & Anti-Paywall Features

Discord and popular bots lock many features behind subscriptions. Sigil generates downloadable assets you upload yourself — no subscription ever needed.

| Paid Feature | What You Pay Elsewhere | Sigil Workaround |
|---|---|---|
| Custom welcome images | MEE6 Pro — $5.99/mo | `/welcomecard` — free, fully customizable |
| Styled rank cards | MEE6 Pro / Tatsu Premium | `/rankcard` — free with XP bar, level, rank |
| Custom stickers | Discord Nitro | `/sticker` — upload PNG to any server free |
| Extra emoji slots | Nitro Boost | `/emote` — upload 128×128 PNG to any server free |
| Server invite splash | Level 1 Boost | `/splash` — 1920×1080 PNG ready to upload |
| Profile banner | Discord Nitro | `/profilecard` — Nitro-style card as shareable PNG |

---

## Built-in Brand Templates

Use `/template name:<template>` to instantly generate a full kit from any of the 8 built-in templates.

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

## Icon Shapes

All icon commands support a **`shape`** option: `circle`, `rounded`, `square`, `hexagon`, `diamond`.

---

## Backgrounds

**32 background presets** across five categories: Gradients, Solids, Patterns, Named (templates).

---

## GUI Visual Brand Builder

A browser-based 4-step wizard for building brand kits visually with no slash commands required.

**Steps:** Identity → Colors → Style → Generate

**Features:** 8 templates, shape selector, 32 backgrounds, 8 borders, 7 output presets, shareable links, randomizer, light/dark theme, AI generate (Gemini), export config JSON.

---

## Setup

### Prerequisites
- Node.js 18
- Discord bot token — [Discord Developer Portal](https://discord.com/developers/applications)
- Google Gemini API key — [Google AI Studio](https://aistudio.google.com/app/apikey) *(optional — AI commands only)*

### Installation

```bash
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil
npm install
cp .env.example .env
# Fill in DISCORD_TOKEN, CLIENT_ID, and optionally GEMINI_API_KEY
node src/deploy-commands.js   # Register slash commands with Discord
node src/index.js              # Start the bot
```

### GUI Server (optional)

```bash
node gui/gui-server.js
# Open http://localhost:8080
```

Set `GUI_URL` in `.env` to your public URL if hosting remotely.

---

## Deployment (Railway)

1. Push to GitHub.
2. Create a new Railway project from your repo.
3. Add environment variables: `DISCORD_TOKEN`, `CLIENT_ID`, `GEMINI_API_KEY` (optional), `GUI_URL` (optional).
4. Railway auto-detects `railpack.json` and builds with native canvas dependencies.
5. Start command: `node src/index.js`.

To run the GUI server, create a second Railway service with start command `node gui/gui-server.js`.

---

## Project Structure

```
Sigil/
├── gui/
│   ├── gui-server.js
│   └── sigil-gui-builder.html
├── src/
│   ├── commands/              # 32 slash command handlers
│   ├── events/                # Discord.js event handlers
│   ├── fonts/                 # Bundled font files
│   ├── utils/
│   │   ├── backgrounds.js     # 32 background presets
│   │   ├── borders.js         # 8 border styles
│   │   ├── canvas.js          # renderIcon, renderBanner, renderKit
│   │   ├── fonts.js           # Font registration
│   │   ├── gemini.js          # Gemini API helpers
│   │   ├── history.js         # Per-user command history
│   │   └── colors.js          # Color autocomplete
│   ├── deploy-commands.js
│   └── index.js
├── .env.example
├── railpack.json
├── railway.toml
└── package.json
```

---

## Credits

Sigil was inspired by and built upon the original concept from [**NoVa-Gh0ul/Discord-Icon-Gen**](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen). Sigil has since evolved into a full branding and community tools platform.

---

## License

MIT
