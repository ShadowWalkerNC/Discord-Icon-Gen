# ⚡ Sigil

> A powerful, self-hosted Discord bot for server automation, moderation, XP, alerts, and more.

---

## Features

| Module | Description |
|---|---|
| 🎉 Welcome / Goodbye | Canvas-rendered cards on member join/leave |
| 🔨 Moderation | Ban, kick, warn, mute, case history |
| ⭐ XP & Leveling | Per-message XP, level-up cards, leaderboard |
| 🟣 Twitch Alerts | Live alerts when tracked streamers go live |
| 📥 YouTube Alerts | Upload alerts via RSS or YouTube Data API v3 |
| 🗓️ Scheduled Posts | Schedule text or embed messages for any time |
| 📊 Weekly Stats | Auto Monday report — members, joins, XP, boosts |
| 📌 Event Banners | Teaser, live, and recap embeds for Discord Events |

---

## Requirements

- **Node.js** v18 or higher
- **npm** packages: `discord.js`, `better-sqlite3`, `@napi-rs/canvas`, `dotenv`
- A Discord bot application with the following **Privileged Intents** enabled:
  - `SERVER MEMBERS INTENT`
  - `MESSAGE CONTENT INTENT`
  - `PRESENCE INTENT`

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env

# 4. Deploy slash commands to Discord
node src/deploy-commands.js

# 5. Start the bot
node src/index.js
```

---

## .env Reference

```env
# Required
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id

# Twitch live alerts (required for Twitch feature)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# YouTube upload alerts (optional — RSS fallback works without it)
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## Command Reference

### ⚙️ Configuration
| Command | Description |
|---|---|
| `/sigilconfig welcome` | Configure welcome cards |
| `/sigilconfig goodbye` | Configure goodbye cards |
| `/sigilconfig boost` | Configure boost alerts |
| `/sigilconfig milestone` | Configure member milestone alerts |
| `/sigilconfig stats` | Set weekly stats channel |
| `/sigilconfig event_banner` | Enable event banner channel |
| `/sigilconfig xp` | Configure XP system |
| `/sigilconfig status` | View all current settings |

### 🔨 Moderation
| Command | Description |
|---|---|
| `/ban` | Ban a member |
| `/kick` | Kick a member |
| `/warn` | Warn a member |
| `/mute` | Timeout a member |
| `/history` | View a member's mod case history |

### ⭐ XP & Leveling
| Command | Description |
|---|---|
| `/xprank [user]` | View XP rank card |
| `/xpleaderboard` | View top 10 XP leaderboard |
| `/xpadmin` | Give, set, or reset XP (admin only) |

### 🟣 Twitch
| Command | Description |
|---|---|
| `/twitch add` | Subscribe to a Twitch streamer's live alerts |
| `/twitch remove` | Remove a subscription |
| `/twitch list` | List all tracked streamers |

### 📥 YouTube
| Command | Description |
|---|---|
| `/youtube add` | Subscribe to a YouTube channel's upload alerts |
| `/youtube remove` | Remove a subscription |
| `/youtube list` | List all tracked channels |

### 🗓️ Scheduled Posts
| Command | Description |
|---|---|
| `/schedule post` | Schedule a message or embed |
| `/schedule list` | List all pending scheduled posts |
| `/schedule cancel` | Cancel a pending post by ID |

### 📊 Stats & Events
| Command | Description |
|---|---|
| `/stats` | Post weekly server stats report on demand |
| `/eventrecap` | Post a teaser, live banner, or recap for an event |

---

## Scheduling Time Formats

`/schedule post` accepts natural time strings for the `when` parameter:

| Format | Example |
|---|---|
| Relative | `in 2 hours`, `in 30 minutes`, `in 1 day` |
| Named | `tomorrow 9am`, `tomorrow 14:30` |
| Time today | `3pm`, `15:00` |
| ISO-style | `2026-06-20 15:00` |

---

## Architecture

```
Sigil/
├── src/
│   ├── commands/          # All slash command handlers
│   ├── events/            # Discord gateway event handlers
│   ├── services/          # Background runners (pollers, scheduler, stats)
│   │   ├── pollers.js     # Twitch (15s) + YouTube (60s) polling
│   │   ├── scheduler.js   # Scheduled post runner (60s)
│   │   └── statsRunner.js # Weekly stats runner (5min check)
│   ├── utils/
│   │   ├── db.js          # SQLite wrapper (better-sqlite3)
│   │   └── xp.js          # XP formula helpers
│   ├── fonts/             # Custom fonts for canvas cards
│   ├── images/            # Static assets for canvas cards
│   ├── deploy-commands.js # Slash command registration script
│   └── index.js           # Bot entry point
├── data/
│   └── sigil.db           # SQLite database (auto-created)
├── .env                   # Environment variables (not committed)
├── .env.example           # Environment variable template
└── package.json
```

---

## XP Formula

Level `n` requires `5n² + 50n + 100` XP to reach.

| Level | XP Required |
|---|---|
| 1 | 155 |
| 5 | 475 |
| 10 | 1,100 |
| 20 | 3,100 |

Default rate: ~15 XP/message with slight variance, 60s cooldown.

---

## License

MIT — see [LICENSE](LICENSE)
