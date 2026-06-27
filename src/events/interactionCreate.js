'use strict';

const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // ── Slash commands ──────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`[Commands] Unknown command: ${interaction.commandName}`);
                return interaction.reply({
                    content: '❌ Unknown command.',
                    ephemeral: true,
                }).catch(() => {});
            }

            // Cooldown check
            const now = Date.now();
            const cooldowns = client.cooldowns;
            if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Map());
            const timestamps = cooldowns.get(command.data.name);
            const cooldownAmount = (command.cooldown ?? 0) * 1000;

            if (cooldownAmount > 0 && timestamps.has(interaction.user.id)) {
                const expiry = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expiry) {
                    const remaining = ((expiry - now) / 1000).toFixed(1);
                    return interaction.reply({
                        content: `⏳ Please wait **${remaining}s** before using \`/${command.data.name}\` again.`,
                        ephemeral: true,
                    }).catch(() => {});
                }
            }

            if (cooldownAmount > 0) {
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            }

            // Execute with global error safety net
            try {
                await command.execute(interaction);
            } catch (err) {
                console.error(`[Commands] Error in /${interaction.commandName}:`, err);
                const msg = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    interaction.editReply(msg).catch(() => {});
                } else {
                    interaction.reply(msg).catch(() => {});
                }
            }
            return;
        }

        // ── Autocomplete ────────────────────────────────────────────────────
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command?.autocomplete) return;
            try {
                await command.autocomplete(interaction);
            } catch (err) {
                console.error(`[Autocomplete] Error in /${interaction.commandName}:`, err);
            }
            return;
        }

        // ── Buttons ─────────────────────────────────────────────────────────
        if (interaction.isButton()) {
            // Route by customId prefix: "ticket:claim:123", "giveaway:enter:456", etc.
            const [prefix] = interaction.customId.split(':');
            try {
                const handler = client.buttonHandlers?.get(prefix);
                if (handler) {
                    await handler(interaction);
                } else {
                    console.warn(`[Buttons] No handler for prefix: ${prefix}`);
                    await interaction.reply({ content: '❌ This button is no longer active.', ephemeral: true });
                }
            } catch (err) {
                console.error(`[Buttons] Error handling button ${interaction.customId}:`, err);
                const msg = { content: '❌ Something went wrong with that button.', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    interaction.editReply(msg).catch(() => {});
                } else {
                    interaction.reply(msg).catch(() => {});
                }
            }
            return;
        }

        // ── Modals ──────────────────────────────────────────────────────────
        if (interaction.isModalSubmit()) {
            const [prefix] = interaction.customId.split(':');
            try {
                const handler = client.modalHandlers?.get(prefix);
                if (handler) {
                    await handler(interaction);
                } else {
                    console.warn(`[Modals] No handler for prefix: ${prefix}`);
                    await interaction.reply({ content: '❌ This form is no longer active.', ephemeral: true });
                }
            } catch (err) {
                console.error(`[Modals] Error handling modal ${interaction.customId}:`, err);
                const msg = { content: '❌ Something went wrong with that form.', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    interaction.editReply(msg).catch(() => {});
                } else {
                    interaction.reply(msg).catch(() => {});
                }
            }
            return;
        }
    },
};
