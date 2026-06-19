const { EmbedBuilder, Events } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel, client) {
        if (!channel.guild) return;
        const embed = new EmbedBuilder()
            .setTitle('➕ Channel Created')
            .setColor('#43B581')
            .addFields(
                { name: 'Name',     value: channel.name, inline: true },
                { name: 'Type',     value: String(channel.type), inline: true },
                { name: 'Category', value: channel.parent?.name || 'None', inline: true }
            )
            .setFooter({ text: `Channel ID: ${channel.id}` })
            .setTimestamp();
        await sendLog(client, channel.guild.id, embed);
    },
};
