const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { searchPlayer, getAchievements, getPresence, isEnabled } = require('../services/xbox.js');

const data = new SlashCommandBuilder()
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

async function execute(interaction) {
  if (!isEnabled()) {
    return interaction.reply({
      content: '\u274c Xbox integration is not configured. Set `OPENXBL_API_KEY` in your environment variables.',
      ephemeral: true,
    });
  }

  const sub = interaction.options.getSubcommand();
  const gamertag = interaction.options.getString('gamertag');

  await interaction.deferReply();

  try {
    const searchResult = await searchPlayer(gamertag);
    const people = searchResult?.people;

    if (!people || people.length === 0) {
      return interaction.editReply(`\u274c No Xbox Live player found for gamertag **${gamertag}**.`);
    }

    const player = people[0];
    const xuid = player.xuid;
    const displayName = player.gamertag || gamertag;
    const gamerpic = player.displayPicRaw || null;
    const gamerscore = player.gamerScore || '0';
    const accountTier = player.detail?.accountTier || 'Xbox';

    if (sub === 'player') {
      const embed = new EmbedBuilder()
        .setTitle(`\ud83c\udfae ${displayName}`)
        .setColor(0x107c10)
        .setThumbnail(gamerpic)
        .addFields(
          { name: 'Gamertag', value: displayName, inline: true },
          { name: 'Gamerscore', value: `\ud83c\udfc6 ${gamerscore}`, inline: true },
          { name: 'Account Tier', value: accountTier, inline: true },
          { name: 'XUID', value: xuid, inline: false },
        )
        .setFooter({ text: 'Powered by OpenXBL \u2022 xbl.io' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'achievements') {
      const achData = await getAchievements(xuid);
      const achievements = achData?.titles?.slice(0, 5) || [];

      if (achievements.length === 0) {
        return interaction.editReply(`No recent achievements found for **${displayName}**.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`\ud83c\udfc5 Recent Achievements \u2014 ${displayName}`)
        .setColor(0x107c10)
        .setThumbnail(gamerpic)
        .setDescription(
          achievements
            .map(t => `**${t.name}** \u2014 ${t.currentAchievements ?? 0}/${t.totalAchievements ?? '?'} (${t.currentGamerscore ?? 0} G)`)
            .join('\n')
        )
        .setFooter({ text: 'Powered by OpenXBL \u2022 xbl.io' })
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
        ? titleName ? `\ud83d\udfe2 Online \u2014 Playing **${titleName}** on ${device}` : `\ud83d\udfe2 Online on ${device}`
        : `\u26ab ${state}`;

      const embed = new EmbedBuilder()
        .setTitle(`\ud83d\udce1 Status \u2014 ${displayName}`)
        .setColor(state === 'Online' ? 0x107c10 : 0x555555)
        .setThumbnail(gamerpic)
        .setDescription(statusLine)
        .setFooter({ text: 'Powered by OpenXBL \u2022 xbl.io' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error('[Xbox] Error:', err);
    return interaction.editReply(`\u274c Failed to fetch Xbox data: ${err.message}`);
  }
}

module.exports = { data, execute };
