'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guiGet } = require('../util/guiRequest.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show what is currently streaming on ASCILINE'),

    async execute(interaction) {
        await interaction.deferReply();

        let res;
        try {
            res = await guiGet('/api/media/status');
        } catch (err) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ ASCILINE Unreachable')
                    .setDescription('Cannot reach the stream server. Make sure both servers are running.')
                    .setFooter({ text: err.message })],
            });
        }

        if (!res.ok) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF6600)
                    .setTitle('⚠️ Status Error')
                    .setDescription(res.error || 'Unknown error.')],
            });
        }

        if (!res.playing) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('⏹️ Nothing Playing')
                    .setDescription('The ASCILINE queue is empty. Use `/play` to queue something.')],
            });
        }

        const short = (res.video || '').length > 72
            ? (res.video || '').slice(0, 69) + '...'
            : (res.video || 'Unknown');

        return interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x39FF14)
                .setTitle('🎥 Now Playing')
                .setDescription(`\`${short}\``)
                .addFields(
                    { name: 'Mode',   value: String(res.mode),        inline: true },
                    { name: 'Volume', value: `${res.vol}/5`,          inline: true },
                    { name: 'Pixel',  value: res.pixel ? '🟣 On' : 'Off', inline: true },
                    { name: 'Loop',   value: res.loop  ? '🔁 On' : 'Off', inline: true },
                    { name: 'Queue',  value: `${res.current_index + 1} / ${res.queue_length}`, inline: true },
                )
                .setFooter({ text: 'ASCILINE Stream Server' })
                .setTimestamp()],
        });
    },
};
