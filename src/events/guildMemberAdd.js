const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const channel = member.guild.systemChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`\uD83D\uDC4B Welcome, ${member.user.username}!`)
            .setDescription(`You're member **#${member.guild.memberCount}** of **${member.guild.name}**. Check out our channels and enjoy your stay!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor('#39FF14')
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => {});
    },
};
