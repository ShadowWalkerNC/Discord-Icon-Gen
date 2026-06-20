// src/commands/post.js
// Discord slash command: /post
// Generates an AI caption and publishes it to selected platforms via Post-Pilot.

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require('discord.js');

const pp = require('../services/postpilot');

// ---- Platform options shown in the select menu ----------------------------
const PLATFORM_OPTIONS = [
  { label: '📱 Facebook',        value: 'facebook',  description: 'Post to your Facebook Page' },
  { label: '📸 Instagram',       value: 'instagram', description: 'Post to your Instagram Business account' },
  { label: '🎵 TikTok',          value: 'tiktok',    description: 'Post to your TikTok account' },
  { label: '📺 YouTube',         value: 'youtube',   description: 'Post as a YouTube Community post' },
  { label: '🔍 Google Business', value: 'google',    description: 'Post to your Google Business profile' },
  { label: '🌐 Website',         value: 'website',   description: 'Add to your Post-Pilot website feed' },
];

// ---- Command definition ---------------------------------------------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('Generate and publish a social media post via Post-Pilot')
    .addStringOption(opt =>
      opt.setName('topic')
         .setDescription('What do you want to post about? (e.g. "Brisket Tacos are back on the menu")')
         .setRequired(true)
         .setMaxLength(280)
    )
    .addStringOption(opt =>
      opt.setName('tone')
         .setDescription('Post tone (default: engaging)')
         .setRequired(false)
         .addChoices(
           { name: '🔥 Exciting',    value: 'exciting' },
           { name: '💬 Engaging',    value: 'engaging' },
           { name: '😄 Funny',       value: 'funny'    },
           { name: '🤝 Professional',value: 'professional' },
           { name: '🌿 Casual',      value: 'casual'   },
         )
    )
    .addStringOption(opt =>
      opt.setName('platforms')
         .setDescription('Comma-separated platforms to post to (or leave blank to pick interactively)')
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('image')
         .setDescription('Optional image URL to attach to the post')
         .setRequired(false)
    ),

  // ---- Handler ------------------------------------------------------------
  async execute(interaction) {
    // Guard: check config
    if (!pp.isConfigured()) {
      return interaction.reply({
        content: '⚠️ Post-Pilot is not configured on this server.\nSet `POSTPILOT_URL`, `POSTPILOT_API_KEY`, and `POSTPILOT_USER_ID` in your `.env`.',
        ephemeral: true,
      });
    }

    const topic     = interaction.options.getString('topic');
    const tone      = interaction.options.getString('tone')    || 'engaging';
    const imageUrl  = interaction.options.getString('image')   || null;
    const rawPlats  = interaction.options.getString('platforms') || '';

    // ---- Fast path: platforms provided inline -----------------------------
    if (rawPlats) {
      const platforms = pp.parsePlatforms(rawPlats);
      if (!platforms.length) {
        return interaction.reply({
          content: `❌ No valid platforms found in \`${rawPlats}\`.\nValid: facebook, instagram, tiktok, youtube, google, website`,
          ephemeral: true,
        });
      }
      return _generateAndPublish(interaction, topic, tone, platforms, imageUrl, false);
    }

    // ---- Interactive path: show platform select menu ----------------------
    await interaction.deferReply({ ephemeral: false });

    const select = new StringSelectMenuBuilder()
      .setCustomId('pp_platform_select')
      .setPlaceholder('Choose platforms to publish to…')
      .setMinValues(1)
      .setMaxValues(PLATFORM_OPTIONS.length)
      .addOptions(
        PLATFORM_OPTIONS.map(p =>
          new StringSelectMenuOptionBuilder()
            .setLabel(p.label)
            .setValue(p.value)
            .setDescription(p.description)
        )
      );

    const row = new ActionRowBuilder().addComponents(select);

    const preEmbed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle('🚀 Post-Pilot — Choose Platforms')
      .setDescription(`**Topic:** ${topic}\n**Tone:** ${tone}\n\nSelect the platforms you want to publish to, then I\'ll generate and post.`)
      .setFooter({ text: 'Expires in 60 seconds' });

    const reply = await interaction.editReply({
      embeds: [preEmbed],
      components: [row],
    });

    // Collect one selection
    let collected;
    try {
      collected = await reply.awaitMessageComponent({
        filter:      i => i.user.id === interaction.user.id && i.customId === 'pp_platform_select',
        componentType: ComponentType.StringSelect,
        time:        60_000,
      });
    } catch {
      // Timed out
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0xf87171)
        .setDescription('⏱️ Platform selection timed out. Run `/post` again.');
      return interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }

    await collected.deferUpdate();
    const platforms = collected.values;
    return _generateAndPublish(interaction, topic, tone, platforms, imageUrl, true);
  },
};

// ---- Core publish flow ----------------------------------------------------
async function _generateAndPublish(interaction, topic, tone, platforms, imageUrl, wasDeferred) {
  // Show generating state
  const genEmbed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle('⏳ Generating your post…')
    .setDescription(`Topic: **${topic}**\nPlatforms: ${platforms.join(', ')}`);

  if (wasDeferred) {
    await interaction.editReply({ embeds: [genEmbed], components: [] });
  } else {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [genEmbed] });
  }

  let result;
  try {
    result = await pp.generateAndPublish({
      topic,
      tone,
      platforms,
      imageUrl,
    });
  } catch (err) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xf87171)
      .setTitle('❌ Post-Pilot Error')
      .setDescription(`\`\`\`${err.message}\`\`\``);
    return interaction.editReply({ embeds: [errEmbed], components: [] });
  }

  // ---- Build success embed ------------------------------------------------
  const platformSummary = pp.formatResults(result.results || {});
  const successEmbed = new EmbedBuilder()
    .setColor(0x4ade80)
    .setTitle('✅ Post Published!')
    .addFields(
      { name: '📝 Caption',   value: result.caption?.slice(0, 1024) || '—', inline: false },
      { name: '🏷️ Hashtags',  value: result.hashtags?.join(' ') || '—',     inline: false },
      { name: '📡 Platforms', value: platformSummary || '—',                 inline: false },
    )
    .setFooter({ text: `Post ID: ${result.post_id || 'unknown'} • via Post-Pilot` })
    .setTimestamp();

  if (imageUrl) successEmbed.setThumbnail(imageUrl);

  // Check for any failures
  const failed = Object.entries(result.results || {})
    .filter(([, r]) => !r.success)
    .map(([p]) => p);

  if (failed.length) {
    successEmbed.addFields({
      name: '⚠️ Partial failure',
      value: `Could not post to: ${failed.join(', ')}\nCheck platform connections in Post-Pilot.`,
      inline: false,
    });
    successEmbed.setColor(0xfbbf24); // amber
  }

  return interaction.editReply({ embeds: [successEmbed], components: [] });
}
