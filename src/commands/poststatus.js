// src/commands/poststatus.js
// Discord slash command: /poststatus
// Shows Post-Pilot health + last N published posts for this server's account.

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pp = require('../services/postpilot');

const STATUS_ICONS = { published: '✅', scheduled: '🕐', failed: '❌', draft: '📝' };
const PLATFORM_EMOJI = {
  facebook: '📱', instagram: '📸', tiktok: '🎵',
  youtube: '📺', google: '🔍', website: '🌐',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poststatus')
    .setDescription('Check Post-Pilot health and see your recent posts')
    .addIntegerOption(opt =>
      opt.setName('limit')
         .setDescription('How many recent posts to show (1–10, default 5)')
         .setRequired(false)
         .setMinValue(1)
         .setMaxValue(10)
    ),

  async execute(interaction) {
    if (!pp.isConfigured()) {
      return interaction.reply({
        content: '⚠️ Post-Pilot is not configured. Set `POSTPILOT_URL`, `POSTPILOT_API_KEY`, and `POSTPILOT_USER_ID` in your `.env`.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const limit = interaction.options.getInteger('limit') || 5;

    // Run health check + history in parallel
    const [healthRes, historyRes] = await Promise.allSettled([
      pp.health(),
      pp.getHistory({ limit }),
    ]);

    // ---- Health field -------------------------------------------------------
    const healthOk  = healthRes.status === 'fulfilled' && healthRes.value?.status === 'ok';
    const healthVal = healthOk
      ? `🟢 Online  •  v${healthRes.value.version}`
      : `🔴 Unreachable  •  ${healthRes.reason?.message || 'unknown error'}`;

    // ---- Build embed --------------------------------------------------------
    const embed = new EmbedBuilder()
      .setColor(healthOk ? 0x4ade80 : 0xf87171)
      .setTitle('📊 Post-Pilot Status')
      .addFields({ name: '🏥 Health', value: healthVal, inline: false });

    // ---- Post history -------------------------------------------------------
    if (historyRes.status === 'fulfilled') {
      const posts = historyRes.value?.posts || [];

      if (!posts.length) {
        embed.addFields({ name: '📋 Recent Posts', value: 'No posts found yet.', inline: false });
      } else {
        const lines = posts.map((p, i) => {
          const icon      = STATUS_ICONS[p.status] || '•';
          const caption   = (p.caption || '').slice(0, 60) + ((p.caption?.length || 0) > 60 ? '…' : '');
          const platforms = Array.isArray(p.platforms)
            ? p.platforms.map(pl => PLATFORM_EMOJI[pl] || pl).join(' ')
            : (p.platforms || '—');
          const date = p.created_at
            ? `<t:${p.created_at}:R>`
            : '';
          return `${i + 1}. ${icon} ${platforms}  ${date}\n   ${caption}`;
        });
        embed.addFields({
          name:   `📋 Last ${posts.length} Post${posts.length > 1 ? 's' : ''}`,
          value:  lines.join('\n\n').slice(0, 1024),
          inline: false,
        });
      }
    } else {
      embed.addFields({
        name:  '📋 Recent Posts',
        value: `❌ Could not load history: ${historyRes.reason?.message || 'unknown'}`,
        inline: false,
      });
    }

    embed
      .setFooter({ text: 'Post-Pilot  •  ShadowRealm Network' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
