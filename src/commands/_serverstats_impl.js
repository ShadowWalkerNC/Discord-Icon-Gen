'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('View statistics for this server');

async function execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    await guild.fetch();

    const members       = await guild.members.fetch();
    const totalMembers  = guild.memberCount;
    const bots          = members.filter(m => m.user.bot).size;
    const humans        = totalMembers - bots;

    const online        = members.filter(m => !m.user.bot && m.presence?.status !== 'offline' && m.presence?.status != null).size;
    const channels      = guild.channels.cache;
    const textChannels  = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const categories    = channels.filter(c => c.type === 4).size;
    const roles         = guild.roles.cache.size - 1;
    const emojis        = guild.emojis.cache.size;
    const boosts        = guild.premiumSubscriptionCount ?? 0;
    const boostTier     = guild.premiumTier ?? 0;
    const createdAt     = Math.floor(guild.createdTimestamp / 1000);
    const owner         = await guild.fetchOwner().catch(() => null);

    const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];
    const verification = verificationLevels[guild.verificationLevel] ?? 'Unknown';

    const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setDescription(guild.description ?? '')
        .setThumbnail(guild.iconURL({ extension: 'png', size: 256 }))
        .setColor('#39FF14')
        .addFields(
            { name: '👥 Members',       value: `${humans.toLocaleString()} humans\n${bots} bots\n${online} online`, inline: true },
            { name: '💬 Channels',      value: `${textChannels} text\n${voiceChannels} voice\n${categories} categories`, inline: true },
            { name: '🎭 Roles',         value: String(roles),               inline: true },
            { name: '😄 Emojis',        value: String(emojis),              inline: true },
            { name: '🚀 Boosts',        value: `${boosts} (Tier ${boostTier})`, inline: true },
            { name: '🔒 Verification',  value: verification,                inline: true },
            { name: '👑 Owner',         value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
            { name: '📅 Created',       value: `<t:${createdAt}:D>`,        inline: true },
            { name: '🆔 Guild ID',      value: guild.id,                    inline: true },
        )
        .setFooter({ text: 'Sigil' })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

module.exports = { data, execute };
