const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/db.js');
const { runStatsForGuild } = require('../services/statsRunner.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Post the weekly server health report right now')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const cfg = getConfig(interaction.guild.id);

        if (!cfg.stats_channel) {
            return interaction.reply({
                content: '❌ No stats channel configured. Set one with `/sigilconfig stats channel:#your-channel`.',
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const ok = await runStatsForGuild(
            interaction.client,
            interaction.guild.id,
            cfg.stats_channel
        );

        if (ok) {
            await interaction.editReply({ content: `✅ Stats report posted in <#${cfg.stats_channel}>.` });
        } else {
            await interaction.editReply({ content: '❌ Failed to post stats. Check that I have permission to send messages in the configured channel.' });
        }
    },
};
