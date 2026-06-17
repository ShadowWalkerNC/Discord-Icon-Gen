import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];
const cmdDir = path.join(__dirname, 'commands');

for (const file of readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(path.join(cmdDir, file)).href);
  const cmd = mod.default || mod;
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log(`Registering ${commands.length} commands...`);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('\u2713 Slash commands registered globally.');
} catch (err) {
  console.error(err);
}
