'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_ID = process.env.BIBLE_ID || 'de4e12af7f28f599-02';
const BASE = 'https://api.scripture.api.bible/v1';

const data = new SlashCommandBuilder()
    .setName('sermon')
    .setDescription('Get a Bible passage to study or share')
    .addStringOption(o =>
        o.setName('passage')
         .setDescription('Passage reference e.g. Romans 8:1-11, Psalm 23')
         .setRequired(true))
    .addStringOption(o =>
        o.setName('topic')
         .setDescription('Optional topic label e.g. Grace, Faith, Hope')
         .setRequired(false));

async function execute(interaction) {
    if (!API_KEY) {
        return interaction.reply({
            content: '\u2699\ufe0f Bible API is not configured. Set `BIBLE_API_KEY` in your environment.',
            ephemeral: true,
        });
    }

    await interaction.deferReply();
    const passageRef = interaction.options.getString('passage').trim();
    const topic = interaction.options.getString('topic')?.trim();

    try {
        // Search to resolve passage
        const searchRes = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(passageRef)}&limit=1`,
            { headers: { 'api-key': API_KEY } }
        );
        const searchData = await searchRes.json();
        const verses = searchData?.data?.verses;
        if (!verses || !verses.length) {
            return interaction.editReply({ content: `\u274c Could not find passage **${passageRef}**.` });
        }

        const passageRes = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/passages/${encodeURIComponent(verses[0].id)}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
            { headers: { 'api-key': API_KEY } }
        );
        const passageData = await passageRes.json();
        const passage = passageData?.data;
        if (!passage) return interaction.editReply({ content: '\u274c Could not retrieve passage text.' });

        const text = passage.content
            .replace(/\[\d+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2000);

        const embed = new EmbedBuilder()
            .setTitle(`\ud83d\udcdc ${passage.reference}${topic ? ` \u2014 ${topic}` : ''}`)
            .setDescription(text)
            .setColor('#5c2d91')
            .setFooter({ text: 'American Standard Version \u2022 api.bible' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (err) {
        return interaction.editReply({ content: `\u274c Failed to retrieve passage: ${err.message}` });
    }
}

module.exports = { data, execute };
