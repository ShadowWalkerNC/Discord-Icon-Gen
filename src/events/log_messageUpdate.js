const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMsg, newMsg, client) {
        if (!newMsg.guild || newMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return;
        const embed = new EmbedBuilder()
            .setTitle('✏️ Message Edited')
            .setColor('#FAA61A')
            .setURL(newMsg.url)
            .addFields(
                { name: 'Author',  value: `<@${newMsg.author.id}> (${newMsg.author.tag})`, inline: true },
                { name: 'Channel', value: `<#${newMsg.channelId}>`, inline: true },
                { name: 'Before',  value: oldMsg.content?.slice(0, 512) || '*empty*' },
                { name: 'After',   value: newMsg.content?.slice(0, 512) || '*empty*' }
            )
            .setFooter({ text: `Message ID: ${newMsg.id}` })
            .setTimestamp();
        await sendLog(client, newMsg.guild.id, embed);
    },
};
