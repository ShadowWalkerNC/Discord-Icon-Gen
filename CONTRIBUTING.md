# Contributing to Discord Icon Gen

Thank you for your interest in contributing! This guide covers everything you need.

---

## Getting Started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Discord-Icon-Gen.git
cd Discord-Icon-Gen
npm install
cp .env.example .env
# Fill in your TOKEN, CLIENT_ID, GUILD_ID, and set DEPLOY_MODE=guild
```

---

## Adding a New Command

1. Create a new file in `src/commands/your-command.js`
2. Use this template:

```js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('your-command')
        .setDescription('What this command does.'),

    async execute(interaction) {
        try {
            await interaction.reply({ content: 'Hello!', ephemeral: true });
        } catch (error) {
            console.error('[ERROR] your-command failed:', error);
            const reply = { content: 'Something went wrong.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    },
};
```

3. Add the command to `/help` in `src/commands/help.js`
4. Document it in `README.md`

The command loads automatically through the command cache — no changes to `index.js` needed.

---

## Adding a New Font

1. Place your `.otf` or `.ttf` font file in `src/fonts/`
2. Add an entry to `src/utils/fonts.js`:

```js
'font-key': {
    label: 'Font Display Name',
    file: path.resolve(__dirname, '..', 'fonts', 'font-file.otf'),
    family: 'Font Family Name',
},
```

The font automatically appears as a choice in `/icon`, `/banner`, `/avatar`, and `/logo`.

---

## Code Style

- Use `const` over `let` where the value never changes
- Use `async/await` — no raw `.then()` chains
- Always wrap command logic in `try/catch` with a user-facing error reply
- Log errors with `console.error('[ERROR] context:', error)`
- Validate user inputs at the top of `execute()` before any async work
- Keep each command file self-contained

---

## Opening a Pull Request

1. Create a branch: `git checkout -b feat/your-feature`
2. Commit with a descriptive message following this pattern:
   - `feat: add /command-name command`
   - `fix: handle edge case in /icon when size is 0`
   - `chore: update dependencies`
3. Push and open a PR against `main`
4. Describe what you changed and why in the PR description

---

*Please be respectful and constructive in all interactions.*
