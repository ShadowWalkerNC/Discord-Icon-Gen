# 📅 Scheduler Integration Guide

This guide explains how to connect **any compatible scheduler** (including Sylvia Ross MC) to Sigil so staff can view their shifts directly in Discord.

---

## How It Works

```
Your Scheduler (Express server)
        ↕  REST API (bridge endpoints)
Sigil (Discord Bot)
        ↕  Discord slash commands
Your Staff (Discord users)
```

Sigil calls two endpoints on your scheduler:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/discord/schedules` | GET | Fetch all schedule entries |
| `/api/discord/callout` | POST | Submit a staff callout |

Both use a **shared secret key** (`x-bridge-key` header) instead of a user login — safe and simple.

---

## Step 1 — Add the Bridge Key to Your Scheduler

In your scheduler's `.env` file, add:

```env
DISCORD_BRIDGE_KEY=make-this-a-long-random-string
```

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2 — Add Bridge Endpoints to `server.js`

Open your scheduler's `server.js` and add these two routes **before** the static file middleware:

```js
// ─── DISCORD BRIDGE ──────────────────────────────────────────────────────────
function requireBridgeKey(req, res, next) {
    const key = req.headers['x-bridge-key'];
    if (!key || key !== process.env.DISCORD_BRIDGE_KEY)
        return res.status(401).json({ error: 'Invalid bridge key.' });
    next();
}

// GET /api/discord/schedules — returns flat array of schedule entries
app.get('/api/discord/schedules', requireBridgeKey, (req, res) => {
    res.json(readData('schedules.json', []));
});

// POST /api/discord/callout — accepts a callout submission from Discord
app.post('/api/discord/callout', requireBridgeKey, (req, res) => {
    const callouts = readData('callouts.json', []);
    const c = req.body;
    if (!c || !c.date) return res.status(400).json({ error: 'Date required.' });
    if (!c.id) c.id = 'co_' + Date.now();
    callouts.unshift(c);
    writeData('callouts.json', callouts)
        ? res.json({ success: true, callout: c })
        : res.status(500).json({ error: 'Failed to write callout.' });
});
```

> **Note for Sylvia Ross MC:** Paste this block in `server.js` just before the line that reads:
> `// ─── STATIC FILES — must be AFTER all API routes`

---

## Step 3 — Make Your Scheduler Reachable

Sigil needs to reach your scheduler over the network.

**Option A — Same machine (local testing)**
```
URL: http://localhost:3000
```

**Option B — LAN (recommended for care homes / restaurants)**
Find your server's local IP:
```bash
# Windows
ipconfig
# Mac/Linux
ifconfig | grep inet
```
```
URL: http://192.168.1.X:3000
```

**Option C — Public internet (tunneling)**
Use [ngrok](https://ngrok.com) for a free HTTPS tunnel:
```bash
ngrok http 3000
# Use the https://xxxxx.ngrok.io URL
```

Or deploy your scheduler to Railway / Render for a permanent URL.

---

## Step 4 — Connect in Discord

In your Discord server, run:
```
/myshift setup url:http://YOUR-SERVER-IP:3000 key:YOUR_BRIDGE_KEY
```

Optionally add a daily auto-post channel:
```
/myshift setup url:http://192.168.1.10:3000 key:abc123 channel:#schedule-board time:07:00 timezone:America/New_York
```

Sigil will test the connection live and tell you how many schedule entries it found.

---

## Step 5 — Staff Link Their Names

Each staff member runs once in Discord:
```
/myshift link name:Nate
```
The name must match exactly how it appears in the schedule (e.g. `Nate`, `Colette`, `Jayden`).

Then they can run:
- `/myshift today` — see their shift today
- `/myshift week` — see their full week
- `/myshift roster` — see everyone's shifts today
- `/callout` — submit a callout directly from Discord

---

## Schedule Data Shape

Sigil expects the schedules endpoint to return a **JSON array** where each entry has:

```json
{
  "staffName": "Nate",
  "role": "Cook",
  "date": "2026-06-22",
  "shiftStart": "06:30",
  "shiftEnd": "14:00",
  "notes": ""
}
```

Extra fields are ignored. This matches the Sylvia Ross MC `schedules.json` format exactly.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Could not reach the scheduler` | Confirm the server is running and the URL/port is correct |
| `Invalid bridge key` | Make sure `.env` has `DISCORD_BRIDGE_KEY` and the server was restarted |
| `No shifts found` | Confirm the staff name spelling matches exactly |
| Bot is hosted remotely, scheduler is on LAN | Use ngrok or deploy scheduler to Railway |

---

## Notes

- The bridge key is never shown in Discord after setup — it's stored encrypted in Sigil's database
- Callouts submitted via Discord appear immediately in the Sylvia Ross callouts list
- The daily auto-post fires once per minute check — posts within 1 minute of the configured time
- Multiple guilds can connect to different schedulers independently
