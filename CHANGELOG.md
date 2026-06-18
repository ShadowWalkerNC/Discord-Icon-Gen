# Changelog

All notable changes to **Sigil** are documented here.

Format: [Semantic Versioning](https://semver.org/) — `[version] — YYYY-MM-DD`

---

## [1.11.0] — 2026-06-18

### Added
- **`/palette export`** slash command — export a brand palette in developer-ready formats
  - `format` *(required)*: CSS Variables, Tailwind Config, or Hex List
  - `primary` / `secondary` / `color3` / `color4` / `color5` \u2014 optional manual hex inputs with color autocomplete
  - If no colors are provided, automatically loads primary + secondary + palette from the user’s last kit in history
  - **CSS Variables** — outputs a `:root { }` block with `--primary`, `--secondary`, `--palette-N` custom properties
  - **Tailwind Config** — outputs a `tailwind.config.js` `theme.extend.colors` block with kebab-case keys
  - **Hex List** — one labeled `name: #HEX` line per color, plain text
  - Result returned as ephemeral embed with syntax-highlighted code block
  - Invalid hex inputs are silently skipped (non-fatal)
- `src/commands/palette.js` — new command file, auto-registered by `src/index.js` glob

---

## [1.10.0] — 2026-06-18

### Added
- **`/brand share`** subcommand — generates a shareable GUI link pre-loaded with the user’s most recent kit from history
  - Builds a base64 URL hash matching the GUI’s own `HASH_KEYS` encoding so the link restores state exactly
  - Returns an ephemeral embed with a clickable **Open in Visual Builder** link and a summary of the loaded kit
  - Falls back with a helpful error if no history entry exists yet
- `/brand kit` and `/brand ai` footers now hint at `/brand share`

---

## [1.9.0] — 2026-06-18

### Added
- **`/template`** slash command — 8 built-in brand templates, full kit render, history save

---

## [1.8.0] — 2026-06-18

### Added
- **Shape-aware borders** — `neon` and `rainbow` border styles added; all borders trace shape path
- Total border styles: **8** (was 6)

---

## [1.7.0] — 2026-06-18

### Added
- **12 missing named background presets** — total now **32** (was 20)

### Fixed
- `bg-image-1` and `bg-image-2` now use fixed coordinate arrays (deterministic output)

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
- Core utils: `gemini.js`, `history.js`, `backgrounds.js`, `borders.js`, `canvas.js`, `fonts.js`

---

## [1.1.0] — 2026-06-15

### Added
- `/banner`, `/logo`

### Changed
- `/icon` — added font, glow, and opacity options

---

## [1.0.0] — 2026-06-14

### Added
- Initial release: `/icon`, `/help`, Discord.js v14 framework
