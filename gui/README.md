# Sigil GUI Builder

A fully standalone visual front-end for Sigil's brand generation pipeline.

## Files

| File | Purpose |
|---|---|
| `sigil-gui-builder.html` | Full browser GUI — open directly or served via `gui-server.js` |
| `gui-server.js` | Express-style bridge between the GUI and Sigil's Gemini pipeline |
| `README.md` | This file |

---

## Quick start

### 1. Open the GUI offline (no server needed)

Just open `gui/sigil-gui-builder.html` in your browser. All preview, color, background, font, and export features work locally — no Node process required. Click **Copy config JSON** to copy a payload you can paste anywhere.

### 2. Run with the backend bridge (full AI generation)

```bash
# From the repo root:
node gui/gui-server.js

# Custom port:
GUI_PORT=4000 node gui/gui-server.js
```

Then open **http://127.0.0.1:3420** in your browser. The GUI is served automatically. Fill in your brand details, hit **Generate**, and the server calls `geminiRequest` + `geminiImageRequest` and returns the full brand kit as JSON (plus a base64 icon if image gen succeeds).

### 3. Open from Discord

Once the bot is running and the GUI server is up:

```
/gui open          — sends you a private link to the GUI
/gui open public   — posts the link in the channel
/gui status        — check if the GUI server is online
```

When you open the GUI via `/gui open`, a Discord webhook is automatically registered for your channel. Any brand kit you generate will be posted back to the channel as an embed.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serve `sigil-gui-builder.html` |
| `GET` | `/health` | Uptime + version ping |
| `POST` | `/generate` | Full AI brand kit (text + image gen) |
| `POST` | `/preview` | Fast config validation (no Gemini call) |
| `POST` | `/webhook-register` | Register a Discord webhook for asset callbacks |

### POST /generate — request body

The GUI sends its config JSON directly. Shape:

```json
{
  "brand": {
    "name": "Demonfall",
    "tagline": "Unleash the Darkness.",
    "description": "dark fantasy fighting guild",
    "image_prompt": "ancient demon sigil..."
  },
  "visuals": {
    "primary_color": "#8B0000",
    "secondary_color": "#4B0082",
    "background": "midnight-gradient",
    "border": "glow",
    "glow": 15,
    "font": "Arial Black",
    "gradient_enabled": true
  },
  "integration": {
    "channelId": "optional-discord-channel-id"
  }
}
```

### POST /generate — response

```json
{
  "ok": true,
  "brand": {
    "name": "Demonfall",
    "tagline": "...",
    "palette": ["#8B0000", "#4B0082", "#1a0a1a"],
    "icon_prompt": "...",
    "banner_prompt": "...",
    "description": "..."
  },
  "icon_b64": "<base64 PNG or null if image gen was skipped>",
  "config_in": { "...original config echoed back..." }
}
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Required for `/generate` AI calls |
| `GUI_PORT` | `3420` | Port for the GUI server |
| `GUI_PUBLIC_URL` | `http://127.0.0.1:3420` | Publicly accessible URL shown in Discord |

Set `GUI_PUBLIC_URL` to your tunneled URL (ngrok, Cloudflare Tunnel, etc.) if you want the Discord `/gui open` link to work for other users.

---

## Integration with existing Sigil commands

The GUI server imports `src/utils/gemini.js` directly — it uses the same `geminiRequest`, `geminiImageRequest`, and `extractJson` functions as `/brand ai`, `/icon`, `/banner`, and all other commands. No duplicated logic.

The config JSON shape output by the GUI is compatible with the `/brand ai` payload so you can feed it directly into that pipeline too.
