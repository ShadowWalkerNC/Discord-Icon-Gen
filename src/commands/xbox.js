import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { searchPlayer, getAchievements, getPresence, isEnabled } from '../services/xbox.js';

export const data = new SlashCommandBuilder()
  .setName('xbox')
  .setDescription('Xbox Live player lookup powered by OpenXBL')
  .addSubcommand(sub =>
    sub
      .setName('player')
      .setDescription('Look up an Xbox Live player profile')
      .addStringOption(opt =>
        opt.setName('gamertag').setDescription('Xbox Gamertag to look up').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('achievements')
      .setDescription('Show recent achievements for a player')
      .addStringOption(opt =>
        opt.setName('gamertag').setDescription('Xbox Gamertag to look up').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Check online/in-game presence for a player')
      .addStringOption(opt =>
        opt.setName('gamertag').setDescription('Xbox Gamertag to look up').setRequired(true)
      )
  );

export async function execute(interaction) {
  if (!isEnabled()) {
    return interaction.reply({
      content: '❌ Xbox integration is not configured. Set `OPENXBL_API_KEY` in your environment variables.',
      ephemeral: true,
    });
  }

  const sub = interaction.options.getSubcommand();
  const gamertag = interaction.options.getString('gamertag');

  await interaction.deferReply();

  try {
    // Always search by gamertag first to get XUID
    const searchResult = await searchPlayer(gamertag);
    const people = searchResult?.people;

    if (!people || people.length === 0) {
      return interaction.editReply(`❌ No Xbox Live player found for gamertag **${gamertag}**.`);
    }

    const player = people[0];
    const xuid = player.xuid;
    const displayName = player.gamertag || gamertag;
    const gamerpic = player.displayPicRaw || null;
    const gamerscore = player.gamerScore || '0';
    const accountTier = player.detail?.accountTier || 'Xbox';

    if (sub === 'player') {
      const embed = new EmbedBuilder()
        .setTitle(`🎮 ${displayName}`)
        .setColor(0x107c10) // Xbox green
        .setThumbnail(gamerpic)
        .addFields(
          { name: 'Gamertag', value: displayName, inline: true },
          { name: 'Gamerscore', value: `🏆 ${gamerscore}`, inline: true },
          { name: 'Account Tier', value: accountTier, inline: true },
          { name: 'XUID', value: xuid, inline: false },
        )
        .setFooter({ text: 'Powered by OpenXBL • xbl.io' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'achievements') {
      const data = await getAchievements(xuid);
      const achievements = data?.titles?.slice(0, 5) || [];

      if (achievements.length === 0) {
        return interaction.editReply(`No recent achievements found for **${displayName}**.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`🏅 Recent Achievements — ${displayName}`)
        .setColor(0x107c10)
        .setThumbnail(gamerpic)
        .setDescription(
          achievements
            .map(t => `**${t.name}** — ${t.currentAchievements ?? 0}/${t.totalAchievements ?? '?'} (${t.currentGamerscore ?? 0} G)`)
            .join('\n')
        )
        .setFooter({ text: 'Powered by OpenXBL • xbl.io' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'status') {
      const presenceData = await getPresence(xuid);
      const presenceList = presenceData?.people || [];
      const presence = presenceList[0];

      const state = presence?.presenceState || 'Unknown';
      const device = presence?.presenceDetails?.[0]?.device || 'Unknown';
      const titleName = presence?.presenceDetails?.[0]?.titleName || null;

      const statusLine = state === 'Online'
        ? titleName ? `🟢 Online — Playing **${titleName}** on ${device}` : `🟢 Online on ${device}`
        : `⚫ ${state}`;

      const embed = new EmbedBuilder()
        .setTitle(`📡 Status — ${displayName}`)
        .setColor(state === 'Online' ? 0x107c10 : 0x555555)
        .setThumbnail(gamerpic)
        .setDescription(statusLine)
        .setFooter({ text: 'Powered by OpenXBL • xbl.io' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error('[Xbox] Error:', err);
    return interaction.editReply(`❌ Failed to fetch Xbox data: ${err.message}`);
  }
}
