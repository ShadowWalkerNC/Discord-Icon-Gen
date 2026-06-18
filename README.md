# Sigil — Discord Server Branding Bot

**Sigil** is an AI-powered Discord bot that generates custom server icons, banners, logos, and full brand kits — all from slash commands. It also includes a browser-based **Visual Brand Builder** GUI with live preview, templates, and optional AI generation.

---

## Features

| Command | Description |
|---|---|
| `/icon` | Generate a server icon |
| `/banner` | Generate a wide server banner |
| `/logo` | Generate a logo-style icon |
| `/avatar` | Generate a server avatar with optional overlay |
| `/brand kit` | Build a full brand kit (icon + banner + palette) |
| `/brand ai` | AI-designed brand kit from a description |
| `/mood` | AI color palette from a mood description |
| `/compare` | Side-by-side icon comparison |
| `/random` | Fully random icon generation |
| `/preview` | Grid preview of all backgrounds |
| `/saveme` | Save your most recent design |
| `/history` | View recent command history |
| `/gui open` | Get the link to the visual GUI builder |
| `/gui status` | Check if the GUI server is online |
| `/help` | Full command reference |

---

## GUI Visual Brand Builder

The GUI (`gui/sigil-gui-builder.html`) is a browser-based 4-step wizard for building brand kits visually, with no slash commands required.

### GUI Features
- **8 built-in brand templates** — Dark Fantasy, Cyberpunk, Fantasy RPG, Community, Racing, Tactical FPS, Survival RPG, Sci-Fi — each pre-loading all colors, fonts, backgrounds, and prompts
- **Live preview** — icon, banner, and palette update in real time as you type
- **Color library** — 7 color groups with 28 swatches; tap for primary, shift+tap or long-press for secondary
- **12 background presets** — Midnight, Deep Space, Inferno, Ocean, Twilight, Aurora, Storm, Void, Neon City, Sunset, Forest, Polar
- **6 border styles** — None, Solid, Glow, Gradient, Double, Dashed
- **7 output size presets** — Discord Icon (512×512), Discord Banner (960×540), Twitch Panel (320×160), Twitch Banner (1200×480), YouTube Art (2560×1440), Reddit Banner (1920×384), Square (1024×1024)
- **Shareable links** — full brand state encoded in URL hash for easy sharing
- **Randomize** — instant random color, background, border, and font combination
- **Light/dark theme toggle**
- **Export config JSON** — compatible with `/brand ai` and `gemini.js`
- **AI Generate** (beta) — requires your own Gemini API key; generates AI brand suggestions + icon overlay image

---

## Setup

### Prerequisites
- Node.js 18+
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey)) *(optional — only needed for AI commands and AI Generate in GUI)*

### Installation

```bash
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil
npm install
cp .env.example .env
# Fill in .env with your tokens
node src/deploy-commands.js   # Register slash commands
node src/index.js              # Start the bot
```

### GUI Server (optional)

The GUI provides a browser-based visual brand builder.

```bash
node gui/gui-server.js
# Open http://localhost:3420
```

Set `GUI_URL` in `.env` to your public URL if hosting remotely.

---

## Deployment (Railway)

1. Push to GitHub.
2. Create a new Railway project from your repo.
3. Add environment variables (`DISCORD_TOKEN`, `CLIENT_ID`, `GEMINI_API_KEY`).
4. Railway will auto-detect `railpack.json` and build with canvas native deps.
5. Start command: `node src/index.js`

---

## Credits

Sigil was inspired by and built upon the original concept from [**NoVa-Gh0ul/Discord-Icon-Gen**](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen) — a simple Discord bot for generating customized icons. Sigil has since evolved into a full brand kit platform, but credit goes to NoVa-Gh0ul for the original idea.

---

## License

MIT
