const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and confirm Sigil is responding'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '\uD83C\uDFD3 Pinging...', fetchReply: true, ephemeral: true });

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency  = interaction.client.ws.ping;

        const status = roundtrip < 200 ? '\uD83D\uDFE2 Excellent'
                     : roundtrip < 500 ? '\uD83D\uDFE1 Good'
                     : roundtrip < 1000 ? '\uD83D\uDFE0 Slow'
                     : '\uD83D\uDD34 High';

        const embed = new EmbedBuilder()
            .setTitle('\uD83C\uDFD3 Pong!')
            .setColor(
                roundtrip < 200  ? '#39FF14' :
                roundtrip < 500  ? '#FFD700' :
                roundtrip < 1000 ? '#FF6B35' : '#FF0000'
            )
            .addFields(
                { name: 'Roundtrip',    value: `${roundtrip}ms`,  inline: true },
                { name: 'WS Latency',   value: `${wsLatency}ms`,  inline: true },
                { name: 'Status',       value: status,            inline: true },
            )
            .setFooter({ text: 'Sigil \u2022 ping \u2014 bot is online and responding' })
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
