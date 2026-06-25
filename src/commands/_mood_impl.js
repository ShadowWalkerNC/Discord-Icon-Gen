'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_ID = process.env.BIBLE_ID || 'de4e12af7f28f599-02';
const BASE = 'https://api.scripture.api.bible/v1';

const MOOD_MAP = {
    joyful:    { emoji: '\ud83d\ude04', color: '#FFD700', verse: 'NEH.8.10',  label: 'Nehemiah 8:10' },
    peaceful:  { emoji: '\u262e\ufe0f',  color: '#87CEEB', verse: 'PHP.4.7',   label: 'Philippians 4:7' },
    anxious:   { emoji: '\ud83d\ude30', color: '#FF8C00', verse: 'PHP.4.6',   label: 'Philippians 4:6' },
    sad:       { emoji: '\ud83d\ude22', color: '#4682B4', verse: 'PSA.34.18', label: 'Psalm 34:18' },
    angry:     { emoji: '\ud83d\ude24', color: '#DC143C', verse: 'EPH.4.26',  label: 'Ephesians 4:26' },
    grateful:  { emoji: '\ud83d\ude4f', color: '#32CD32', verse: '1TH.5.18', label: '1 Thessalonians 5:18' },
    hopeful:   { emoji: '\ud83c\udf05', color: '#FFA07A', verse: 'ROM.15.13', label: 'Romans 15:13' },
    lonely:    { emoji: '\ud83e\udd7a', color: '#9370DB', verse: 'PSA.23.4',  label: 'Psalm 23:4' },
    tired:     { emoji: '\ud83d\ude34', color: '#708090', verse: 'MAT.11.28', label: 'Matthew 11:28' },
    confident: { emoji: '\ud83d\udcaa', color: '#FF4500', verse: 'PHP.4.13',  label: 'Philippians 4:13' },
};

const data = new SlashCommandBuilder()
    .setName('mood')
    .setDescription('Share how you are feeling and receive an encouraging verse')
    .addStringOption(o =>
        o.setName('mood')
         .setDescription('How are you feeling?')
         .setRequired(true)
         .addChoices(
             { name: '\ud83d\ude04 Joyful',    value: 'joyful' },
             { name: '\u262e\ufe0f Peaceful',  value: 'peaceful' },
             { name: '\ud83d\ude30 Anxious',   value: 'anxious' },
             { name: '\ud83d\ude22 Sad',       value: 'sad' },
             { name: '\ud83d\ude24 Angry',     value: 'angry' },
             { name: '\ud83d\ude4f Grateful',  value: 'grateful' },
             { name: '\ud83c\udf05 Hopeful',   value: 'hopeful' },
             { name: '\ud83e\udd7a Lonely',    value: 'lonely' },
             { name: '\ud83d\ude34 Tired',     value: 'tired' },
             { name: '\ud83d\udcaa Confident', value: 'confident' },
         ));

async function execute(interaction) {
    await interaction.deferReply();
    const mood = interaction.options.getString('mood');
    const entry = MOOD_MAP[mood];

    if (!API_KEY) {
        const embed = new EmbedBuilder()
            .setTitle(`${entry.emoji} Feeling ${mood.charAt(0).toUpperCase() + mood.slice(1)}`)
            .setDescription(`A verse for you: **${entry.label}**`)
            .setColor(entry.color)
            .setFooter({ text: 'Set BIBLE_API_KEY to display the full verse text.' })
            .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
    }

    try {
        const res = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/verses/${encodeURIComponent(entry.verse)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`,
            { headers: { 'api-key': API_KEY } }
        );
        const json = await res.json();
        const verse = json?.data;
        const text = verse?.content
            ?.replace(/\[\d+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1500) ?? entry.label;

        const embed = new EmbedBuilder()
            .setTitle(`${entry.emoji} Feeling ${mood.charAt(0).toUpperCase() + mood.slice(1)}, ${interaction.user.displayName}?`)
            .setDescription(`*${text}*\n\n\u2014 **${verse?.reference ?? entry.label}**`)
            .setColor(entry.color)
            .setFooter({ text: 'American Standard Version \u2022 api.bible' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (err) {
        return interaction.editReply({ content: `\u274c Could not fetch verse: ${err.message}` });
    }
}

module.exports = { data, execute };
