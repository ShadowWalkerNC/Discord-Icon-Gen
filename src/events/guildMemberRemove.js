const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const channel = member.guild.systemChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`\uD83D\uDEAA ${member.user.username} has left the server`)
            .setDescription(`We're down to **${member.guild.memberCount}** members.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor('#FF4444')
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => {});
    },
};
