# Discord Icon Gen

> **Forked from [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen)**
> Original author: [@NoVa-Gh0ul](https://github.com/NoVa-Gh0ul) — all credit for the original concept and implementation.

A Discord bot that generates fully customizable profile icons and server banners on demand.

---

## What's New in This Fork

- **`/banner` command** — generates a 1024×320 server banner with optional subtitle
- **Font registry** — centralized font management in `src/utils/fonts.js`
- **`/help` command** — full command reference inside Discord
- **Global command deployment** — `DEPLOY_MODE=guild` for dev, `DEPLOY_MODE=global` for production
- **Input validation** — hex color checking, text length caps, font size bounds
- **Command caching** — commands loaded at startup
- **Scoped intents** — only requests what is needed
- **Improved error handling** — structured logs and user-facing messages

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/ShadowWalkerNC/Discord-Icon-Gen.git
cd Discord-Icon-Gen
npm install
cp .env.example .env
# Fill in TOKEN, CLIENT_ID, GUILD_ID, DEPLOY_MODE
```

### Running
```bash
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOKEN` | Yes | Your Discord bot token |
| `CLIENT_ID` | Yes | Your Discord application client ID |
| `GUILD_ID` | Guild mode only | Server ID for guild-scoped registration |
| `DEPLOY_MODE` | No (default: `guild`) | `guild` for dev, `global` for production |

> Use `DEPLOY_MODE=guild` during development (instant). Switch to `DEPLOY_MODE=global` for public release (up to 1hr propagation).

---

## Commands

### `/icon`
Generates a **400×400** profile icon.

| Option | Required | Description |
|---|---|---|
| `text` | Yes | Text to display (max 20 characters) |
| `size` | Yes | Font size in pixels (10–200) |
| `color` | Yes | Hex color (e.g. `#FF0000`) |
| `glow` | Yes | `Low`, `Medium`, or `High` |
| `background` | Yes | `Plain (Black)`, `Custom Background 1`, `Custom Background 2` |
| `font` | No | Font style. Default: `Another Danger` |

**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`

---

### `/banner`
Generates a **1024×320** server banner.

| Option | Required | Description |
|---|---|---|
| `text` | Yes | Primary text (max 30 characters) |
| `size` | Yes | Font size in pixels (10–150) |
| `color` | Yes | Hex color (e.g. `#00FFFF`) |
| `glow` | Yes | `Low`, `Medium`, or `High` |
| `background` | Yes | `Plain (Black)`, `Custom Background 1`, `Custom Background 2` |
| `subtitle` | No | Smaller text beneath the main text (max 50 chars) |
| `font` | No | Font style. Default: `Another Danger` |

**Example:** `/banner text:MyServer size:90 color:#00FFFF glow:Medium background:Plain (Black) subtitle:Est. 2024`

---

### `/help`
Displays the full command reference inside Discord. Only visible to you.

---

## Adding New Fonts

1. Drop your `.otf` or `.ttf` file into `src/fonts/`
2. Add an entry to `src/utils/fonts.js`:
```js
'my-font': {
    label: 'My Font',
    file: path.resolve(__dirname, '..', 'fonts', 'my-font.otf'),
    family: 'My Font',
}
```
3. It automatically appears as a choice in `/icon` and `/banner`

---

## Deployment

[Railway](https://railway.app) or [Fly.io](https://fly.io) work well for hosting. Set env vars in the platform dashboard and use `DEPLOY_MODE=global`.

---

## License
MIT — see [LICENSE](LICENSE) for details.

---

*Maintained by [@ShadowWalkerNC](https://github.com/ShadowWalkerNC). Please visit the [original repository](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen) to support the original author.*
