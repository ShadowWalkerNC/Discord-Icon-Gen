# Sigil — Roadmap

> Planned features and improvements. Items are loosely prioritized top-to-bottom within each section.
>
> **Last updated: 2026-06-18 | Current version: 1.4.0**

---

## GUI Enhancements

- [ ] **Icon shape selector** — circle, rounded square, shield, hexagon, diamond clipping masks
- [ ] **Gradient direction control** — angle slider for the color overlay gradient
- [ ] **Pattern overlays** — subtle textures (noise, grid, halftone) layered on backgrounds
- [ ] **Font expansion** — add more Google Fonts or bundled options beyond the current 8
- [ ] **Template categories / filter** — filter template grid by tag (Fantasy, Sci-Fi, Community, etc.)
- [ ] **Custom template save** — allow users to save their own configuration as a named template
- [ ] **Undo/redo history** — step backwards through state changes in the GUI
- [ ] **Mobile layout improvements** — better sidebar collapse and touch UX on small screens

## Bot Commands

- [ ] **`/help` refresh** — update to reflect all v1.4.0 features, GUI templates, and size presets
- [ ] **`/template`** — slash command to load any of the 8 built-in templates directly from Discord
- [ ] **`/brand share`** — generates a shareable GUI link pre-loaded with current kit settings
- [ ] **`/minecraft`** — Discord ↔ Minecraft bridge setup helper and DiscordSRV configuration guide
- [ ] **`/palette export`** — export palette as CSS variables, Tailwind config, or hex list

## Infrastructure

- [ ] **DiscordSRV integration guide** — `docs/MINECRAFT.md` with step-by-step setup for Demonfall
- [ ] **Database layer** — replace file-based history/saveme with SQLite or a hosted DB
- [ ] **Rate limiting** — per-user cooldowns on AI Generate commands
- [ ] **Error monitoring** — structured logging or Sentry integration
- [ ] **CI/CD** — GitHub Actions workflow for lint + deploy on push to main

## Stretch Goals

- [ ] **Public web version** — hosted GUI anyone can use without self-hosting
- [ ] **Template marketplace** — community-submitted templates with approval workflow
- [ ] **Animated banners** — GIF output for banners using canvas frame rendering
- [ ] **Brand versioning** — save multiple named versions of a brand kit per server
