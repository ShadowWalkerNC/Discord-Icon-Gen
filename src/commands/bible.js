'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_BASE = 'https://api.scripture.api.bible/v1';
const API_KEY  = process.env.BIBLE_API_KEY || 'BlNJgx4ZN2v7tFpUJxEXY';

// Popular Bible IDs — add more as needed
const BIBLES = {
  kjv:  { id: 'de4e12af7f28f599-02', label: 'King James Version' },
  asv:  { id: '685d1470fe4d5c3b-01', label: 'American Standard Version' },
  web:  { id: '9879dbb7cfe39e4d-04', label: 'World English Bible' },
  nlt:  { id: '65eec8e0b60e656b-01', label: 'New Living Translation' },
};

const DEFAULT_BIBLE = 'kjv';
const ACCENT_COLOR  = 0x8b0000;

async function bibleGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'api-key': API_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API.Bible ${res.status}: ${txt.slice(0, 120)}`);
  }
  return res.json();
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── Subcommand: verse ─────────────────────────────────────────────────────────
async function handleVerse(interaction) {
  const ref        = interaction.options.getString('reference');   // e.g. JHN.3.16
  const versionKey = interaction.options.getString('version') ?? DEFAULT_BIBLE;
  const bible      = BIBLES[versionKey] ?? BIBLES[DEFAULT_BIBLE];

  await interaction.deferReply();

  const data = await bibleGet(
    `/bibles/${bible.id}/verses/${encodeURIComponent(ref)}` +
    `?content-type=text&include-verse-numbers=false&include-titles=false`
  );

  const verse   = data.data;
  const content = stripHtml(verse.content);

  if (!content) {
    return interaction.editReply({ content: `❌ No content found for **${ref}**. Check the reference format (e.g. \`JHN.3.16\`).` });
  }

  const embed = new EmbedBuilder()
    .setColor(ACCENT_COLOR)
    .setTitle(`📖 ${verse.reference}`)
    .setDescription(`*"${content}"*`)
    .setFooter({ text: bible.label })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ── Subcommand: passage ───────────────────────────────────────────────────────
async function handlePassage(interaction) {
  const passageId  = interaction.options.getString('passage');   // e.g. JHN.3.16-JHN.3.21
  const versionKey = interaction.options.getString('version') ?? DEFAULT_BIBLE;
  const bible      = BIBLES[versionKey] ?? BIBLES[DEFAULT_BIBLE];

  await interaction.deferReply();

  const data = await bibleGet(
    `/bibles/${bible.id}/passages/${encodeURIComponent(passageId)}` +
    `?content-type=text&include-verse-numbers=true&include-titles=false`
  );

  const passage = data.data;
  let   content = stripHtml(passage.content);

  // Discord embed description cap: 4096 chars
  if (content.length > 3800) content = content.slice(0, 3800) + '\n…*(truncated)*';

  const embed = new EmbedBuilder()
    .setColor(ACCENT_COLOR)
    .setTitle(`📖 ${passage.reference}`)
    .setDescription(content)
    .setFooter({ text: bible.label })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ── Subcommand: search ────────────────────────────────────────────────────────
async function handleSearch(interaction) {
  const query      = interaction.options.getString('query');
  const versionKey = interaction.options.getString('version') ?? DEFAULT_BIBLE;
  const bible      = BIBLES[versionKey] ?? BIBLES[DEFAULT_BIBLE];

  await interaction.deferReply();

  const data = await bibleGet(
    `/bibles/${bible.id}/search?query=${encodeURIComponent(query)}&limit=5&sort=relevance`
  );

  const verses = data.data?.verses ?? [];
  if (!verses.length) {
    return interaction.editReply({ content: `🔍 No results for **"${query}"** in ${bible.label}.` });
  }

  const lines = verses.map(v => `**${v.reference}** — ${stripHtml(v.text).slice(0, 200)}`);

  const embed = new EmbedBuilder()
    .setColor(ACCENT_COLOR)
    .setTitle(`🔍 Search: "${query}"`)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `${bible.label} • top ${verses.length} result${verses.length !== 1 ? 's' : ''}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ── Subcommand: votd (Verse of the Day) ───────────────────────────────────────
// Uses a fixed well-known inspirational verse seeded by day-of-year
const VOTD_POOL = [
  'JHN.3.16','PSA.23.1','PHP.4.13','ROM.8.28','PRO.3.5','ISA.40.31',
  'JER.29.11','MAT.6.33','HEB.11.1','ROM.12.2','GAL.5.22','PSA.46.1',
  '1CO.13.4','EPH.2.8','2TI.1.7','PSA.119.105','MAT.5.16','JAM.1.5',
  'JHN.14.6','ROM.5.8','PHP.4.7','PRO.22.6','LUK.6.31','MAT.28.19',
];

async function handleVotd(interaction) {
  const versionKey = interaction.options.getString('version') ?? DEFAULT_BIBLE;
  const bible      = BIBLES[versionKey] ?? BIBLES[DEFAULT_BIBLE];

  await interaction.deferReply();

  const now    = new Date();
  const start  = new Date(now.getFullYear(), 0, 0);
  const doy    = Math.floor((now - start) / 86_400_000);
  const verseId = VOTD_POOL[doy % VOTD_POOL.length];

  const data = await bibleGet(
    `/bibles/${bible.id}/verses/${verseId}` +
    `?content-type=text&include-verse-numbers=false&include-titles=false`
  );

  const verse   = data.data;
  const content = stripHtml(verse.content);

  const embed = new EmbedBuilder()
    .setColor(ACCENT_COLOR)
    .setTitle(`✨ Verse of the Day — ${verse.reference}`)
    .setDescription(`*"${content}"*`)
    .setFooter({ text: `${bible.label} • ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ── Command definition ────────────────────────────────────────────────────────
const VERSION_CHOICES = Object.entries(BIBLES).map(([k, v]) => ({ name: v.label, value: k }));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bible')
    .setDescription('Look up Bible verses, passages, and more')

    .addSubcommand(sub => sub
      .setName('verse')
      .setDescription('Look up a single verse (e.g. JHN.3.16)')
      .addStringOption(o => o.setName('reference').setDescription('Verse ID, e.g. JHN.3.16 or PSA.23.1').setRequired(true))
      .addStringOption(o => o.setName('version').setDescription('Bible version').addChoices(...VERSION_CHOICES))
    )

    .addSubcommand(sub => sub
      .setName('passage')
      .setDescription('Look up a passage (e.g. JHN.3.16-JHN.3.21)')
      .addStringOption(o => o.setName('passage').setDescription('Passage ID, e.g. JHN.3.16-JHN.3.21').setRequired(true))
      .addStringOption(o => o.setName('version').setDescription('Bible version').addChoices(...VERSION_CHOICES))
    )

    .addSubcommand(sub => sub
      .setName('search')
      .setDescription('Search the Bible by keyword or phrase')
      .addStringOption(o => o.setName('query').setDescription('Search term, e.g. "love your neighbour"').setRequired(true))
      .addStringOption(o => o.setName('version').setDescription('Bible version').addChoices(...VERSION_CHOICES))
    )

    .addSubcommand(sub => sub
      .setName('votd')
      .setDescription('Get today\'s Verse of the Day')
      .addStringOption(o => o.setName('version').setDescription('Bible version').addChoices(...VERSION_CHOICES))
    ),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      if (sub === 'verse')   return await handleVerse(interaction);
      if (sub === 'passage') return await handlePassage(interaction);
      if (sub === 'search')  return await handleSearch(interaction);
      if (sub === 'votd')    return await handleVotd(interaction);
    } catch (err) {
      const msg = `❌ Bible API error: ${(err.message || err).toString().slice(0, 200)}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  },
};
