# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [1.3.0] — 2026-06-17

### Added
- `gui/gui-server.js` — lightweight Node HTTP bridge server (v1.2.1) with endpoints:
  `GET /`, `GET /health`, `POST /preview`, `POST /generate`, `POST /webhook-register`
- `gui/sigil-gui-builder.html` — fully self-contained visual brand builder GUI:
  54-colour swatch picker, 12 background presets, gradient toggle, 6 border modes,
  glow slider, 6 font options, live preview panel, Discord embed mockup,
  Gemini API integration, PNG download tray
- `/gui open` and `/gui status` Discord slash commands
- `src/utils/canvas.js` — `getAllFontFamilies()` export for GUI font picker
- `src/utils/fonts.js` — full 6-font registry (`another-danger`, `bebas-neue`,
  `oswald`, `playfair`, `dancing-script`, `source-code-pro`) with stub detection
  (files < 1 KB are skipped with a warning and fall back to `another-danger`)
- `getAllFontOptions()` export in `fonts.js` for GUI full font picker (shows all
  registered fonts regardless of stub status)
- `docs/FONTS.md` — font download sources, licence info, and one-shot `curl` install script
- `GUI_PORT` and `GUI_PUBLIC_URL` environment variables (documented in `.env.example`)
- `npm run gui` and `npm run gui:dev` scripts in `package.json`
- `/brand` and `/mood` added as saveable commands in `/saveme`

### Fixed
- `gui/gui-server.js` `POST /generate`: variable scoping bug where `opts` was
  declared with `const` then referenced in a nested spread, causing a ReferenceError.
  Fixed by splitting into `baseOpts` + `finalOpts`.
- `src/utils/canvas.js`: `preview.js` called `getAllFontFamilies?.()` but the
  function was never exported — always returned `[]` and fell back to `monospace`.
  Function now properly exported.

---

## [1.2.0] — 2026-06-16 (ShadowWalkerNC fork)

### Added
- `/banner` command — generates 1024×320 server banners with optional subtitle
- `/avatar` command — overlays text and glow on the user's Discord avatar, with optional circular crop
- `/logo` command — generates 512×512 transparent PNG logos with optional circle ring or underline decoration
- `/help` command — in-Discord command reference (ephemeral)
- `src/utils/fonts.js` — centralized font registry; adding new fonts requires one file and one config entry
- `DEPLOY_MODE` environment variable — supports `guild` (instant, dev) and `global` (production) command registration
- `.gitignore` — excludes `.env`, `node_modules/`, logs, and build output
- `.env.example` — documented template for all required environment variables
- `CONTRIBUTING.md` — contributor guide with command and font addition templates
- `CHANGELOG.md` — this file
- GitHub issue templates for bug reports and feature requests

### Changed
- `src/index.js` — commands now cached at startup via `Collection`; intents scoped to `Guilds` only
- `src/events/ready.js` — upgraded to REST API v10; uses command cache; respects `DEPLOY_MODE`
- `src/commands/icon.js` — added input validation, font registry integration, structured error handling
- `package.json` — added missing `@discordjs/builders` and `@discordjs/rest` dependencies; added `start` and `dev` scripts
- `README.md` — full rewrite with setup guide, all commands documented, fork attribution

### Fixed
- Typo `"Recieved"` in unhandledRejection log corrected to `"Rejection"`
- Commands no longer re-required from disk on every interaction (performance fix)

---

## [1.0.0] — 2024-02-24 (Original by NoVa-Gh0ul)

### Added
- Initial release
- `/icon` command — generates 400×400 profile icons with text, color, glow, and background options
- Dynamic command and event loader
- `canvas` integration for image generation
- `dotenv` for environment variable management

---

*Original repository: [NoVa-Gh0ul/Discord-Icon-Gen](https://github.com/NoVa-Gh0ul/Discord-Icon-Gen)*
