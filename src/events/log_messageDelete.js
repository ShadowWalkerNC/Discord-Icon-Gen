const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message, client) {
        if (!message.guild || message.author?.bot) return;
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Message Deleted')
            .setColor('#F04747')
            .addFields(
                { name: 'Author',  value: message.author ? `<@${message.author.id}> (${message.author.tag})` : 'Unknown', inline: true },
                { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
                { name: 'Content', value: message.content?.slice(0, 1024) || '*No text content*' }
            )
            .setFooter({ text: `User ID: ${message.author?.id ?? 'unknown'}` })
            .setTimestamp();
        await sendLog(client, message.guild.id, embed);
    },
};
