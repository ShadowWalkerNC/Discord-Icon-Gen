'use strict';
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_ID = process.env.BIBLE_ID || 'de4e12af7f28f599-01'; // KJV default
const BASE = 'https://rest.api.bible/v1';

const data = new SlashCommandBuilder()
    .setName('bible')
    .setDescription('Look up a Bible verse or passage')
    .addStringOption(o =>
        o.setName('reference')
         .setDescription('Verse reference e.g. John 3:16, Genesis 1:1-3')
         .setRequired(true));

async function execute(interaction) {
    if (!API_KEY) {
        return interaction.reply({
            content: '\u2699\ufe0f Bible API is not configured. Set `BIBLE_API_KEY` in your environment.',
            ephemeral: true,
        });
    }

    await interaction.deferReply();
    const ref = interaction.options.getString('reference').trim();

    try {
        const searchRes = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(ref)}&limit=1`,
            { headers: { 'api-key': API_KEY } }
        );
        const searchData = await searchRes.json();
        const verses = searchData?.data?.verses;
        if (!verses || !verses.length) {
            return interaction.editReply({ content: `\u274c No results found for **${ref}**.` });
        }

        const passageRes = await fetch(
            `${BASE}/bibles/${BIBLE_ID}/passages/${encodeURIComponent(verses[0].id)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`,
            { headers: { 'api-key': API_KEY } }
        );
        const passageData = await passageRes.json();
        const passage = passageData?.data;
        if (!passage) return interaction.editReply({ content: '\u274c Could not retrieve passage text.' });

        const text = passage.content
            .replace(/\[\d+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1900);

        const embed = new EmbedBuilder()
            .setTitle(`\ud83d\udcd6 ${passage.reference}`)
            .setDescription(text)
            .setColor('#1e3a5f')
            .setFooter({ text: 'King James Version \u2022 api.bible' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    } catch (err) {
        return interaction.editReply({ content: `\u274c Bible lookup failed: ${err.message}` });
    }
}

module.exports = { data, execute };
