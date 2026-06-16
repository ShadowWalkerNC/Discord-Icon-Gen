const { Events, REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const deployMode = (process.env.DEPLOY_MODE || 'guild').toLowerCase();

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`[CLIENT]  Logged in as ${client.user.tag}`);
        console.log(`[DEPLOY]  Mode: ${deployMode === 'global' ? 'GLOBAL (all servers)' : 'GUILD (single server)'}`);

        // Build command list from cached collection
        const commands = [];
        for (const [, command] of client.commands) {
            if (command.data) {
                commands.push(command.data.toJSON());
            }
        }

        const rest = new REST({ version: '10' }).setToken(token);

        try {
            console.log(`[DEPLOY]  Registering ${commands.length} command(s)...`);

            if (deployMode === 'global') {
                // Global: available in all servers — takes up to 1 hour to propagate
                await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                );
                console.log(`[DEPLOY]  ${commands.length} command(s) registered globally. May take up to 1 hour to propagate.`);
            } else {
                // Guild: instant update, scoped to one server — best for development
                if (!guildId) {
                    console.error('[DEPLOY]  GUILD_ID is required for guild deploy mode. Check your .env file.');
                    return;
                }
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                console.log(`[DEPLOY]  ${commands.length} command(s) registered to guild ${guildId}.`);
            }
        } catch (error) {
            console.error('[DEPLOY]  Failed to register commands:', error);
        }
    },
};
