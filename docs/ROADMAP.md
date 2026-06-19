# Sigil — Roadmap

> **Vision:** Become the free, open-source "God Mode" layer for Discord — giving every server the visual quality, automation, analytics, and platform reach that Discord's paywall and feature gaps deny them.
>
> **Last updated: 2026-06-18 | Current version: v2.0 | Target: v3.0**

---

## Version Map

| Version | Theme | Status |
|---|---|---|
| v1.0–1.4 | Core branding — icons, banners, brand kits | ✅ Shipped |
| v1.5–1.7 | Nitro-free features — stickers, emotes, cards | ✅ Shipped |
| v1.8 | Extended visuals — reaction packs, profile cards, theme preview | ✅ Shipped |
| v1.9 | Community tools — welcome cards, rank cards, certificates, event banners | ✅ Shipped |
| **v2.0** | **Automation engine — event-driven auto-posting, scheduled posts, webhooks** | 🚧 Next |
| v2.1 | Analytics — server stats, growth cards, activity reports | 📝 Planned |
| v2.2 | Gaming vertical — player cards, team kits, brackets, leaderboards, Rich Presence | 📝 Planned |
| v2.3 | Creator vertical — creator kits, content cards, stream overlays, IRL QR | 📝 Planned |
| v2.4 | Sports & esports — rosters, standings, match results, schedules | 📝 Planned |
| v2.5 | Education — study cards, progress tracking, grade certificates | 📝 Planned |
| v2.6 | Business & org tools — meeting cards, onboarding, policy cards | 📝 Planned |
| v3.0 | Platform — web dashboard, template marketplace, cross-server sync | 🔮 Future |

---

## v2.0 — Automation Engine 🚧 Next

*Turn Sigil from a pull-based tool into push-based server infrastructure.*

### Webhook Integrations
- [ ] **Incoming webhooks** — Twitch live, YouTube upload, GitHub commit → auto-render branded card and post via Discord webhook URL
- [ ] **Outgoing webhook listener** — MEE6 / Tatsu XP events → auto-post `/rankcard` on levelup
- [ ] **`/sigilconfig webhook set`** — admin stores webhook URL per event type in SQLite
- [ ] **`POST /webhook/trigger`** — REST endpoint: receives event payload, validates HMAC secret, renders card, posts to Discord

### Event Triggers
- [ ] **Auto-welcome** — on `guildMemberAdd` → auto-post `/welcomecard` in configured welcome channel
- [ ] **Auto-goodbye** — on `guildMemberRemove` → post a styled goodbye card
- [ ] **Auto-milestone** — on member count hitting 100 / 500 / 1K / 5K → post milestone celebration card
- [ ] **Auto-event-banner** — on Discord Scheduled Event created → auto-generate and post event banner
- [ ] **Auto-event-recap** — on Scheduled Event ended → post recap card with attendee count
- [ ] **Auto-boost-card** — on server boost → post styled thank-you card for the booster

### Scheduled Posts
- [ ] **`/schedule`** — queue any Sigil-generated image to post at a specific date/time in any channel
- [ ] **`/unschedule`** — cancel a pending scheduled post
- [ ] **`/schedulelist`** — view pending scheduled posts
- [ ] **Weekly health report** — every Monday auto-post a server stats embed

### Configuration
- [ ] **`/sigilconfig`** — admin command to configure auto-posting channels, toggle each automation on/off
- [ ] **SQLite persistence** — store automation config and scheduled posts per guild

---

## v2.1 — Analytics & Visibility

*Give admins visibility they've never had for free.*

- [ ] **`/serverstats`** — visual server health card — member count, boost level, channel count, role count, server age, online now
- [ ] **`/growthcard`** — member count trend over 7 / 30 days as a canvas line chart
- [ ] **`/activityreport`** — most active channels and top members this week as a styled PNG
- [ ] **`/invitetracker`** — which invite links are driving joins — visual leaderboard
- [ ] **`/boosthistory`** — timeline of server boosts as a styled card
- [ ] **`GET /api/kit/:id`** — serve a saved brand kit as JSON (for cross-platform use)

---

## v2.2 — Gaming Vertical

*Every gaming server deserves to look like a pro org.*

### Rich Presence Art Assets
- [ ] **`/richpresence asset`** — generate Rich Presence art (512×512 large, 160×160 small) matching server brand kit
- [ ] **`/richpresence preview`** — render Discord UI mockup of full Rich Presence card with custom art
- [ ] **GUI `/richpresence` page** — visual builder for Rich Presence assets with live preview

### Gaming Commands
- [ ] **`/playercard`** — custom stat card — username, rank, K/D or score, hours, game logo
- [ ] **`/teamkit`** — full visual identity kit for a clan or team — logo, banner, jersey colors
- [ ] **`/bracket`** — tournament bracket graphic — single/double elimination, up to 16 teams
- [ ] **`/matchresult`** — post-match result card — scores, teams, MVP highlight
- [ ] **`/leaderboard`** — top-10 visual leaderboard card for any stat
- [ ] **`/gametemplate`** — brand kit presets for popular games: Valorant, Minecraft, CoD, LoL, Fortnite, Apex
- [ ] **`/clanrecruitment`** — styled recruitment post card with requirements and contact info

---

## v2.3 — Creator Vertical

*YouTubers, streamers, and TikTokers deserve Discord servers that match their brand.*

### IRL ↔ URL Mapping (Print-Ready Discord Assets)
- [ ] **`/invitecard qr`** — invite card with QR code — scan at event/LAN → lands in server
- [ ] **`/eventcard poster`** — printable event poster (A4/letter) with QR, event name, date, server invite
- [ ] **`/lancard`** — LAN party / gaming event physical badge with Discord handle + QR code

### Creator Commands
- [ ] **`/creatorkit`** — pull YouTube / Twitch channel dominant colors from URL → generate matching Discord brand kit
- [ ] **`/contentcard`** — "New Video" or "Now Live" announcement card with thumbnail URL, title, platform icon
- [ ] **`/streamoverlay`** — Twitch/Kick panel graphics matching Discord server's brand
- [ ] **`/milestonecard`** — "We hit 10K subs!" celebration graphic for server
- [ ] **`/merchtease`** — product/merch announcement card with image, name, price, link
- [ ] **`/linkinbio`** — styled card with all links (YouTube, Twitch, Twitter, TikTok, Merch, Discord) as shareable PNG

---

## v2.4 — Sports & Esports Vertical

*Free tools for leagues, teams, and tournament organizers.*

- [ ] **`/teamroster`** — visual roster card — team name, players, positions, logo
- [ ] **`/matchschedule`** — weekly match schedule card — matchups, dates, times, venues
- [ ] **`/mvpcard`** — Player of the Week / Match MVP award card
- [ ] **`/seasonstandings`** — visual league standings table as a PNG
- [ ] **`/scoreboard`** — live-style scoreboard card — two teams, score, period/half
- [ ] **`/draftcard`** — player draft pick announcement card

---

## v2.5 — Education Vertical

*Study servers, course communities, and tutoring groups.*

- [ ] **`/studycard`** — study session start card — topic, duration, Pomodoro count
- [ ] **`/progresscard`** — personal goal tracker — subject, progress bar, target date
- [ ] **`/resourcecard`** — clean resource / reading list card for a topic
- [ ] **`/gradecertificate`** — course completion certificate (extension of `/certificate`)
- [ ] **`/studyleaderboard`** — weekly study hours leaderboard visual

---

## v2.6 — Business & Organization Tools

*Discord for teams, companies, and professional communities.*

- [ ] **`/orgtemplate`** — clean, minimal, corporate-ready brand kit
- [ ] **`/meetingcard`** — meeting announcement — time, agenda, host, channel
- [ ] **`/onboardingcard`** — multi-step new member welcome sequence cards
- [ ] **`/reportcard`** — weekly team visual report — tasks, milestones, blockers
- [ ] **`/policycard`** — rules / policy announcement in a clean visual format
- [ ] **`/orgchart`** — simple visual org chart — roles, hierarchy, names

---

## v3.0 — Platform Layer

*Sigil becomes infrastructure, not just a bot.*

- [ ] **Public web dashboard** — hosted GUI anyone can use without self-hosting the bot
- [ ] **Template marketplace** — community-submitted templates with approval workflow
- [ ] **Cross-server brand sync** — push one brand kit to multiple servers simultaneously
- [ ] **Server structure backup/restore** — export full channel/role/permission layout as JSON, restore to new server
- [ ] **Brand versioning** — save multiple named brand kit versions per server
- [ ] **CI/CD pipeline** — GitHub Actions for lint + test + deploy on push to main

---

## Ongoing / Infrastructure

- [ ] **SQLite database layer** — replace file-based history with persistent per-guild storage
- [ ] **Per-user rate limiting** — cooldowns on AI and heavy canvas commands
- [ ] **Error monitoring** — structured logging or Sentry
- [ ] **`/help` dynamic rebuild** — auto-generate from command metadata, always current
- [ ] **Font expansion** — additional Google Fonts bundled
- [ ] **Mobile GUI improvements** — better sidebar collapse and touch UX

---

## Discord API Surface — Unexploited Opportunities

Things the Discord API fully supports that almost no free tool uses well:

| API Feature | Sigil Opportunity |
|---|---|
| `guildMemberAdd` / `Remove` events | Auto-welcome and goodbye cards |
| Scheduled Events API | Auto-generate banners, post recaps |
| Guild Templates API | Export / restore full server structure |
| Webhooks | External trigger → branded post (Twitch, YouTube, GitHub) |
| Auto-mod API | Visual moderation reports |
| Forum Channels | Auto-header cards for structured communities |
| Stage Channel events | Auto-speaker cards |
| Voice State events | Live activity cards "Now in voice: X members" |
| Invite tracking | Which links drive joins — visual breakdown |
| Audit Log API | Weekly moderation activity visual report |
| **Rich Presence SDK** | Generate Rich Presence art assets (512×512, 160×160) for Discord-connected games |
| **Guild Invites + QR** | Print-ready IRL→URL bridge assets (invite cards, event posters, LAN badges) |
