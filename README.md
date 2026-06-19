# ⚡ Sigil

> A powerful, self-hosted Discord bot for server automation, moderation, XP, branding, alerts, and more — built with discord.js v14.

---

## Features

| Module | Description |
|---|---|
| 🎉 Welcome / Goodbye | Canvas-rendered cards on member join/leave |
| 🔨 Moderation | Ban, kick, warn, mute, mod log, case history |
| ⭐ XP & Leveling | Per-message XP, level-up cards, leaderboard, admin tools |
| 🎨 Branding & Graphics | Canvas-generated banners, logos, profile cards, rank cards, palettes, and more |
| 🟣 Twitch Alerts | Auto live alerts when tracked streamers go live |
| 📥 YouTube Alerts | Upload alerts via RSS or YouTube Data API v3 |
| 🗓️ Scheduled Posts | Schedule text or embed messages for any future time |
| 📊 Weekly Stats | Auto Monday 09:00 UTC server health report |
| 📌 Event Banners | Teaser, live, and recap embeds for Discord Scheduled Events |
| 🔧 Integrations | Webhook, GUI, and external service tools |

---

## Requirements

- **Node.js** v18 or higher
- **npm** packages: `discord.js`, `better-sqlite3`, `@napi-rs/canvas`, `dotenv`
- A Discord bot application with the following **Privileged Intents** enabled in the [Developer Portal](https://discord.com/developers/applications):
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

# Twitch live alerts (required for /twitch commands)
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
| `/sigilconfig welcome` | Configure welcome cards (channel, color, background, font) |
| `/sigilconfig goodbye` | Configure goodbye cards |
| `/sigilconfig boost` | Configure boost alert channel |
| `/sigilconfig milestone` | Configure member milestone alert channel |
| `/sigilconfig stats` | Set weekly stats report channel |
| `/sigilconfig event_banner` | Enable/disable event banner channel |
| `/sigilconfig xp` | Configure XP system (enable, channel, rate, cooldown) |
| `/sigilconfig status` | View all current settings for this server |

### 🔨 Moderation
| Command | Description |
|---|---|
| `/ban` | Ban a member with reason |
| `/kick` | Kick a member with reason |
| `/warn` | Warn a member (logged to case history) |
| `/mute` | Timeout a member for a duration |
| `/history` | View a member's full mod case history |
| `/modlog` | Configure the mod log channel |

### ⭐ XP & Leveling
| Command | Description |
|---|---|
| `/xprank [user]` | View canvas XP rank card for yourself or another user |
| `/xpleaderboard` | View top 10 XP leaderboard canvas card |
| `/xpadmin give/set/setlevel/reset` | Admin XP management tools |

### 🎨 Branding & Graphics
| Command | Description |
|---|---|
| `/announcebanner` | Generate a canvas announcement banner |
| `/avatar` | View and download a user's avatar in multiple formats |
| `/banner` | Generate a custom canvas server banner |
| `/brand` | Full brand kit generator (logo, colors, fonts) |
| `/certificate` | Generate a canvas achievement/award certificate |
| `/compare` | Compare two users' avatars or profiles side by side |
| `/emote` | Create or resize custom emote images |
| `/eventbanner` | Generate a canvas event banner image |
| `/icon` | Generate a server or user icon graphic |
| `/invitecard` | Generate a custom canvas invite card |
| `/logo` | Generate a server logo graphic |
| `/mood` | Generate a mood board or color palette card |
| `/namecard` | Generate a canvas name/business card |
| `/palette` | Extract and display a color palette from an image |
| `/profilecard` | Generate a canvas profile card |
| `/rankcard` | Generate a custom canvas rank card |
| `/reactionpack` | Generate a set of reaction images |
| `/resize` | Resize an image to custom dimensions |
| `/rolebadge` | Generate a canvas role badge graphic |
| `/servercard` | Generate a canvas server info card |
| `/splash` | Generate a server splash/welcome screen graphic |
| `/sticker` | Create a custom sticker image |
| `/template` | Apply a canvas template to an image |
| `/texteffect` | Apply text effects (glow, shadow, gradient, etc.) |
| `/themepreview` | Preview a color theme across multiple card styles |
| `/welcomecard` | Preview or generate a welcome card manually |

### 🟣 Twitch
| Command | Description |
|---|---|
| `/twitch add` | Subscribe to a Twitch streamer's live alerts |
| `/twitch remove` | Remove a Twitch alert subscription |
| `/twitch list` | List all tracked Twitch streamers |

### 📥 YouTube
| Command | Description |
|---|---|
| `/youtube add` | Subscribe to a YouTube channel's upload alerts |
| `/youtube remove` | Remove a YouTube alert subscription |
| `/youtube list` | List all tracked YouTube channels |

### 🗓️ Scheduled Posts
| Command | Description |
|---|---|
| `/schedule post` | Schedule a plain text or embed message |
| `/schedule list` | View all pending scheduled posts (paginated) |
| `/schedule cancel` | Cancel a pending scheduled post by ID |

### 📊 Stats & Events
| Command | Description |
|---|---|
| `/stats` | Post the weekly server stats report on demand |
| `/eventrecap` | Manually post a teaser, live banner, or recap for an event |
| `/serverstats` | View live server statistics |

### 🔧 Utilities & Integrations
| Command | Description |
|---|---|
| `/ping` | Check bot latency and API response time |
| `/status` | View bot status and uptime |
| `/gui` | Open a GUI panel for bot configuration |
| `/integrations` | Manage external service integrations |
| `/saveme` | DM yourself a copy of your server's config |
| `/help` | Full interactive help menu |

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

## XP Formula

Level `n` requires `5n² + 50n + 100` XP to reach.

| Level | XP Required |
|---|---|
| 1 | 155 |
| 5 | 475 |
| 10 | 1,100 |
| 20 | 3,100 |

Default rate: ~15 XP/message with slight variance, 60s cooldown per user.

---

## Architecture

```
Sigil/
├── src/
│   ├── commands/          # All slash command handlers (40+ commands)
│   ├── events/            # Discord gateway event handlers
│   ├── services/          # Background runners
│   │   ├── pollers.js     # Twitch (15s) + YouTube (60s) polling
│   │   ├── scheduler.js   # Scheduled post runner (60s tick)
│   │   ├── statsRunner.js # Weekly stats runner (5min check)
│   │   ├── twitch.js      # Twitch API helpers
│   │   └── youtube.js     # YouTube API + RSS helpers
│   ├── utils/
│   │   ├── db.js          # SQLite wrapper (better-sqlite3)
│   │   └── xp.js          # XP formula helpers
│   ├── fonts/             # Custom fonts for canvas rendering
│   ├── images/            # Static assets for canvas cards
│   ├── deploy-commands.js # Slash command registration script
│   └── index.js           # Bot entry point
├── data/
│   └── sigil.db           # SQLite database (auto-created on first run)
├── .env                   # Environment variables (never commit this)
├── .env.example           # Environment variable template
├── LICENSE
└── package.json
```

---

## Background Services

| Service | Interval | Purpose |
|---|---|---|
| Twitch Poller | 15 seconds | Check tracked streamers for live status |
| YouTube Poller | 60 seconds | Check tracked channels for new uploads |
| Scheduler | 60 seconds | Flush and send due scheduled posts |
| Stats Runner | 5 minutes | Check if it's Monday 09:00 UTC and post weekly report |

---

## License

MIT — see [LICENSE](LICENSE)
