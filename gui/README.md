# Sigil GUI Server

The web dashboard and API bridge for Sigil. Serves all GUI pages and exposes authenticated REST + WebSocket endpoints for the bot and external integrations.

---

## Quick Start

```bash
# From the repo root:
node gui/gui-server.js

# Or via npm:
npm run gui
```

Open **http://localhost:8080** in your browser.

Set `GUI_AUTH_TOKEN` in your environment before starting — the server will block all `/api/*` requests with `503` if it's not set.

---

## Pages

| Route | File | Auth required |
|---|---|---|
| `/` | `index.html` | No |
| `/brand` | `sigil-gui-builder.html` | No (API calls need auth) |
| `/community` | `sigil-community.html` | No (API calls need auth) |
| `/status` | `status.html` | No (API calls need auth) |
| `/packages` | `packages.html` | No (API calls need auth) |
| `/developers` | `developers.html` | No |
| `/setup` | `setup.html` | No |
| `/login` | `login.html` | No (it IS the auth page) |
| `/health` | — | No (used by Railway health checks) |

---

## Authentication

All `/api/*` and `/preview/*` routes require a valid token. The client-side `auth.js` helper handles this automatically.

### How it works

1. On page load, `auth.js` checks `sessionStorage` for a saved token.
2. If no token exists, the browser is redirected to `/auth/discord`.
3. `/auth/discord` redirects to Discord OAuth if `DISCORD_OAUTH_URL` is set, or to `/login` (token entry page) if not.
4. After successful login the token is stored in `sessionStorage`. All subsequent API calls inject it automatically.

### Token injection

- **POST / PUT / DELETE** → `Authorization: Bearer <token>` header
- **GET** → `?token=<token>` query parameter
- **WebSocket** → `?token=<token>` on the upgrade URL

### OAuth flow (Discord)

If `DISCORD_OAUTH_URL` is configured:

```
Browser → /auth/discord → Discord OAuth consent → /auth/discord/callback → page with ?token= set
```

The callback exchanges the Discord OAuth code for a user identity, then issues the shared `GUI_AUTH_TOKEN` as the session token. All authenticated users share the same token — this keeps the auth model simple for self-hosted deployments.

### Token-only fallback (no OAuth)

If `DISCORD_OAUTH_URL` is not set, `/auth/discord` redirects to `/login` — a styled form where you enter `GUI_AUTH_TOKEN` directly.

---

## API Reference

### Public endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | `{ ok, version, bot_ready }` — Railway health check |
| `GET` | `/auth.js` | Client-side auth helper script |
| `GET` | `/auth/discord` | Redirect to Discord OAuth or `/login` |
| `GET` | `/auth/discord/callback` | OAuth code exchange — issues session token |
| `POST` | `/auth/token` | Validate a token directly (used by `login.html`) |
| `POST` | `/webhook/trigger` | External webhook trigger (HMAC-signed) |

### Authenticated endpoints (`/api/*`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/status/full` | Bot + GUI + service health aggregate |
| `GET` | `/api/logs` | Merged log tail (`?tail=50&level=error`) |
| `GET` | `/api/packages` | Package states for a guild (`?guild_id=`) |
| `POST` | `/api/packages` | Enable or disable a package |
| `POST` | `/api/setup/validate-token` | Validate a Discord bot token |
| `POST` | `/api/setup/save-config` | Save setup wizard config to SQLite |
| `GET` | `/api/media/status` | ASCILINE media player status |
| `GET` | `/api/media/queue` | ASCILINE queue contents |
| `POST` | `/api/media/enqueue` | Add media URL to queue |
| `POST` | `/api/media/skip` | Skip current media |
| `POST` | `/api/media/stop` | Stop playback |
| `POST` | `/api/media/seek` | Seek to time (`{ time: seconds }`) |
| `POST` | `/api/media/volume` | Set volume (`{ vol: 0-5 }`) |
| `POST` | `/api/media/loop` | Toggle loop (`{ enabled: bool }`) |
| `POST` | `/api/media/mode` | Set render mode (`{ mode: 1-5 }`) |
| `POST` | `/api/media/cols` | Set column width (`{ cols: 40-500 }`) |
| `POST` | `/api/control/restart` | Graceful restart (requires `x-control-secret`) |
| `POST` | `/api/control/deploy-commands` | Re-register slash commands (streaming NDJSON) |

### Preview endpoints (auth required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/preview` | Render brand icon + banner + palette |
| `POST` | `/preview/welcome` | Render welcome card |
| `POST` | `/preview/rankcard` | Render XP rank card |
| `POST` | `/preview/serverstats` | Render server stats card |

### WebSocket

| Path | Description |
|---|---|
| `/ws/logs` | Live log stream. Auth via `?token=`. Optional `?level=info\|warn\|error` |

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `GUI_AUTH_TOKEN` | Shared secret for all GUI API access. Generate with `openssl rand -hex 32`. |

### Discord OAuth (recommended for production)

| Variable | Description |
|---|---|
| `DISCORD_CLIENT_ID` | Your Discord application's client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 secret from Discord Dev Portal → OAuth2 tab |
| `DISCORD_REDIRECT_URI` | Must match exactly: `https://YOUR-DOMAIN/auth/discord/callback` |
| `DISCORD_OAUTH_URL` | Full authorization URL from Discord Dev Portal → OAuth2 → URL Generator (scope: `identify`) |

If these are not set, the `/login` token-entry page is used as a fallback.

### Bot & server

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token — required to start the bot process |
| `CLIENT_ID` | Discord application client ID |
| `PORT` | HTTP port (default `8080`). Railway sets this automatically. |
| `CONTROL_SECRET` | Enables `/api/control/restart` and `/api/control/deploy-commands` |

### Optional features

| Variable | Description |
|---|---|
| `STREAM_SERVER_URL` | ASCILINE media server URL (default `http://127.0.0.1:8000`) |
| `GEMINI_API_KEY` | Google Gemini — enables AI brand generation |
| `YOUTUBE_API_KEY` | Enables YouTube upload alert polling |
| `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` | Enables Twitch live alert polling |
| `BIBLE_API_KEY` | Enables daily devotionals via API.Bible |

---

## Railway Deployment

### 1. Set environment variables

In your Railway project → **Variables** tab, add at minimum:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-client-id
GUI_AUTH_TOKEN=<openssl rand -hex 32>
CONTROL_SECRET=<openssl rand -hex 32>
```

For OAuth login add:

```
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-oauth2-secret
DISCORD_REDIRECT_URI=https://your-railway-domain.up.railway.app/auth/discord/callback
DISCORD_OAUTH_URL=https://discord.com/oauth2/authorize?client_id=YOUR_ID&response_type=code&redirect_uri=ENCODED_REDIRECT&scope=identify
```

### 2. Discord Dev Portal — register the redirect URI

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → your app
2. **OAuth2** tab → **Redirects** → add: `https://your-railway-domain.up.railway.app/auth/discord/callback`
3. Copy **Client Secret** → set as `DISCORD_CLIENT_SECRET`
4. **OAuth2 URL Generator** → select scope `identify` → copy the URL → set as `DISCORD_OAUTH_URL`

### 3. Deploy

Push to `main` — Railway auto-deploys. No build step required.

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| `/preview/*` | 20 req/min |
| `/api/*` | 60 req/min |
| `/api/media/*` | 30 req/min |
| `/api/control/*` | 5 req/min |
| `/api/setup/*` | 10 req/min |
| `/auth/token`, `/auth/discord/callback` | 10 req/min |
| `/webhook/trigger` | 60 req/min |

---

## Files

| File | Purpose |
|---|---|
| `gui-server.js` | Main Express server — routes, middleware, WebSocket |
| `auth.js` | Client-side session helper — token bootstrap, `authFetch()` |
| `login.html` | Token-entry fallback login page |
| `index.html` | Home / marketing landing page |
| `sigil-gui-builder.html` | Brand builder live canvas GUI |
| `sigil-community.html` | Community tools GUI |
| `status.html` | Real-time status dashboard |
| `packages.html` | Feature package toggle panel |
| `developers.html` | Developer API reference |
| `setup.html` | First-time setup wizard |
| `404.html` | Custom 404 page |
| `js/` | Shared client-side scripts |
