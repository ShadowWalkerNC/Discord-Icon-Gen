const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// Cache commands at startup instead of requiring on every interaction
client.commands = new Collection();

const commandFiles = readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(join(__dirname, 'commands', file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] Command file ${file} is missing 'data' or 'execute'. Skipping.`);
    }
}

// Load events dynamically
const eventFiles = readdirSync(join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(join(__dirname, 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[ERROR] No command found for: ${interaction.commandName}`);
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[ERROR] Failed to execute command '${interaction.commandName}':`, error);
        const reply = { content: 'Something went wrong while running that command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

process.on('unhandledRejection', (error) => {
    console.error('[ERROR] Unhandled Rejection:', error);
});

client.login(process.env.TOKEN);
console.log('\x1b[32m\x1b[1m Discord-Icon-Gen v1.1.0 starting...\x1b[0m');
