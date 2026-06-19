const { EmbedBuilder, Events, AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.GuildBanRemove,
    async execute(ban, client) {
        let mod = 'Unknown';
        try {
            const logs  = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
            const entry = logs.entries.first();
            if (entry && entry.target.id === ban.user.id) mod = `<@${entry.executor.id}> (${entry.executor.tag})`;
        } catch {}
        const embed = new EmbedBuilder()
            .setTitle('✅ Member Unbanned')
            .setColor('#43B581')
            .addFields(
                { name: 'User', value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true },
                { name: 'Mod',  value: mod, inline: true }
            )
            .setFooter({ text: `User ID: ${ban.user.id}` })
            .setTimestamp();
        await sendLog(client, ban.guild.id, embed);
    },
};
