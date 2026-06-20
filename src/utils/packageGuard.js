/**
 * src/utils/packageGuard.js
 *
 * Tiny convenience wrapper so every command can call one function
 * instead of duplicating the reply boilerplate.
 *
 * Usage:
 *   const guard = require('../utils/packageGuard');
 *   // at the top of execute():
 *   if (await guard(interaction, 'faith')) return;
 */

const { isEnabled, PACKAGES } = require('./packages');

/**
 * If the package is disabled, replies with a friendly ephemeral message
 * and returns true (so the caller can `return`).
 * Returns false when the package is enabled (command should proceed).
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} packageKey
 * @returns {Promise<boolean>}
 */
async function guard(interaction, packageKey) {
    if (isEnabled(interaction.guild.id, packageKey)) return false;
    const pkg = PACKAGES[packageKey];
    const label = pkg ? `**${pkg.emoji} ${pkg.label}**` : `**${packageKey}**`;
    await interaction.reply({
        content: `📦 The ${label} package is not enabled on this server.\n\nAn admin can enable it with \`/sigilconfig packages enable\` or via the [Packages dashboard](https://sigil.app/packages).`,
        ephemeral: true,
    });
    return true;
}

module.exports = guard;
