# Changelog

All notable changes to **Sigil** are documented here.

Format: [Semantic Versioning](https://semver.org/) — `[version] — YYYY-MM-DD`

---

## [1.10.0] — 2026-06-18

### Added
- **`/brand share`** subcommand — generates a shareable GUI link pre-loaded with the user’s most recent kit from history
  - Reads the top entry from `data/history/<userId>.json` via `loadHistory`
  - Builds a base64 URL hash matching the GUI’s own `HASH_KEYS` encoding so the link restores state exactly
  - Returns an ephemeral embed with a clickable **Open in Visual Builder** link and a summary of the loaded kit
  - Falls back with a helpful error if no history entry exists yet
  - Works with kits from any command: `/brand kit`, `/brand ai`, `/template`, `/icon`, etc.
- `/brand kit` and `/brand ai` footers now hint at `/brand share`

---

## [1.9.0] — 2026-06-18

### Added
- **`/template`** slash command — load any of the 8 built-in brand templates directly from Discord and instantly receive a full rendered kit (icon + banner + palette)
  - `name` option: dropdown of all 8 templates with genre label (e.g. `Demonfall — Dark Fantasy`)
  - `icon_text` option: optional override for the icon initials (default: template default, max 4 chars)
  - `brand_name` option: optional override for the brand name shown in the embed title
  - Templates mirror the GUI exactly: same colors, background, border, font, glow, opacity, and shape per template
  - Result saved to per-user command history via `saveEntry`
  - Embed footer hints at `/gui open` for further customisation in the Visual Builder
- `src/commands/template.js` — new command file, auto-registered by `src/index.js` glob

---

## [1.8.0] — 2026-06-18

### Added
- **Shape-aware borders** — all border styles in `src/utils/borders.js` now receive the active `shape` and trace the correct silhouette path (circle, rounded, hexagon, diamond, square) instead of always drawing a rectangle
- **`neon` border style** — animated-look multi-layer neon glow that pulses outward along the shape edge
- **`rainbow` border style** — conic-gradient rainbow stroke traced along the shape path
- Total border styles: **8** (was 6)

### Changed
- `renderIcon` in `canvas.js` passes `shape` through to `getBorderById().draw()` for all border types
- GUI border chip list and `/help` updated to include `neon` and `rainbow`

---

## [1.7.0] — 2026-06-18

### Added
- **12 missing named background presets** in `src/utils/backgrounds.js` — these IDs were referenced by GUI templates and the Gemini AI prompt but had no `draw()` implementation (silently fell back to `solid-black`):
  - `midnight-gradient` — 3-stop deep-purple linear gradient
  - `deep-space` — dark base + deterministic star field + nebula radial glow
  - `inferno` — bottom-up fire gradient + heat shimmer radial
  - `ocean-depth` — deep-blue linear gradient + caustic light ray strokes
  - `twilight` — 4-stop dusk vertical (indigo → magenta → orange)
  - `aurora` — dark base + 3 overlapping radial aurora band glows
  - `storm` — grey radial vortex + faint lightning bolt stroke
  - `void` — pure black + subtle dark radial vignette + distant star pinpricks
  - `neon-city` — sky gradient + building silhouettes + 3 neon radial glows
  - `sunset-fade` — 5-stop sunset sky + sun disc radial highlight
  - `forest-night` — dark sky + moon glow radial + 10 deterministic tree silhouettes
  - `polar` — ice-blue sky gradient + aurora shimmer + snow ground ellipse
- Total background count: **32** (was 20)

### Fixed
- `bg-image-1` (Abstract Mesh) and `bg-image-2` (Neon Lines) previously used `Math.random()` for positions, producing different output on every render. Both now use **fixed coordinate arrays** for deterministic, consistent output.

---

## [1.6.1] — 2026-06-18

### Added
- **`/compare`** — `shape_a` and `shape_b` options (Circle / Rounded / Square / Hexagon / Diamond); each design renders with its own independent shape clip
- **`/avatar`** — `shape` option (defaults to `circle`); overlay image is now clipped to the **same shape** as the base icon using `applyShapeClip` — previously the overlay was always circle-cropped regardless of shape

### Changed
- `/compare` embed fields expanded from single-line to 3-line breakdown (text, shape, BG/border)
- `/compare` gap background darkened from `#000000` to `#111111`
- `/avatar` now imports `applyShapeClip` from `canvas.js` instead of inlining a hardcoded circle clip

---

## [1.6.0] — 2026-06-18

### Added
- **`shape` option** added to `/icon`, `/logo`, `/random` slash commands
  - Choices: Circle, Rounded, Square, Hexagon, Diamond
  - `/random` picks a shape automatically and displays it in the result embed
  - Shape label shown as embed field in `/icon` and `/logo` replies
  - Shape saved to per-user command history
- **`/help`** updated to document `shape` option on all relevant commands
- **`SHAPE_CHOICES`** constant shared across command files

---

## [1.5.1] — 2026-06-18

### Added
- **`applyShapeClip(ctx, W, H, shape)`** exported from `src/utils/canvas.js`
- **`safeShape(s)`** validator in `gui/gui-server.js`

### Changed
- `renderIcon` in `canvas.js` now accepts a `shape` option
- `/preview` and `/generate` endpoints updated for shape support
- Health endpoint version bumped to `1.5.1`

---

## [1.5.0] — 2026-06-18

### Added
- **Icon Shape Selector** in GUI Step 3
- **Shape persisted in URL hash**
- **Shape included in exported Config JSON**
- All 8 brand templates declare a `shape` default
- **Randomize** now picks a random shape

---

## [1.4.0] — 2026-06-18

### Added
- **8 brand templates** in GUI Step 1
- **7 output size presets** in GUI Step 3
- **URL hash share/restore**
- **Randomize button**
- **Light/dark theme toggle**
- **Server health pill**
- **Export dialog**
- **Copy JSON** button

---

## [1.3.0] — 2026-06-17

### Added
- **GUI Visual Builder** (`gui/`)
- **`railpack.json`** and **`railway.toml`**

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
