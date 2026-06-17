# Setup Guide

## Step 1 — Get a Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name → **Create**
3. Click **Bot** → **Reset Token** → copy the token
4. Enable **Server Members Intent** and **Message Content Intent**
5. Paste the token into `.env` as `TOKEN=`

## Step 2 — Get the Client ID

1. Click **General Information** → copy **Application ID**
2. Paste into `.env` as `CLIENT_ID=`

## Step 3 — Invite the Bot

1. Click **OAuth2** → **URL Generator**
2. Tick **bot** and **applications.commands**
3. Tick: Manage Guild, Manage Roles, Manage Channels, Manage Emojis and Stickers, Create Events
4. Open the generated URL → select your server → Authorize

## Step 4 — Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key** → copy it
3. Paste into `.env` as `GEMINI_API_KEY=`

## Step 5 — Run

```bash
npm install
npm run deploy
npm start
```

Open GUI: `http://localhost:3420`

## First commands

```
/brand ai "aggressive neon gaming server"
/brand apply
/theme list
/server preflight
/automation enable
/help
```
