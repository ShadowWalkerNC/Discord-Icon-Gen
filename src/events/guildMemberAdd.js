import { EmbedBuilder } from 'discord.js';
import { db } from '../utils/database.js';
import { renderWelcomeCard } from '../utils/canvas.js';

export default {
  name: 'guildMemberAdd',
  async execute(client, member) {
    const settings = db.prepare('SELECT * FROM server_settings WHERE guild_id = ?').get(member.guild.id);
    if (!settings || settings.automation_mode === 'off') return;
    const profile = db.prepare('SELECT * FROM server_profiles WHERE guild_id = ?').get(member.guild.id) || {};
    const channel = settings.welcome_channel_id
      ? member.guild.channels.cache.get(settings.welcome_channel_id)
      : member.guild.systemChannel;
    if (!channel) return;
    await channel.send({ embeds: [
      new EmbedBuilder()
        .setColor(profile.primary_color || '#FF0000')
        .setTitle('\uD83C\uDF89 Welcome!')
        .setDescription(`Welcome to **${member.guild.name}**, <@${member.user.id}>!`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
    ]});
  }
};
