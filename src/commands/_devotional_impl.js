'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_ID = process.env.BIBLE_ID || 'de4e12af7f28f599-02';
const BASE = 'https://api.scripture.api.bible/v1';

const DEVOTIONAL_VERSES = [
    'JHN.3.16', 'PSA.23.1', 'ROM.8.28', 'PHP.4.13', 'ISA.40.31',
    'JER.29.11', 'PRO.3.5', 'MAT.6.33', 'PSA.46.1', 'ROM.12.2',
    'EPH.2.8', 'HEB.11.1', 'JAM.1.2', '1CO.13.4', 'PSA.119.105',
    'MAT.11.28', 'JHN.14.6', 'PHP.4.6', '2TI.1.7', 'GAL.5.22',
];

const data = new SlashCommandBuilder()
    .setName('devotional')
    .setDescription('Get a daily devotional verse');

async function execute(interaction) {
    if (!API_KEY) {
        return interaction.reply({
            content: '\u2699\ufe0f Bible API is not configured. Set `BIBLE_API_KEY` in your environment.',
            ephemeral: true,
        });
    }

    await interaction.deferReply();

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const verseId = DEVOTIONAL_VERSES[dayOfYear % DEVOTIONAL_VERSES.length];

    try {
        const res = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/verses/${encodeURIComponent(verseId)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`,
            { headers: { 'api-key': API_KEY } }
        );
        const json = await res.json();
        const verse = json?.data;
        if (!verse) return interaction.editReply({ content: '\u274c Could not load today\'s devotional.' });

        const text = verse.content
            .replace(/\[\d+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const dateStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        const embed = new EmbedBuilder()
            .setTitle(`\ud83d\ude4f Daily Devotional \u2014 ${dateStr}`)
            .setDescription(`**${verse.reference}**\n\n${text}`)
            .setColor('#d4a017')
            .setFooter({ text: 'American Standard Version \u2022 api.bible' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (err) {
        return interaction.editReply({ content: `\u274c Error fetching devotional: ${err.message}` });
    }
}

module.exports = { data, execute };
