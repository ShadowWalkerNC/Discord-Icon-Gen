# Discord Icon Gen

> **Forked from [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen)**
> Original author: [@NoVa-Gh0ul](https://github.com/NoVa-Gh0ul) — all credit for the original concept and implementation.

A Discord bot that generates fully customizable profile icons on demand. Drop it into your server, run `/icon`, and get a styled image in seconds.

---

## What's New in This Fork

- **Global command deployment** — supports both guild (dev) and global (production) command registration via `DEPLOY_MODE`
- **Input validation** — hex color format checking, text length cap, font size bounds
- **Command caching** — commands are loaded at startup instead of re-required on every interaction
- **Scoped intents** — only requests the `Guilds` intent instead of enabling everything by default
- **Improved error handling** — structured error logs and user-facing error messages instead of silent failures
- **Cleaner project structure** — `.gitignore`, `.env.example`, fixed `package.json` dependencies

---

## Features

- Generate a 400×400 icon with custom text
- Choose your font size, text color (hex), and glow intensity
- Select from multiple background styles
- Delivered directly as an image attachment in Discord

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
# Clone the repo
git clone https://github.com/ShadowWalkerNC/Discord-Icon-Gen.git
cd Discord-Icon-Gen

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env
# Then open .env and fill in your values
```

### Running the Bot

```bash
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOKEN` | Yes | Your Discord bot token |
| `CLIENT_ID` | Yes | Your Discord application client ID |
| `GUILD_ID` | Guild mode only | The server ID to register slash commands to |
| `DEPLOY_MODE` | No (default: `guild`) | `guild` for dev, `global` for production |

> **Tip:** Use `DEPLOY_MODE=guild` while developing — commands register instantly. Switch to `DEPLOY_MODE=global` when you're ready to go public. Global registration can take up to 1 hour to propagate.

Copy `.env.example` to `.env` and fill in your values. **Never commit your `.env` file.**

---

## Commands

### `/icon`

Generates a custom 400×400 profile icon with your chosen text, font size, color, glow, and background.

| Option | Required | Description |
|---|---|---|
| `text` | Yes | Text to display (max 20 characters) |
| `size` | Yes | Font size in pixels (10–200) |
| `color` | Yes | Text color in hex format (e.g. `#FF0000`) |
| `glow` | Yes | Glow intensity: `Low`, `Medium`, or `High` |
| `background` | Yes | Background style: `Plain (Black)`, `Custom Background 1`, or `Custom Background 2` |

**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`

---

## Deployment

For production hosting, services like [Railway](https://railway.app) or [Fly.io](https://fly.io) work well with this bot. Set your environment variables in the platform's dashboard and set `DEPLOY_MODE=global`.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*This is a fork maintained by [@ShadowWalkerNC](https://github.com/ShadowWalkerNC). Please visit the [original repository](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen) to support the original author.*
