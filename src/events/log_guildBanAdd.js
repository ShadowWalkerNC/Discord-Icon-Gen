const { EmbedBuilder, Events, AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban, client) {
        let reason = 'No reason provided';
        let mod    = 'Unknown';
        try {
            const logs  = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
            const entry = logs.entries.first();
            if (entry && entry.target.id === ban.user.id) {
                reason = entry.reason || reason;
                mod    = `<@${entry.executor.id}> (${entry.executor.tag})`;
            }
        } catch {}
        const embed = new EmbedBuilder()
            .setTitle('🔨 Member Banned')
            .setColor('#F04747')
            .setThumbnail(ban.user.displayAvatarURL())
            .addFields(
                { name: 'User',   value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true },
                { name: 'Mod',    value: mod,    inline: true },
                { name: 'Reason', value: reason }
            )
            .setFooter({ text: `User ID: ${ban.user.id}` })
            .setTimestamp();
        await sendLog(client, ban.guild.id, embed);
    },
};
