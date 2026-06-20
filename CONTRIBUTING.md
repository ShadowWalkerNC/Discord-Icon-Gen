# Contributing to Sigil

Thanks for your interest. Sigil is a real production bot — contributions are held to the same standard as the existing code. Here's how to get involved effectively.

---

## Getting Started

```bash
git clone https://github.com/ShadowWalkerNC/Sigil
cd Sigil
npm install
cp .env.example .env   # fill in at minimum DISCORD_TOKEN, CLIENT_ID, GUI_URL
npm run dev            # bot with live reload
npm run gui:dev        # GUI server with live reload (separate terminal)
```

To register slash commands with Discord after making changes:

```bash
npm run deploy-commands
# or via CLI:
npx sigil deploy
```

---

## Project Layout

```
src/
  commands/     — One file per slash command. Auto-loaded at startup.
  events/       — Discord.js event handlers
  services/     — Background pollers and scheduled runners
  util/         — Shared helpers: canvas, Gemini, DB, service registry, log buffer
  db.js         — SQLite schema + migrations (safe to re-run at every boot)
  index.js      — Bot entry point

gui/
  gui-server.js — Express server: REST API, WebSocket log stream, static routes
  *.html        — Each page is self-contained HTML/CSS/JS (no build step)
```

---

## Adding a Slash Command

1. Create `src/commands/yourcommand.js`.
2. Export `{ data, execute }` — `data` is a `SlashCommandBuilder`, `execute` is `async (interaction) => {}`.
3. Optionally export `autocomplete` for autocomplete interactions.
4. The bot auto-discovers all `.js` files in `src/commands/` — no central registration list needed.
5. Run `npm run deploy-commands` (or `npx sigil deploy`) to push the updated command to Discord.

```js
// src/commands/example.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Does something useful'),
  async execute(interaction) {
    await interaction.reply({ content: 'It works.', ephemeral: true });
  }
};
```

---

## Adding a Background Service

Services are background pollers or scheduled runners. They hook into the service health registry so their status appears on the `/status` dashboard automatically.

```js
// src/services/myservice.js
const registry = require('../util/serviceRegistry');

const NAME     = 'my-service';
const INTERVAL = 60_000;

async function tick(client) {
  try {
    // your logic here
    registry.heartbeat(NAME);
  } catch (err) {
    registry.setError(NAME, err.message);
    console.error(`[${NAME}]`, err);
  }
}

function start(client) {
  registry.register(NAME, { interval: INTERVAL, description: 'What this does' });
  tick(client);
  setInterval(() => tick(client), INTERVAL);
}

module.exports = { start };
```

Then import and start it from `src/index.js` inside the `clientReady` handler:

```js
const myService = require('./services/myservice');
myService.start(client);
```

---

## Adding a GUI Page

1. Create `gui/yourpage.html` — plain HTML/CSS/JS, no build step.
2. Add a route in `gui/gui-server.js`:
   ```js
   app.get('/yourpage', (req, res) => res.sendFile(path.join(__dirname, 'yourpage.html')));
   ```
3. Add a nav link to the relevant existing pages.

Keep pages self-contained. API calls go to `/api/*` on the same Express server.

---

## Code Style

- `const`/`let` only — never `var`.
- `async`/`await` over raw promise chains.
- Errors: `console.error('[module-name] description', err)` so they're greppable and captured by the log buffer.
- Heavy or reusable logic belongs in `src/util/`, not inline in a command.
- Keep commands focused on interaction handling; keep services focused on one data source.

---

## Pull Requests

- One PR per feature or fix.
- Write a clear description: what changed, why, and what you tested.
- Verify `npm start` launches cleanly and `npm run lint` passes before submitting.
- If your change adds or modifies an API endpoint, update `API.md`.

---

## Reporting Issues

Open a GitHub Issue with:
- What you expected to happen
- What actually happened
- Relevant console output (check `/api/logs` or the `/status` page for the live log tail)
- Your deployment environment (Railway, PM2, local)
