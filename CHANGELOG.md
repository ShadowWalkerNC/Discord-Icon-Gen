# Changelog

All notable changes to **Sigil** are documented here.

Format: [Semantic Versioning](https://semver.org/) — `[version] — YYYY-MM-DD`

---

## [Unreleased — v2.0.0 in progress]

### Added
- **`gui/developers.html`** — Developers page with API reference, navbar link on all GUI pages
- **`gui/sigil-community.html`** — Community Tools page (welcome cards, rank cards, server stats)
- **`gui/404.html`** — Branded 404 error page matching Sigil dark theme
- **`/setup` route** — `setup.html` now served at `/setup` instead of being orphaned in root
- **`express-rate-limit`** — 20 requests/minute per IP on all `/preview/*` canvas routes
- **`safeText()`** — Input sanitizer strips control characters from all user text fields
- **`docs/API.md`** — Full GUI server API reference

### Changed
- **AI Generate disabled** — `/generate` endpoint returns 503 Coming Soon; GUI button and textarea disabled with Coming Soon banner
- **Node engine** bumped from `>=18 <19` to `>=20 <23` (Node 18 is EOL)
- **`.gitignore`** — Added `.env.local`, `.env.*.local`, editor dirs (`.vscode/`, `.idea/`)
- **`package.json`** — Added `express-rate-limit` dep, `eslint` devDep, `lint` and `test` scripts
- **README** — Updated version, file tree, GUI feature list (AI status), Node prerequisite, badges
- **`docs/CONTEXT.md`** — Updated to v2.0.0 state

### Fixed
- **Brand Builder → Community** nav link corrected from `/` to `/brand`
- **404 catch-all** added to `gui-server.js` — unknown routes now return HTTP 404 with branded page instead of raw Express error
- **Color autocomplete — all commands** — replaced broken `colorAutocomplete(interaction)` call (which referenced a non-existent export) with correct `getColorAutocomplete(focused)` pattern across all 21 commands that use color options: `announcebanner`, `avatar`, `banner`, `brand`, `certificate`, `compare`, `eventbanner`, `icon`, `invitecard`, `logo`, `namecard`, `palette`, `profilecard`, `rankcard`, `reactionpack`, `rolebadge`, `servercard`, `splash`, `sticker`, `texteffect`, `themepreview`, `welcomecard`

---

## [1.11.1] — 2026-06-18

### Removed
- **`/minecraft`** command and `docs/MINECRAFT.md` — removed from bot; guide available separately if needed

---

## [1.11.0] — 2026-06-18

### Added
- **`/palette export`** slash command — CSS Variables, Tailwind Config, Hex List formats; auto-loads last kit from history if no colors provided

---

## [1.10.0] — 2026-06-18

### Added
- **`/brand share`** subcommand — shareable GUI link pre-loaded from last kit via base64 URL hash

---

## [1.9.0] — 2026-06-18

### Added
- **`/template`** slash command — 8 built-in brand templates, full kit render, history save

---

## [1.8.0] — 2026-06-18

### Added
- Shape-aware borders; `neon` and `rainbow` border styles; total: **8**

---

## [1.7.0] — 2026-06-18

### Added
- 12 missing named background presets; total: **32**

### Fixed
- `bg-image-1` / `bg-image-2` now deterministic (fixed coordinates)

---

## [1.6.1] — 2026-06-18

### Added
- `/compare` and `/avatar` shape options

---

## [1.6.0] — 2026-06-18

### Added
- `shape` option on `/icon`, `/logo`, `/random`

---

## [1.5.1] — 2026-06-18

### Added
- `applyShapeClip()` in `canvas.js`, `safeShape()` in `gui-server.js`

---

## [1.5.0] — 2026-06-18

### Added
- Icon Shape Selector in GUI, shape in URL hash and Config JSON, shape defaults on all 8 templates

---

## [1.4.0] — 2026-06-18

### Added
- 8 brand templates, 7 size presets, URL hash share, Randomize, theme toggle, health pill, Export dialog

---

## [1.3.0] — 2026-06-17

### Added
- GUI Visual Builder, `railpack.json`, `railway.toml`

---

## [1.2.0] — 2026-06-16

### Added
- `/brand ai`, `/brand kit`, `/mood`, `/compare`, `/random`, `/preview`, `/saveme`, `/history`, `/avatar`

---

## [1.1.0] — 2026-06-15

### Added
- `/banner`, `/logo`, font/glow/opacity on `/icon`

---

## [1.0.0] — 2026-06-14

### Added
- Initial release: `/icon`, `/help`, Discord.js v14 framework
