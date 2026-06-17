import { EmbedBuilder } from 'discord.js';
import { db } from '../utils/database.js';

export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) return;
    if (interaction.isButton()) {
      const { customId, guildId } = interaction;
      if (customId === 'setup_brand') {
        const profile = db.prepare('SELECT * FROM server_profiles WHERE guild_id = ?').get(guildId);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setTitle('\u2713 Step 1 \u2014 Brand').setDescription(profile ? `Brand **${profile.brand_name}** saved. Run /brand apply.` : 'No brand yet. Run /brand ai or /brand manual.')], ephemeral: true });
      }
      if (customId === 'setup_emoji')  return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setTitle('\u2713 Step 2 \u2014 Emoji').setDescription('Run /emoji pack then /emoji apply.')], ephemeral: true });
      if (customId === 'setup_roles')  return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setTitle('\u2713 Step 3 \u2014 Roles').setDescription('Run /role badge for each role.')], ephemeral: true });
      if (customId === 'setup_auto') {
        db.prepare('INSERT OR REPLACE INTO server_settings (guild_id, automation_mode) VALUES (?, \'on\')').run(guildId);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor('#00FF00').setTitle('\u2713 Step 4 \u2014 Automation Enabled').setDescription('Welcome and goodbye cards active.')], ephemeral: true });
      }
    }
  }
};
