const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        const embeds = [];

        if (oldMember.nickname !== newMember.nickname) {
            embeds.push(new EmbedBuilder()
                .setTitle('📝 Nickname Changed')
                .setColor('#FAA61A')
                .addFields(
                    { name: 'User',   value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
                    { name: 'Before', value: oldMember.nickname || '*none*', inline: true },
                    { name: 'After',  value: newMember.nickname || '*none*', inline: true }
                )
                .setFooter({ text: `User ID: ${newMember.id}` })
                .setTimestamp()
            );
        }

        const added   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);
        const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);

        if (added.size) {
            embeds.push(new EmbedBuilder()
                .setTitle('🟢 Role Added')
                .setColor('#43B581')
                .addFields(
                    { name: 'User',  value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
                    { name: 'Roles', value: added.map(r => `<@&${r.id}>`).join(', '), inline: true }
                )
                .setFooter({ text: `User ID: ${newMember.id}` })
                .setTimestamp()
            );
        }
        if (removed.size) {
            embeds.push(new EmbedBuilder()
                .setTitle('🔴 Role Removed')
                .setColor('#F04747')
                .addFields(
                    { name: 'User',  value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
                    { name: 'Roles', value: removed.map(r => `<@&${r.id}>`).join(', '), inline: true }
                )
                .setFooter({ text: `User ID: ${newMember.id}` })
                .setTimestamp()
            );
        }

        for (const embed of embeds) await sendLog(client, newMember.guild.id, embed);
    },
};
