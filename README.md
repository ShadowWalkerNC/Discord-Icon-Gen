# Sigil

> **Your server's mark. Crafted by AI.**

Sigil is a Discord bot for AI-powered server branding — generate icons, banners, badges, profile cards, brand kits, and more. Built on top of [Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen) by NoVa-Gh0ul, evolved into a full server customization platform.

![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-18.x-brightgreen)

---

## Features

- 🎨 **Icon & Banner generation** — text, colors, fonts, glow, borders
- 🖼️ **Brand kit** — icon + banner + badge + palette in one command
- 🤖 **AI-powered design** — describe your server, get a full brand kit (Gemini)
- 🏅 **Badges & Cards** — role badges, profile cards, rank cards, welcome images
- 🎭 **Mood-based themes** — one word in, full color palette out
- 📦 **Brand export** — ZIP of all your server's assets
- 🖥️ **Visual GUI** — browser-based brand builder with live preview

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
DEPLOY_MODE=guild
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run

```bash
npm start
```

---

## Deploy to Railway

1. Push to GitHub
2. New Project → Deploy from GitHub repo
3. Add environment variables in the Variables tab
4. Railway auto-deploys on every push to `main`

---

## Commands

### 🖼️ Assets

| Command | Description |
|---|---|
| `/icon` | 400×400 profile icon with text, background, border |
| `/banner` | 1024×320 server banner |
| `/avatar` | Text overlay on your profile picture |
| `/logo` | 512×512 transparent PNG logo |
| `/compare` | Two icons side-by-side |
| `/random` | Fully randomised icon |
| `/preview` | All available backgrounds |

### 🖥️ GUI

| Command | Description |
|---|---|
| `/gui open` | Get a clickable link to the visual brand builder (ephemeral by default) |
| `/gui open public:true` | Post the GUI link publicly in the channel |
| `/gui status` | Check if the GUI server is running |

**Starting the GUI server:**
```bash
node gui/gui-server.js
# Custom port:
GUI_PORT=4000 node gui/gui-server.js
```

The GUI opens at `http://localhost:3420` (or your `GUI_PUBLIC_URL` env var). Features:
- 54-color swatch library — click for primary, Shift+click for secondary
- 12 background presets + gradient blend toggle
- 6 border modes, glow strength slider, 6 font options
- Live preview panel — icon, banner, palette, Discord embed mockup
- **Generate** — runs full Gemini brand pipeline and posts assets back to the originating Discord channel via webhook
- **Fast Preview** — instant canvas-only render with no Gemini call (~1–2 s)
- Download tray — PNG export for icon, banner, palette, and AI image

### 🤖 AI Brand

| Command | Description |
|---|---|
| `/brand ai` | Describe your server → full AI-generated brand kit |
| `/brand kit` | Manual brand kit with your own colors and text |
| `/brand export` | ZIP download of all saved brand assets |
| `/mood` | One word → AI color palette + preview icon |

### 🛠️ Utility

| Command | Description |
|---|---|
| `/help` | Full command reference |
| `/history` | Your recent generations |
| `/saveme` | DM yourself your latest assets |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOKEN` | ✓ | Discord bot token |
| `CLIENT_ID` | ✓ | Discord application ID |
| `GUILD_ID` | ✓ (guild mode) | Server ID for guild-scoped commands |
| `GEMINI_API_KEY` | ✓ (AI features) | Google Gemini API key |
| `DEPLOY_MODE` | — | `guild` (fast) or `global`. Default: `guild` |
| `GUI_PORT` | — | GUI server port. Default: `3420` |
| `GUI_PUBLIC_URL` | — | Public URL for the GUI (e.g. via ngrok or Railway) |

---

## License

MIT — see [LICENSE](LICENSE).
