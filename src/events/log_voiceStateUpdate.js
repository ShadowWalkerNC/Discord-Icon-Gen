const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        let title, color, desc;

        if (!oldState.channelId && newState.channelId) {
            title = '🔊 Joined Voice';
            color = '#43B581';
            desc  = `<@${member.id}> joined <#${newState.channelId}>`;
        } else if (oldState.channelId && !newState.channelId) {
            title = '🔇 Left Voice';
            color = '#747F8D';
            desc  = `<@${member.id}> left <#${oldState.channelId}>`;
        } else if (oldState.channelId !== newState.channelId) {
            title = '🔀 Moved Voice';
            color = '#FAA61A';
            desc  = `<@${member.id}> moved from <#${oldState.channelId}> → <#${newState.channelId}>`;
        } else return;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setDescription(desc)
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp();
        await sendLog(client, member.guild.id, embed);
    },
};
