# Discord Icon Gen

> **Forked from [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen)**
> Original author: [@NoVa-Gh0ul](https://github.com/NoVa-Gh0ul) — all credit for the original concept and implementation.

A Discord bot that generates fully customizable profile icons on demand. Drop it into your server, run `/icon`, and get a styled image in seconds.

---

## What's New in This Fork

- **Input validation** — hex color format checking, text length cap, font size bounds
- **Command caching** — commands are loaded at startup instead of re-required on every interaction
- **Scoped intents** — only requests the `Guilds` intent instead of enabling everything by default
- **Improved error handling** — structured error logs and user-facing error messages instead of silent failures
- **Cleaner project structure** — `.gitignore`, `.env.example`, fixed `package.json` dependencies

---

## Features

- Generate a 400x400 icon with custom text
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
# Then open .env and fill in your TOKEN, CLIENT_ID, and GUILD_ID
```

### Running the Bot

```bash
npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `TOKEN` | Your Discord bot token |
| `CLIENT_ID` | Your Discord application client ID |
| `GUILD_ID` | The server ID to register slash commands to |

Copy `.env.example` to `.env` and fill in your values. **Never commit your `.env` file.**

---

## Usage

Once the bot is running and invited to your server, use the `/icon` slash command:

| Option | Required | Description |
|---|---|---|
| `text` | Yes | Text to display (max 20 characters) |
| `size` | Yes | Font size in pixels (10–200) |
| `color` | Yes | Text color in hex format (e.g. `#FF0000`) |
| `glow` | Yes | Glow intensity: Low, Medium, or High |
| `background` | Yes | Background style: Plain, Custom 1, or Custom 2 |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*This is a fork maintained by [@ShadowWalkerNC](https://github.com/ShadowWalkerNC). Please visit the [original repository](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen) to support the original author.*
