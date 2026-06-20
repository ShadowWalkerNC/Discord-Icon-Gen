<div align="center">

<img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/self--hosted-open%20source-F4C842?style=for-the-badge" />
<img src="https://img.shields.io/github/license/ShadowWalkerNC/Sigil?style=for-the-badge" />

# ⚡ Sigil

### *One bot. Every community.*

**Sigil is a self-hosted Discord bot that turns any server into a fully-managed community hub — without needing a developer.**

Built for churches, gaming clans, restaurants, streamers, schools, and businesses. Plug it in, run a few commands, and your server runs itself.

[**Get Started →**](#-quick-start) · [**Commands →**](#-command-reference) · [**Scheduler Bridge →**](SCHEDULER_INTEGRATION.md)

</div>

---

## Why Sigil?

Most Discord bots are built for tech people. Sigil is built for **everyone else**.

A pastor shouldn't need to edit JSON to post a daily devotional. A restaurant manager shouldn't need a developer to show today's roster. A clan leader shouldn't need to read documentation to start a giveaway.

With Sigil, every feature is a **single slash command** — no dashboards, no config files, no subscriptions. You own it. You host it. It does exactly what you need.

---

## 🌍 Built for Real Communities

| Community | What Sigil Does For You |
|---|---|
| ⛪ **Churches** | Daily devotionals with translation picker, prayer walls, volunteer sign-ups, sermon announcements, RSVP events, visitor onboarding |
| 🎮 **Gaming / Clans** | LFG posts, XP leaderboards, giveaways, Twitch/YouTube live alerts, session scheduling |
| 🍽️ **Restaurants & Hospitality** | Staff shift boards connected to your scheduler, callout submissions from Discord, daily specials, customer announcements, loyalty XP |
| 🎥 **Streamers & Creators** | Auto live alerts, YouTube upload notifications, fan engagement XP, milestone celebrations, subscriber role perks |
| 🎓 **Schools & Study Groups** | Reminders, leaderboards, resource sharing, event scheduling |
| 💼 **Small Businesses** | Support tickets, product drops, appointment reminders, branded embeds |

---

## ✨ Feature Highlights

### 🏠 Community Essentials
- **Welcome & Goodbye** — Canvas-rendered branded cards on join and leave
- **Auto Roles** — Assign roles automatically when members join
- **XP & Leveling** — Message XP, level-up cards, weekly leaderboard with Sunday reset, level-based role rewards
- **Giveaways** — Timed button-entry giveaways with auto draw, reroll, role-gating, and live countdown
- **Polls** — Timed polls with up to 10 options and live vote counts
- **Tickets** — Private thread-based support tickets with staff access and close logging
- **Reminders** — Personal DM or channel reminders, up to 30 days out

### 🛡️ Moderation
- Ban, kick, warn, timeout, purge, slowmode
- Mod case history per user
- Automod: anti-spam, anti-links, anti-caps, mention flood, bad word filter, bypass roles
- Server logging: message edits, deletions, joins, and leaves

### 🎨 Branding & Graphics
- **25+ canvas commands** — rank cards, welcome banners, certificates, event banners, mood boards, stickers, and more
- **AI Brand Kit** — Gemini-powered brand name suggestions, logo generation, and visual theme building via `/brand`
- **Embed Builder** — Live preview `/embed create` with fields, images, colors, and footer — no code needed
- **Sermon Announcements** — `/sermon` posts a clean embed with video, audio, scripture, and study notes links

### 🔔 Alerts & Integrations
- **Twitch** — Auto-post live alerts when tracked streamers go live
- **YouTube** — Upload alerts via YouTube API or free RSS fallback
- **Scheduler Bridge** — Connect Sylvia Ross MC or any compatible scheduler; staff check shifts and submit callouts from Discord
- **Scheduled Posts** — Set any message to auto-post at a future time
- **Webhook Automation** — Inbound webhook handler for external service integrations

### ⛪ Church Tools
- **Daily Devotionals** — Auto-scheduled morning posts with verse from API.Bible (8 translations: KJV, NIV, ESV, NKJV, NLT, MSG, AMP, WEB), custom reflection queue, and `/devotional lookup`
- **Prayer Requests** — Post to a prayer wall with optional staff notification
- **Volunteer Sign-ups** — Shift slots with open-slot list and DM confirmation
- **RSVP Events** — Button-based Yes / No / Maybe with headcount and 24h reminders

---

## 🚀 Quick Start

### 1 — Prerequisites
- [Node.js v18+](https://nodejs.org)
- A [Discord Application](https://discord.com/developers/applications) with a bot token
- Enable these **Privileged Intents** in the Developer Portal:
  - ✅ Server Members Intent
  - ✅ Message Content Intent
  - ✅ Presence Intent

### 2 — Install

```bash
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil
npm install
```

### 3 — Configure

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id
```

> Full `.env` reference: [see below →](#-env-reference)

### 4 — Deploy Commands

```bash
node src/deploy-commands.js
```

### 5 — Start

```bash
node src/index.js
```

Your bot is live. Invite it to your server and run `/help` to explore.

> **Tip:** For 24/7 hosting, use [PM2](https://pm2.keymetrics.io/) (`pm2 start src/index.js --name sigil`) or deploy to [Railway](https://railway.app) / [Render](https://render.com).

---

## 🔐 .env Reference

```env
# ── Required ───────────────────────────────────────────────
DISCORD_TOKEN=           # Your bot token
CLIENT_ID=              # Your application client ID
GUILD_ID=               # Your server ID (for dev/slash deploy)

# ── Twitch Alerts (optional) ───────────────────────────────
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# ── YouTube Alerts (optional — RSS fallback works free) ────
YOUTUBE_API_KEY=

# ── AI Brand Kit (optional) ────────────────────────────────
GEMINI_API_KEY=         # Enables /brand AI features

# ── API.Bible (optional — free fallback works without) ─────
BIBLE_API_KEY=          # Free key at https://scripture.api.bible
                        # Unlocks all 8 translations in /devotional

# ── Scheduler Bridge (optional) ────────────────────────────
# Set on your scheduler server, not here.
# See SCHEDULER_INTEGRATION.md for full setup.

# ── GUI Brand Builder (optional) ───────────────────────────
GUI_URL=http://localhost:3420
PORT=3420
```

---

## 📜 Command Reference

### ⚙️ Server Configuration
| Command | Description |
|---|---|
| `/sigilconfig welcome` | Configure welcome cards — channel, color, background, font |
| `/sigilconfig goodbye` | Configure goodbye cards |
| `/sigilconfig boost` | Set boost alert channel |
| `/sigilconfig milestone` | Set member milestone alert channel |
| `/sigilconfig stats` | Set weekly stats report channel |
| `/sigilconfig xp` | Configure XP system — on/off, channel, rate, cooldown |
| `/sigilconfig ticket` | Configure ticket category, support role, log channel |
| `/sigilconfig starboard` | Configure starboard channel, threshold, emoji |
| `/sigilconfig bump` | Configure DISBOARD bump reminder |
| `/sigilconfig status` | View all current settings for this server |

### 🔨 Moderation
| Command | Description |
|---|---|
| `/ban` | Ban a member with reason |
| `/kick` | Kick a member |
| `/warn` | Issue a warning (logged to case history) |
| `/timeout` | Mute a member for a duration |
| `/unban` | Unban a user |
| `/purge` | Bulk-delete messages |
| `/slowmode` | Set or clear channel slowmode |
| `/history` | View a member's full mod case history |
| `/modlog` | Set the mod log channel |
| `/userinfo` | View detailed member info |
| `/automod` | Configure anti-spam, anti-links, bad words, mention flood |

### ⭐ XP & Leveling
| Command | Description |
|---|---|
| `/xprank [user]` | View your XP rank card |
| `/xpleaderboard` | Top 10 lifetime XP leaderboard |
| `/weeklyleaderboard` | Top earners this week (resets Sunday) |
| `/xpadmin` | Admin XP tools — give, set, setlevel, reset |
| `/levelroles` | Assign roles to auto-grant at XP level thresholds |

### 🎭 Roles
| Command | Description |
|---|---|
| `/autorole add/remove/list/clear` | Auto-assign roles to new members |
| `/reactionroles create/add/remove/post/delete` | Button-based self-assign role panels |

### 🏠 Community
| Command | Description |
|---|---|
| `/welcome set/disable/test/view` | Configure the welcome message and DM system |
| `/giveaway start` | Start a timed giveaway — prize, duration, winner count, role requirement |
| `/giveaway reroll` | Reroll winners for a completed giveaway |
| `/giveaway list` | List active giveaways with jump links |
| `/poll create` | Create a timed poll with up to 10 options |
| `/poll end` | Close a poll early |
| `/ticket open` | Open a private support ticket |
| `/ticket close` | Close a ticket with reason |
| `/ticket list` | List all open tickets |
| `/remind` | Set a personal DM or channel reminder (supports `30m`, `2h`, `1d`) |
| `/rsvp create` | Button-based event RSVP with headcount and 24h reminder |
| `/announce` | Post a formatted announcement embed with role ping |
| `/lfg` | Post a Looking For Group request with game, mode, and player slots |

### ⛪ Church & Spiritual
| Command | Description |
|---|---|
| `/devotional setup` | Schedule daily auto-post with translation, time, timezone, ping |
| `/devotional lookup` | Look up any Bible verse in any supported translation |
| `/devotional queue` | Add a reflection to the devotional queue |
| `/devotional preview` | Preview today's devotional before it posts |
| `/devotional post` | Manually post the devotional now |
| `/devotional list` | View queued reflections |
| `/devotional disable` | Disable the schedule |
| `/sermon` | Post a sermon embed with title, speaker, scripture, video/audio/notes links |
| `/prayer` | Submit or view prayer requests |
| `/volunteer` | Sign up for volunteer slots or view open positions |

> **Bible Translations:** KJV · NIV · ESV · NKJV · NLT · MSG · AMP · WEB
> Powered by [API.Bible](https://scripture.api.bible) (free key) with auto-fallback.

### 🗓️ Scheduling
| Command | Description |
|---|---|
| `/schedule post` | Schedule any message to post at a future time |
| `/schedule list` | View pending scheduled posts |
| `/schedule cancel` | Cancel a pending post by ID |

### 📅 Shifts & Scheduler Bridge
| Command | Description |
|---|---|
| `/myshift setup` | Connect a Sylvia Ross / compatible scheduler (Admin) |
| `/myshift link` | Link your Discord account to your scheduler name |
| `/myshift today` | See your shift today |
| `/myshift week` | See your full week of shifts |
| `/myshift roster` | See everyone's shifts today |
| `/callout` | Submit a callout from Discord directly to the scheduler |
| `/shift` | Manual clock-in / clock-out tracker |

> **Scheduler setup guide:** [SCHEDULER_INTEGRATION.md](SCHEDULER_INTEGRATION.md)

### 🎨 Branding & Graphics
| Command | Description |
|---|---|
| `/embed create` | Open the live embed builder — title, description, color, fields, images, footer |
| `/embed quick` | Instantly send a simple embed to any channel |
| `/brand` | AI-powered full brand kit — logo, colors, fonts, name suggestions |
| `/banner` | Generate a custom canvas server banner |
| `/announcebanner` | Generate a canvas announcement banner |
| `/certificate` | Generate a canvas achievement certificate |
| `/eventbanner` | Generate a canvas event banner |
| `/welcomecard` | Preview or generate a welcome card |
| `/rankcard` | Generate a custom canvas rank card |
| `/profilecard` | Generate a profile card |
| `/namecard` | Generate a name or business card |
| `/splash` | Generate a server splash screen graphic |
| `/sticker` | Create a custom sticker image |
| `/mood` | Generate a mood board or color palette |
| `/palette` | Extract a color palette from an image |
| `/texteffect` | Apply glow, shadow, gradient, or outline to text |
| `/resize` | Resize an image to custom dimensions |
| `/avatar` | View and download a user's full-resolution avatar |
| `/compare` | Compare two users' avatars side by side |
| `/gui open` | Open the Sigil Visual Brand Builder web UI |

### 🔔 Alerts & Integrations
| Command | Description |
|---|---|
| `/twitch add/remove/list` | Subscribe to Twitch live alerts |
| `/youtube add/remove/list` | Subscribe to YouTube upload alerts |

### 📋 Logging & Stats
| Command | Description |
|---|---|
| `/logging set/disable` | Configure server log channel |
| `/stats` | Post weekly server stats on demand |
| `/serverinfo` | View detailed server information |
| `/serverstats` | Live server statistics embed |
| `/eventrecap` | Post a teaser, live banner, or recap for a Discord event |

### 🔧 Utilities
| Command | Description |
|---|---|
| `/ping` | Check bot latency and API response time |
| `/status` | Bot uptime, version, and service status |
| `/customcmd create/edit/delete/list` | Create custom slash-triggered responses |
| `/saveme` | DM yourself a full copy of this server's Sigil config |
| `/help` | Interactive help menu — browse all commands by category |

---

## ⭐ XP Formula

Level `n` requires `5n² + 50n + 100` XP.

| Level | XP Needed |
|---|---|
| 1 | 155 |
| 5 | 475 |
| 10 | 1,100 |
| 20 | 3,100 |

Default: ~15 XP per message, 60s cooldown. Weekly XP resets every Sunday at 00:00 UTC.

---

## 🏗️ Architecture

```
Sigil/
├── src/
│   ├── commands/          # All slash command handlers
│   ├── events/            # Discord gateway events
│   ├── automation/        # Event-driven background handlers
│   ├── services/          # Timed background runners
│   └── utils/             # DB, canvas, XP, AI helpers
├── data/
│   └── sigil.db           # SQLite — auto-created on first run
├── .env                   # Your secrets — never commit this
├── .env.example
├── SCHEDULER_INTEGRATION.md
└── package.json
```

---

## 📄 License

MIT — free to use, modify, and self-host. See [LICENSE](LICENSE).

---

<div align="center">

*Built with ⚡ by [ShadowWalkerNC](https://github.com/ShadowWalkerNC)*

</div>
