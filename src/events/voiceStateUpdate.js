import { EmbedBuilder } from 'discord.js';
import { db } from '../utils/database.js';

export default {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    const guild    = newState.guild || oldState.guild;
    const settings = db.prepare('SELECT * FROM server_settings WHERE guild_id = ?').get(guild.id);
    if (!settings || settings.automation_mode === 'off') return;
    const profile = db.prepare('SELECT * FROM server_profiles WHERE guild_id = ?').get(guild.id) || {};
    const channel = settings.welcome_channel_id
      ? guild.channels.cache.get(settings.welcome_channel_id)
      : guild.systemChannel;
    if (!channel) return;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    if (!oldState.channelId && newState.channelId) {
      await channel.send({ embeds: [
        new EmbedBuilder()
          .setColor(profile.primary_color || '#00BFFF')
          .setDescription(`\uD83C\uDF99\uFE0F **${member.user.username}** joined **${newState.channel?.name || 'voice'}**`)
          .setTimestamp()
      ]}).catch(() => {});
    }
    if (oldState.channelId && !newState.channelId) {
      await channel.send({ embeds: [
        new EmbedBuilder()
          .setColor(profile.secondary_color || '#666666')
          .setDescription(`\uD83D\uDD07 **${member.user.username}** left **${oldState.channel?.name || 'voice'}**`)
          .setTimestamp()
      ]}).catch(() => {});
    }
  }
};
