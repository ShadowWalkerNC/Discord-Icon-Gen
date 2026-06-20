// src/commands/postgenerate.js
// Discord slash command: /postgenerate
// Preview an AI-generated caption WITHOUT publishing — great for review before posting.

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

const pp = require('../services/postpilot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('postgenerate')
    .setDescription('Preview an AI post before publishing it')
    .addStringOption(opt =>
      opt.setName('topic')
         .setDescription('What to post about')
         .setRequired(true)
         .setMaxLength(280)
    )
    .addStringOption(opt =>
      opt.setName('platform')
         .setDescription('Platform style to target (default: instagram)')
         .setRequired(false)
         .addChoices(
           { name: '📱 Facebook',        value: 'facebook'  },
           { name: '📸 Instagram',       value: 'instagram' },
           { name: '🎵 TikTok',          value: 'tiktok'    },
           { name: '📺 YouTube',         value: 'youtube'   },
           { name: '🔍 Google Business', value: 'google'    },
         )
    )
    .addStringOption(opt =>
      opt.setName('tone')
         .setDescription('Post tone (default: engaging)')
         .setRequired(false)
         .addChoices(
           { name: '🔥 Exciting',      value: 'exciting'     },
           { name: '💬 Engaging',      value: 'engaging'     },
           { name: '😄 Funny',         value: 'funny'        },
           { name: '🤝 Professional',  value: 'professional' },
           { name: '🌿 Casual',        value: 'casual'       },
         )
    ),

  async execute(interaction) {
    if (!pp.isConfigured()) {
      return interaction.reply({
        content: '⚠️ Post-Pilot is not configured on this server.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const topic    = interaction.options.getString('topic');
    const platform = interaction.options.getString('platform') || 'instagram';
    const tone     = interaction.options.getString('tone')     || 'engaging';

    let result;
    try {
      result = await pp.generatePost({ topic, platform, tone });
    } catch (err) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xf87171)
        .setTitle('❌ Generation Failed')
        .setDescription(`\`\`\`${err.message}\`\`\``);
      return interaction.editReply({ embeds: [errEmbed] });
    }

    const previewEmbed = new EmbedBuilder()
      .setColor(0x818cf8)
      .setTitle('✍️ Generated Caption Preview')
      .addFields(
        { name: '📝 Caption',  value: result.caption?.slice(0, 1024) || '—', inline: false },
        { name: '🏷️ Hashtags', value: result.hashtags?.join(' ')     || '—', inline: false },
        { name: '📡 Platform', value: platform,                              inline: true  },
        { name: '🎨 Tone',     value: tone,                                  inline: true  },
      )
      .setFooter({ text: 'Use /post to publish  •  or click Publish below' })
      .setTimestamp();

    // ---- Publish now? button -----------------------------------------------
    const publishBtn = new ButtonBuilder()
      .setCustomId('pp_publish_now')
      .setLabel('🚀 Publish Now')
      .setStyle(ButtonStyle.Primary);

    const dismissBtn = new ButtonBuilder()
      .setCustomId('pp_dismiss')
      .setLabel('Dismiss')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(publishBtn, dismissBtn);

    const reply = await interaction.editReply({
      embeds:     [previewEmbed],
      components: [row],
    });

    // Collect button press (60s window)
    let btn;
    try {
      btn = await reply.awaitMessageComponent({
        filter:        b => b.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time:          60_000,
      });
    } catch {
      // Timeout — disable buttons
      publishBtn.setDisabled(true);
      dismissBtn.setDisabled(true);
      return interaction.editReply({
        embeds:     [previewEmbed],
        components: [new ActionRowBuilder().addComponents(publishBtn, dismissBtn)],
      });
    }

    await btn.deferUpdate();

    if (btn.customId === 'pp_dismiss') {
      return interaction.editReply({ embeds: [previewEmbed.setFooter({ text: 'Dismissed' })], components: [] });
    }

    // ---- Publish the generated caption to default platforms ----------------
    const publishingEmbed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle('⏳ Publishing…')
      .setDescription(result.caption?.slice(0, 200));

    await interaction.editReply({ embeds: [publishingEmbed], components: [] });

    let pubResult;
    try {
      pubResult = await pp.publishPost({
        caption:  result.caption,
        // Uses default platforms from POSTPILOT env config
      });
    } catch (err) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xf87171)
        .setTitle('❌ Publish Failed')
        .setDescription(`\`\`\`${err.message}\`\`\``);
      return interaction.editReply({ embeds: [errEmbed] });
    }

    const doneEmbed = new EmbedBuilder()
      .setColor(0x4ade80)
      .setTitle('✅ Published!')
      .addFields(
        { name: '📝 Caption',   value: result.caption?.slice(0, 1024) || '—', inline: false },
        { name: '📡 Platforms', value: pp.formatResults(pubResult.results || {}), inline: false },
      )
      .setFooter({ text: `Post ID: ${pubResult.post_id || 'unknown'}` })
      .setTimestamp();

    return interaction.editReply({ embeds: [doneEmbed], components: [] });
  },
};
