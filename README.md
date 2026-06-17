# Sigil

Discord branding bot — 17 slash commands, AI brand generation, emoji/sticker packs, clan system, leaderboard, tournaments, seasonal themes.

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in TOKEN, CLIENT_ID, GEMINI_API_KEY
npm run deploy
npm start
```

See [SETUP.md](SETUP.md) for full instructions.

## Full Command Reference

| Command | Subcommands | Notes |
|---|---|---|
| `/brand` | `ai` `manual` `apply` `health` | Core brand engine |
| `/profile` | `manual` `show` `reset` | Per-user visual profile |
| `/theme` | `apply` `list` | 12 preset themes |
| `/emoji` | `pack` `apply` | Boost-tier gated slots |
| `/sticker` | `pack` `apply` | Worker-queued upload |
| `/role` | `badge` | Boost-tier gated icons |
| `/server` | `setup` `preflight` | Branding wizard |
| `/automation` | `enable` `disable` `status` | Welcome/goodbye cards |
| `/tournament` | `create` `end` | Resource-checked |
| `/leaderboard` | `show` `add` `remove` `reset` | Points system |
| `/clan` | `create` `join` `leave` `list` `info` | Private channels |
| `/rank` | `setup` `add` `show` | Boost-gated icons |
| `/event` | `create` `auto` `list` | Voice/external fallback |
| `/anime` | `season` `list` | Seasonal palette swap |
| `/status` | — | Live bot diagnostics |
| `/help` | — | Grouped command reference |
| `/gui` | — | Visual builder link |

## Deployment Matrix

| Platform | Command | Notes |
|---|---|---|
| Local | `npm start` | Bot process |
| GUI | `npm run gui` | Port 3420 |
| Docker | `docker compose up -d` | Bot + GUI services |
| Railway | `node src/index.js` | `railway.toml` included |
| Replit | `npm start` | `replit.nix` included |
