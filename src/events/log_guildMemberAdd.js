const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        const created = Math.floor(member.user.createdTimestamp / 1000);
        const embed = new EmbedBuilder()
            .setTitle('📥 Member Joined')
            .setColor('#43B581')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'User',           value: `<@${member.id}> (${member.user.tag})`, inline: true },
                { name: 'Account Created', value: `<t:${created}:R>`, inline: true },
                { name: 'Member Count',    value: `${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp();
        await sendLog(client, member.guild.id, embed);
    },
};
