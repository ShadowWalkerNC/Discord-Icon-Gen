const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

// ── DB MUST be required first ─────────────────────────────────────────────────
// This runs all CREATE TABLE IF NOT EXISTS statements before any command file
// calls db.prepare() at module load time, regardless of load order.
require('./db');
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN     = process.env.DISCORD_TOKEN || process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('\x1b[31m\x1b[1m[FATAL] DISCORD_TOKEN (or TOKEN) and CLIENT_ID must be set. Exiting.\x1b[0m');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

client.commands  = new Collection();
client.cooldowns = new Collection();

// Load commands
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(join(__dirname, 'commands', file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] Command file ${file} is missing 'data' or 'execute'. Skipping.`);
    }
}

// Load events
const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
    const loaded = require(join(__dirname, 'events', file));
    const events = Array.isArray(loaded) ? loaded : [loaded];
    for (const event of events) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.once('clientReady', () => {
    global.sigilClient = client;

    const { startPollers }                        = require('./services/pollers.js');
    const { startScheduler }                      = require('./services/scheduler.js');
    const { startStatsRunner }                    = require('./services/statsRunner.js');
    const { startScheduler: startDevotional }     = require('./commands/devotional.js');
    const { startShiftScheduler }                 = require('./commands/shift.js');
    const { startMyShiftScheduler }               = require('./commands/myshift.js');

    startPollers(client);
    startScheduler(client);
    startStatsRunner(client);
    startDevotional(client);
    startShiftScheduler(client);
    startMyShiftScheduler(client);

    console.log(`\x1b[32m\x1b[1m[Sigil] Ready! Logged in as ${client.user.tag}\x1b[0m`);
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[ERROR] No command found for: ${interaction.commandName}`);
        try { await interaction.reply({ content: 'Unknown command.', flags: 64 }); } catch (_) {}
        return;
    }

    const { cooldowns } = client;
    if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Collection());

    const now        = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownMs = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expiresAt = timestamps.get(interaction.user.id) + cooldownMs;
        if (now < expiresAt) {
            const remaining = ((expiresAt - now) / 1000).toFixed(1);
            // Wrap in try/catch — interaction token may have expired (10062) if bot
            // was restarting; swallow silently rather than crashing the process.
            try {
                await interaction.reply({
                    content: `Please wait **${remaining}s** before using \`/${command.data.name}\` again.`,
                    flags: 64, // ephemeral
                });
            } catch (cdErr) {
                if (cdErr?.code !== 10062) console.warn('[cooldown] reply failed:', cdErr?.message);
            }
            return;
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[ERROR] Failed to execute '${interaction.commandName}':`, error);
        const reply = { content: 'Something went wrong while running that command.', flags: 64 };
        try {
            if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
            else await interaction.reply(reply);
        } catch (_) {}
    }
});

// Autocomplete handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isAutocomplete()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try { await command.autocomplete(interaction); }
    catch (error) {
        console.error(`[ERROR] Autocomplete failed for '${interaction.commandName}':`, error);
        try { await interaction.respond([]); } catch (_) {}
    }
});

process.on('unhandledRejection', (error) => {
    console.error('[ERROR] Unhandled Rejection:', error);
});

client.login(TOKEN);
console.log('\x1b[32m\x1b[1m[Sigil] Starting...\x1b[0m');
