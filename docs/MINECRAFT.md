# Sigil \u2014 DiscordSRV Setup Guide

> Connect your Discord server to a Minecraft Java server so players can chat across both platforms, link their accounts, and sync Discord roles automatically.
>
> This guide covers **DiscordSRV** (v1.27+) on **Paper/Spigot 1.17\u20131.21**.
> Use `/minecraft` in Discord for a quick in-bot summary.

---

## Prerequisites

- A running **Minecraft Java server** (Paper or Spigot recommended)
- **Admin access** to your Discord server
- A **Discord bot token** (separate from Sigil \u2014 DiscordSRV needs its own bot)

---

## Step 1 \u2014 Install DiscordSRV

1. Download the latest `DiscordSRV-Build-*.jar` from:
   - [SpigotMC](https://www.spigotmc.org/resources/discordsrv.18494/)
   - [Modrinth](https://modrinth.com/plugin/discordsrv)
   - [GitHub Releases](https://github.com/DiscordSRV/DiscordSRV/releases)
2. Place the `.jar` in your server\u2019s `plugins/` folder.
3. Start the server once to generate config files, then stop it.

Generated files:
```
plugins/
\u2514\u2500\u2500 DiscordSRV/
    \u251c\u2500\u2500 config.yml          \u2190 main config
    \u251c\u2500\u2500 messages.yml        \u2190 chat message formats
    \u251c\u2500\u2500 linking.yml         \u2190 account linking settings
    \u2514\u2500\u2500 synchronization.yml \u2190 role sync settings
```

---

## Step 2 \u2014 Create a Discord Bot for DiscordSRV

> DiscordSRV requires its **own** dedicated Discord bot. Do not reuse the Sigil bot token.

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** \u2192 name it (e.g. `Demonfall Bridge`)
3. Go to the **Bot** tab \u2192 click **Reset Token** \u2192 copy and save the token
4. Under **Privileged Gateway Intents**, enable:
   - \u2705 **Server Members Intent**
   - \u2705 **Message Content Intent**
5. Go to **OAuth2 \u2192 URL Generator**:
   - Scope: `bot`
   - Permissions: `Send Messages`, `Read Message History`, `Manage Roles`, `Add Reactions`
6. Copy the generated URL, open it in a browser, and invite the bot to your Discord server.

---

## Step 3 \u2014 Configure `config.yml`

Open `plugins/DiscordSRV/config.yml` and set the following:

```yaml
# Your DiscordSRV bot token
BotToken: "PASTE_YOUR_BOT_TOKEN_HERE"

# Map Minecraft channel names to Discord channel IDs
# Right-click a channel in Discord (with Developer Mode on) → Copy ID
Channels:
  "global": "YOUR_CHANNEL_ID"

# Optional: mirror server console to a Discord channel
DiscordConsoleChannelId: "YOUR_CONSOLE_CHANNEL_ID"

# Optional: server startup/shutdown messages
DiscordChatChannelServerStartupMessage: "\u26CF Server is starting..."
DiscordChatChannelServerShutdownMessage: "\uD83D\uDED1 Server has stopped."
```

**Enable Discord Developer Mode:**
 Discord Settings \u2192 Advanced \u2192 Developer Mode \u2192 ON
 Then right-click any channel \u2192 **Copy Channel ID**.

---

## Step 4 \u2014 Link Roles (Optional)

Automatic role assignment when players link their Minecraft + Discord accounts:

```yaml
# In config.yml
MinecraftDiscordAccountLinkedRoleNameToAddUserTo: "Verified"
```

Players link accounts in-game:
```
/discord link
```
They\u2019ll receive a code to redeem in Discord DMs with the bot. Once linked, the configured role is granted automatically.

**Role sync (`synchronization.yml`):**
```yaml
# Sync a Discord role to an in-game permission group (requires Vault + a permissions plugin)
GroupSynchronizationMinecraftToPrimaryGroupCycleTimeMins: 5
```

---

## Step 5 \u2014 Start & Verify

1. Start your Minecraft server.
2. Check your linked Discord channel \u2014 a startup message should appear.
3. Send a message in Discord \u2014 it should appear in Minecraft chat prefixed with `[Discord]`.
4. Type in Minecraft chat \u2014 it should appear in the Discord channel.
5. If something fails, check:
   - `plugins/DiscordSRV/` log files
   - The bot has the correct permissions in the channel
   - Developer Mode is enabled and you\u2019re using the right channel ID

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Bot appears offline in Discord | Check bot token in `config.yml`; ensure Privileged Intents are enabled |
| Messages not bridging | Confirm the channel ID matches; check bot has Send/Read permissions |
| Role not assigned on link | Role name in config must match exactly (case-sensitive) |
| `[ERROR] BotToken is not set` | Token is missing or has extra spaces in `config.yml` |
| Console spam / errors on startup | Update to latest DiscordSRV release; check Java version compatibility |

---

## Resources

- [DiscordSRV Wiki](https://docs.discordsrv.com/)
- [DiscordSRV GitHub](https://github.com/DiscordSRV/DiscordSRV)
- [SpigotMC Page](https://www.spigotmc.org/resources/discordsrv.18494/)
- [DiscordSRV Support Discord](https://discordsrv.com/discord)

---

*Part of the [Sigil](https://github.com/ShadowWalkerNC/Sigil) project \u2014 Discord server branding bot.*
