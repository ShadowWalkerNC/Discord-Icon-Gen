// scripts/deploy-commands-standalone.js
// Standalone command registration — no canvas, no GUI server imports.
// Run from Railway shell: node scripts/deploy-commands-standalone.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { readdirSync }  = require('fs');
const path             = require('path');

const TOKEN     = process.env.DISCORD_TOKEN || process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('[FATAL] DISCORD_TOKEN (or TOKEN) and CLIENT_ID must be set.');
    process.exit(1);
}

const commands = [];
const cmdDir   = path.join(__dirname, '..', 'src', 'commands');

for (const file of readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
    if (file.startsWith('_')) continue;
    try {
        const cmd = require(path.join(cmdDir, file));
        if (cmd?.data?.toJSON) commands.push(cmd.data.toJSON());
    } catch (err) {
        console.warn(`[deploy] Skipping ${file}: ${err.message}`);
    }
}

console.log(`[deploy] Registering ${commands.length} commands...`);

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('\u2713 Slash commands registered globally.');
    } catch (err) {
        console.error('[deploy] Failed:', err.message);
        process.exit(1);
    }
})();
