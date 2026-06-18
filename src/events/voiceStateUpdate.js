const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const member = newState.member ?? oldState.member;
        if (!member || member.user.bot) return;

        const logChannel = newState.guild.channels.cache.find(
            c => c.name === 'voice-log' || c.name === 'logs'
        );
        if (!logChannel) return;

        let description;
        if (!oldState.channelId && newState.channelId) {
            description = `\uD83D\uDD0A **${member.user.username}** joined **${newState.channel.name}**`;
        } else if (oldState.channelId && !newState.channelId) {
            description = `\uD83D\uDD07 **${member.user.username}** left **${oldState.channel.name}**`;
        } else if (oldState.channelId !== newState.channelId) {
            description = `\uD83D\uDD00 **${member.user.username}** moved from **${oldState.channel.name}** \u2192 **${newState.channel.name}**`;
        } else {
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor('#5865F2')
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => {});
    },
};
