# Sigil — Daily Task Tracker
> UPA Master Plan · Updated June 2026

This file is the single source of truth for active work on Sigil.
Update it every session. Commit it with your work.

---

## 🗓️ How to Use This File

1. At the start of each session, check **Current Sprint** below.
2. Pick the next unchecked task.
3. Do the work, commit it, check the box.
4. If you discover new issues, add them to the correct phase.
5. At end of session, note what's blocked and why.

---

## ✅ Phase 1 — Stop the Bleeding *(COMPLETE)*

- [x] Fix all wrapper files to use `impl.data` instead of re-declaring SlashCommandBuilder
- [x] Fix `/announce` double-reply bug (deferReply + editReply pattern)
- [x] Add global try/catch error handler in `interactionCreate` event
- [ ] **Re-register slash commands with Discord** ← DO THIS FIRST each new deploy
  - Run: `node scripts/deploy-commands-standalone.js`
  - Or hit: `POST /api/control/deploy-commands` with `CONTROL_SECRET` header
  - Must do this after any push that adds/changes command options
- [ ] Confirm SQLite WAL mode is active (`PRAGMA journal_mode=WAL` in db.js)
- [ ] Mount Railway volume for `/data` so `sigil.db` survives redeploys

---

## 🟡 Phase 2 — Stability & Observability *(Current Sprint)*

### Goal: Every command responds correctly. No silent failures. Data is safe.

- [ ] **Live test all commands** — go through each package and report status
  - [ ] `/mood` — returns verse embed with mood choices
  - [ ] `/bible` — returns verse
  - [ ] `/devotional` — returns devotional
  - [ ] `/sermon` — responds correctly
  - [ ] `/saveme` — AI response, no timeout
  - [ ] `/palette` — AI palette, no timeout
  - [ ] `/history` — mod history embed
  - [ ] `/poll` — creates poll with options
  - [ ] `/giveaway` — creates giveaway
  - [ ] `/ticket` — opens ticket flow
  - [ ] `/xprank` — returns rank card
  - [ ] `/xpleaderboard` — returns leaderboard
  - [ ] `/xpadmin` — admin controls work
  - [ ] `/serverstats` — returns stats embed
  - [ ] `/announce` — posts once, confirms ephemerally
  - [ ] `/sigilconfig status` — full status embed
- [ ] Audit `src/events/` — confirm interactionCreate handles buttons + modals
- [ ] Audit `tools/` directory — document what's in there
- [ ] Live test CulinaryOS bridge — is `CULINARYOS_API_URL` live?
- [ ] Live test Post-Pilot bridge — is it reachable?
- [ ] Live test Twitch poller — does it fire and post embeds?
- [ ] Live test YouTube poller — does it fire and post embeds?
- [ ] Add `pino` or structured logging — replace `console.log` calls
- [ ] Add startup schema validator — throw on boot if wrapper doesn't use impl.data

---

## 🟠 Phase 3 — Discord-Native UX *(Queued)*

### Goal: Rich cards + buttons replace all flat command responses.

**Decisions needed before starting:**
- [ ] Ticket flow: private thread or new channel? (ask owner)
- [ ] Ticket claim feature: yes or no? (ask owner)
- [ ] Welcome DM buttons: what labels? (ask owner)

**Tasks:**
- [ ] Build centralized button + modal router in `src/events/interactionCreate.js`
- [ ] `/ticket` — open card + Claim / Close / Escalate buttons, private thread
- [ ] `/giveaway` — Enter Giveaway button, DB-tracked entries, winner embed
- [ ] `/welcome` DM — card with Get Roles / Open Ticket / Read Rules buttons
- [ ] `/rsvp` — Going / Not Going / Maybe buttons on event card
- [ ] `/volunteer` — Sign Up button, roster in DB
- [ ] `/shift` — Clock In / Clock Out buttons on roster card
- [ ] `/saveme` — Pray with Me / Share buttons on response
- [ ] `/poll` — upgrade to native Discord poll API or button-based voting
- [ ] Remove `/setup` GUI wizard page (replaced by `/sigilconfig`)
- [ ] Add `/gui` bot command — ephemeral card linking to hero, brand builder, status

---

## 🟢 Phase 4 — Voice & Sermon *(Queued)*

### Goal: Audio works. /sermon runs on Stage channels.

- [ ] Decide audio library: `discord-player` vs Lavalink vs `@discordjs/voice` direct
- [ ] Wire chosen library into `/play`, `/queue`, `/nowplaying`
- [ ] Test ASCILINE stream end-to-end
- [ ] `/sermon` — bot joins Stage channel as speaker
- [ ] `/sermon` — posts live embed with service info + speaker name
- [ ] Explore Discord Activity SDK — prototype brand builder as in-Discord overlay

---

## 🔵 Phase 5 — Webhooks & Integrations *(Queued)*

### Goal: All external integrations tested and documented.

- [ ] Audit all webhook handlers in `src/automation/`
- [ ] Confirm Twitch `twitch.live` event posts correct embed
- [ ] Confirm YouTube `youtube.upload` event posts correct embed
- [ ] Confirm GitHub `github.push` event posts correct embed
- [ ] Add Discord-native channel webhook creation (bot creates webhook for services)
- [ ] Evaluate: TikTok live, Kick, Patreon, Ko-fi handlers
- [ ] Update `/developers` page with curl examples for every endpoint
- [ ] Document HMAC signing flow with working curl example

---

## 🟣 Phase 6 — Public Release Hardening *(Queued)*

### Goal: Safe to invite to any server. Ready for Discord bot verification.

- [ ] Secret scanning in CI (GitHub Actions — block commits with exposed tokens)
- [ ] Rate limiting per guild for public bot abuse prevention
- [ ] Multi-server isolation audit — no guild reads another guild's data
- [ ] Privacy Policy page (required for Discord verification)
- [ ] Terms of Service page (required for Discord verification)
- [ ] CHANGELOG accurate for v1.0
- [ ] README final pass for v1.0
- [ ] Submit bot for Discord verification
- [ ] Add bot to top.gg and discordbotlist.com

---

## 🚨 Known Issues & Blockers

| Issue | Severity | Status |
|---|---|---|
| Slash commands need re-registration after Phase 1 fixes | 🔴 Critical | Pending — run deploy script |
| SQLite on Railway ephemeral disk — data loss on redeploy | 🔴 Critical | Pending volume mount |
| No observability — failures are invisible in production | 🟠 High | Partial — error handler added |
| CulinaryOS bridge status unknown | 🟡 Medium | Needs live test |
| Post-Pilot bridge status unknown | 🟡 Medium | Needs live test |
| Music commands stubbed — no audio library wired | 🟡 Medium | Phase 4 |

---

## 📋 Daily Session Checklist

Run through this at the start of every work session:

```
□ Check Railway deploy — is the bot online?
□ Check /health endpoint — https://sigil.up.railway.app/health
□ Check Discord — does /ping respond?
□ Open TASKS.md — pick next unchecked item in current sprint
□ Do the work
□ Commit with a clear message (feat/fix/docs: description)
□ If command options changed → run deploy-commands script
□ Update TASKS.md — check completed items, add new discoveries
□ Push to main
```

---

## 🏁 Definition of Done — v1.0

- [ ] All commands respond correctly in production
- [ ] No silent timeouts anywhere
- [ ] Data persists across Railway redeploys
- [ ] Global error handler catches all failures visibly
- [ ] All Phase 3 interactive flows (buttons/modals) live
- [ ] Voice + sermon working
- [ ] All webhook integrations tested
- [ ] Privacy Policy + ToS pages live
- [ ] README accurate
- [ ] CHANGELOG complete
- [ ] Discord bot verification submitted

---

*Last updated: June 2026 — UPA Master Plan v1.0*
