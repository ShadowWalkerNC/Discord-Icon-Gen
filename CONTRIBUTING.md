# Contributing to Sigil

Thanks for contributing. Here is the short version of the rules.

---

## Setup

```bash
git clone https://github.com/ShadowWalkerNC/sigil
cd sigil
npm install
cp .env.example .env
# Fill in TOKEN, CLIENT_ID, GEMINI_API_KEY
npm run deploy
npm start
```

---

## Branch naming

- `feat/short-description` — new feature
- `fix/short-description`  — bug fix
- `docs/short-description` — documentation only

---

## Commit style

```
type: short description (under 72 chars)
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## Pull request checklist

- [ ] Passes `npm run deploy` without errors
- [ ] Bot starts without crashing
- [ ] Command tested manually in a Discord server
- [ ] No Discord ToS violations
- [ ] Image uploads go through `validateIconBuffer` / `validateBannerBuffer`
- [ ] Emoji/sticker uploads go through the worker queue
- [ ] Resource pre-checks before creating channels or roles
- [ ] Boost tier gated features degrade gracefully

---

## Adding a new command

1. Create `src/commands/your-command.js`
2. Export `{ data, execute }` where `data` is a `SlashCommandBuilder`
3. Run `npm run deploy` to register it
4. Add it to the command reference table in `README.md`
