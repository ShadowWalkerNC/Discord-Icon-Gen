# Sigil GUI Server — API Reference

Base URL: your Railway deployment URL (e.g. `https://sigil-gui.up.railway.app`)

All POST endpoints accept and return `application/json`.

Rate limits (per IP per minute):
| Limit | Applies to |
|---|---|
| 20 req/min | All `/preview/*` canvas render endpoints |
| 30 req/min | All `/api/media/*` endpoints |
| 60 req/min | `/api/packages`, `/api/logs`, `/api/status/full`, `/api/media/status`, `/api/media/queue` |
| 60 req/min | `/webhook/trigger` |

---

## GET /health

Quick liveness check. Returns server version and AI flag.

**Response**
```json
{
  "ok": true,
  "version": "2.4.0",
  "ai_enabled": false
}
```

---

## GET /api/status/full

Aggregated health snapshot for the entire Sigil + ASCILINE stack. Used by `/status` Discord command and `sigil status` CLI.

**Response**
```json
{
  "ok": true,
  "gui": {
    "ok": true,
    "reachable": true,
    "version": "2.4.0",
    "uptime_ms": 3600000
  },
  "bot": {
    "ok": true,
    "reachable": true,
    "guilds": 3,
    "latency": 42
  },
  "asciline": {
    "ok": true,
    "reachable": true,
    "playing": true,
    "mode": 2,
    "cols": 120,
    "queue_len": 1
  },
  "last_error": {
    "ts": 1718900000000,
    "level": "error",
    "text": "[ERROR] Something went wrong"
  }
}
```

| Field | Notes |
|---|---|
| `gui.uptime_ms` | Milliseconds since gui-server process started |
| `bot.reachable` | `false` if `global.sigilClient` is not set or not ready |
| `bot.latency` | Discord WebSocket heartbeat latency in ms |
| `asciline.reachable` | `false` if `stream_server.py` is not running or timed out |
| `last_error` | Last `error`-level entry from the log ring buffer, or `null` |

---

## GET /api/logs

Returns recent log lines from the in-memory ring buffer (last 1 000 entries).

**Query parameters**

| Param | Type | Default | Notes |
|---|---|---|---|
| `tail` | number | `50` | Number of lines to return (1–500) |
| `level` | string | *(all)* | Filter by level: `info`, `warn`, or `error` |

**Response**
```json
{
  "ok": true,
  "lines": [
    { "ts": 1718900000000, "level": "info", "text": "[GUI] Sigil GUI server v2.4.0 on http://localhost:8080" },
    { "ts": 1718900001000, "level": "warn", "text": "[WARNING] Command file foo.js is missing 'data' or 'execute'." }
  ]
}
```

---

## WS /ws/logs

Real-time WebSocket stream of log entries as they are emitted. Each message is a JSON-encoded log entry.

**URL parameters**

| Param | Notes |
|---|---|
| `?level=info\|warn\|error` | Optional. Filters to only the specified level. |

**Message format** (one per emitted log line)
```json
{ "ts": 1718900002000, "level": "error", "text": "[ERROR] Unhandled Rejection: ..." }
```

Used by `sigil logs --live` CLI command.

---

## GET /api/packages

Returns all package states for a guild.

**Query parameters**

| Param | Required | Notes |
|---|---|---|
| `guild_id` | ✓ | Discord guild snowflake (17–20 digits) |

**Response**
```json
{
  "ok": true,
  "guild_id": "123456789012345678",
  "disabled": ["media"],
  "packages": [
    { "key": "media",    "enabled": false },
    { "key": "welcome",  "enabled": true },
    { "key": "leveling", "enabled": true }
  ]
}
```

---

## POST /api/packages

Enable or disable a named package for a guild.

**Request body**
```json
{
  "guild_id": "123456789012345678",
  "package": "media",
  "enabled": true
}
```

**Response**
```json
{ "ok": true, "package": "media", "enabled": true, "result": "enabled" }
```

---

## POST /api/media/enqueue

Add a video or URL to the ASCILINE playback queue.

**Request body**
```json
{
  "url":   "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "mode":  1,
  "cols":  120,
  "vol":   1,
  "pixel": false,
  "loop":  false
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | — | **Required.** Video URL or path |
| `mode` | number | `1` | Render mode 1–5 |
| `cols` | number | *(server default)* | Terminal columns (40–500) |
| `vol` | number | `1` | Volume 0–5 |
| `pixel` | boolean | `false` | Pixel-art mode |
| `loop` | boolean | `false` | Loop current item |

---

## POST /api/media/skip

Skip the currently playing item.

**Request body** `{}` (empty)

---

## POST /api/media/stop

Stop playback and clear the queue.

**Request body** `{}` (empty)

---

## POST /api/media/seek

Seek to a timestamp in the current item.

**Request body**
```json
{ "time": 90 }
```
`time` must be `>= 0` (seconds).

---

## POST /api/media/volume

Set playback volume.

**Request body**
```json
{ "vol": 2 }
```
`vol` must be `0`–`5`.

---

## POST /api/media/loop

Toggle loop mode.

**Request body**
```json
{ "enabled": true }
```

---

## POST /api/media/mode

Change the ASCILINE render mode.

**Request body**
```json
{ "mode": 3 }
```
`mode` must be `1`–`5`.

---

## POST /api/media/cols

Set the terminal column width.

**Request body**
```json
{ "cols": 160 }
```
`cols` must be `40`–`500`.

---

## GET /api/media/status

Returns ASCILINE now-playing info (proxied from `stream_server.py`).

**Response** *(example)*
```json
{
  "ok": true,
  "playing": true,
  "current": "https://youtube.com/...",
  "mode": 2,
  "cols": 120,
  "vol": 1
}
```

---

## GET /api/media/queue

Returns the current ASCILINE playback queue (proxied from `stream_server.py`).

**Response** *(example)*
```json
{
  "ok": true,
  "queue": [
    "https://youtube.com/watch?v=abc",
    "https://youtube.com/watch?v=xyz"
  ],
  "queue_length": 2
}
```

---

## POST /preview

Generates a full brand kit: icon + banner + color palette as base64 PNGs.

**Request body**
```json
{
  "icon_text":       "SIGIL",
  "banner_text":     "Sigil — God Mode for Discord",
  "primary_color":   "#8B0000",
  "secondary_color": "#4B0082",
  "background":      "midnight-gradient",
  "border":          "none",
  "font":            "Arial Black",
  "glow":            10,
  "opacity":         0.85,
  "shape":           "circle",
  "palette":         ["#8B0000", "#4B0082", "#FF4444"],
  "width":           512,
  "height":          512
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `icon_text` | string | `"SIGIL"` | Max 8 chars, uppercased |
| `banner_text` | string | same as icon_text | Max 64 chars |
| `primary_color` | hex string | `"#8B0000"` | Must be valid 3 or 6-digit hex |
| `secondary_color` | hex string | `"#4B0082"` | |
| `background` | string | `"midnight-gradient"` | See background IDs |
| `border` | string | `"none"` | `none`, `solid`, `glow`, `double`, `neon`, `dashed`, `dotted`, `rainbow` |
| `font` | string | `"Arial Black"` | |
| `glow` | number | `0` | 0–25 |
| `opacity` | number | `1` | 0–1 |
| `shape` | string | `"square"` | `circle`, `rounded`, `hexagon`, `diamond`, `square` |
| `palette` | string[] | `[]` | Array of hex colors for palette swatch |
| `width` | number | `512` | 64–3840 |
| `height` | number | `512` | 64–2160 |

**Response**
```json
{
  "ok": true,
  "icon_b64":    "<base64 PNG>",
  "banner_b64":  "<base64 PNG>",
  "palette_b64": "<base64 PNG>"
}
```

---

## POST /preview/welcome

Generates a welcome card image (900×300).

**Request body**
```json
{
  "username":      "NewMember",
  "message":       "Welcome to the server!",
  "primary_color": "#39FF14",
  "background":    "gradient-purple",
  "font":          "Arial",
  "member_count":  "Member #1,042"
}
```

**Response**
```json
{ "ok": true, "image_b64": "<base64 PNG>" }
```

---

## POST /preview/rankcard

Generates an XP rank card (800×200).

**Request body**
```json
{
  "username":     "Player",
  "level":        12,
  "rank":         3,
  "current_xp":   4200,
  "required_xp":  5000,
  "primary_color": "#5865F2",
  "background":   "solid-dark",
  "font":         "Arial"
}
```

**Response**
```json
{ "ok": true, "image_b64": "<base64 PNG>" }
```

---

## POST /preview/serverstats

Generates a server stats card (860×480).

**Request body**
```json
{
  "server_name":   "My Server",
  "member_count":  1042,
  "channel_count": 24,
  "role_count":    18,
  "emoji_count":   42,
  "boost_level":   2,
  "boost_count":   14,
  "age_days":      365,
  "accent_color":  "#5865F2"
}
```

**Response**
```json
{ "ok": true, "image_b64": "<base64 PNG>" }
```

---

## POST /webhook/trigger

Triggers a webhook notification for the specified guild. Requires `x-sigil-guild-id` header and optionally `x-sigil-signature` (HMAC-SHA256) if a `webhook_secret` is configured.

**Headers**

| Header | Required | Notes |
|---|---|---|
| `x-sigil-guild-id` | ✓ | Discord guild snowflake |
| `x-sigil-signature` | If secret set | `sha256=<hex>` HMAC of raw body |

**Request body**
```json
{
  "type": "twitch.live",
  "streamer": "example",
  "title": "Playing something cool",
  "url": "https://twitch.tv/example"
}
```

Supported `type` values: `twitch.live`, `youtube.upload`, `github.push`.

**Response**
```json
{ "ok": true, "type": "twitch.live" }
```

---

## POST /generate *(disabled)*

AI brand kit generation. Currently returns `503 Service Unavailable`.

**Response**
```json
{
  "ok": false,
  "coming_soon": true,
  "error": "✨ AI Generate is coming soon. Stay tuned!"
}
```

---

## Error Responses

All endpoints return `{ ok: false, error: "..." }` on failure.

| Status | Meaning |
|---|---|
| `400` | Missing or invalid request parameter |
| `401` | Invalid HMAC signature |
| `429` | Rate limit exceeded — wait 1 minute |
| `500` | Server-side render or internal error |
| `503` | Feature disabled or upstream (ASCILINE) unreachable |
| `404` | Route not found |
