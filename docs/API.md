# Sigil GUI Server — API Reference

Base URL: your Railway deployment URL (e.g. `https://sigil-gui.up.railway.app`)

All POST endpoints accept and return `application/json`. All canvas render endpoints are rate-limited to **20 requests per minute per IP**.

---

## GET /health

Returns server status and configuration.

**Response**
```json
{
  "ok": true,
  "version": "2.0.0",
  "ai_enabled": false
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
| `429` | Rate limit exceeded — wait 1 minute |
| `500` | Server-side render error |
| `503` | Feature disabled |
| `404` | Route not found |
