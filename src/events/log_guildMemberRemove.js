const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        const embed = new EmbedBuilder()
            .setTitle('📤 Member Left')
            .setColor('#747F8D')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'User',  value: `<@${member.id}> (${member.user.tag})`, inline: true },
                { name: 'Roles', value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None' }
            )
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp();
        await sendLog(client, member.guild.id, embed);
    },
};
