# 🚀 Sigil — Deployment Guide

Three deployment options: **Railway** (zero-config, recommended), **Docker**, or **bare-metal with PM2**.

---

## Option 1 — Railway (Recommended)

Railway deploys directly from GitHub with no additional config needed.

### Steps

1. Go to [railway.app](https://railway.app) and click **New Project → Deploy from GitHub Repo**
2. Select `ShadowWalkerNC/Sigil`
3. Railway auto-detects `railway.toml` and `railpack.json` — no Dockerfile needed
4. In **Variables**, add:

```
DISCORD_TOKEN=
CLIENT_ID=
BIBLE_API_KEY=
BIBLE_ID=de4e12af7f28f599-02
GEMINI_API_KEY=
CULINARYOS_WEBHOOK_SECRET=
NODE_ENV=production
```

5. Click **Deploy** — Railway builds and starts Sigil automatically
6. To expose the webhook endpoint, go to **Settings → Networking → Generate Domain**
   - Your webhook URL will be: `https://your-app.up.railway.app/webhooks/culinaryos`

### Persistent Storage (SQLite)

Railway ephemeral filesystems reset on redeploy. For persistent SQLite:
- Add a Railway **Volume** mounted at `/app/data`
- Or migrate to Railway's managed **PostgreSQL** (future enhancement)

---

## Option 2 — Docker

### Build & Run

```bash
# Build
docker build -t sigil .

# Run
docker run -d \
  --name sigil \
  --restart unless-stopped \
  -p 3420:3420 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  sigil
```

### docker-compose (optional)

```yaml
version: '3.9'
services:
  sigil:
    build: .
    restart: unless-stopped
    ports:
      - "3420:3420"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3420/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Option 3 — Bare Metal with PM2

### Prerequisites

```bash
node --version   # must be >= 20
npm --version
npm install -g pm2
```

### Setup

```bash
# Clone
git clone https://github.com/ShadowWalkerNC/Sigil.git
cd Sigil

# Install deps
npm install

# Create .env
cp .env.example .env
nano .env   # fill in your values

# Create required dirs
mkdir -p data logs

# Register slash commands (first run only)
node tools/deploy-commands.js
```

### Start with PM2

```bash
# Start
pm2 start ecosystem.config.js --env production

# Save process list (survive reboots)
pm2 save
pm2 startup   # follow the printed command

# Useful commands
pm2 status
pm2 logs sigil
pm2 restart sigil
pm2 stop sigil
```

### Update

```bash
git pull
npm install
pm2 restart sigil
```

---

## Health Check

Sigil exposes a health endpoint at:
```
GET /health
```
Returns `200 OK` with `{ status: "ok", uptime: <seconds> }` when the bot is running.

Used by Docker `HEALTHCHECK`, Railway, and external uptime monitors.

---

## Webhook Endpoints

| Path | Source | Description |
|---|---|---|
| `POST /webhooks/culinaryos` | CulinaryOS | Inventory alerts, menu updates, new recipes |

Secure with `CULINARYOS_WEBHOOK_SECRET` in `.env` — set the same value in CulinaryOS as the `X-Sigil-Secret` header.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Your bot token from Discord Developer Portal |
| `CLIENT_ID` | ✅ | Application / Client ID from Discord Developer Portal |
| `PORT` | No | HTTP server port (default: `3420`) |
| `BIBLE_API_KEY` | For `/devotional` | Key from [scripture.api.bible](https://scripture.api.bible) |
| `BIBLE_ID` | For `/devotional` | Bible translation ID (default: NIV) |
| `GEMINI_API_KEY` | For AI features | Google Gemini API key |
| `CULINARYOS_WEBHOOK_SECRET` | Recommended | Secures inbound CulinaryOS webhooks |
| `NODE_ENV` | No | Set to `production` in prod |

---

## First-Run Checklist

- [ ] Bot token and Client ID set in `.env`
- [ ] Slash commands deployed: `node tools/deploy-commands.js`
- [ ] Bot invited to server with `applications.commands` + `bot` scopes and required permissions
- [ ] `data/` directory exists and is writable (SQLite)
- [ ] `logs/` directory exists (PM2 / Docker)
- [ ] Health check passing: `curl http://localhost:3420/health`
- [ ] (Optional) CulinaryOS webhook secret configured on both ends

---

*Part of the [Sigil](https://github.com/ShadowWalkerNC/Sigil) ecosystem.*
