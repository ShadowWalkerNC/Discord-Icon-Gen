'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guiPost } = require('../util/guiRequest.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Queue a video or URL to stream in ASCII on the ASCILINE server')
        .addStringOption(o =>
            o.setName('url')
             .setDescription('Video URL (YouTube, Twitch, Twitter, direct .mp4, etc.) or local filename')
             .setRequired(true))
        .addIntegerOption(o =>
            o.setName('mode')
             .setDescription('ASCII render mode (1–5, default 1)')
             .setMinValue(1).setMaxValue(5))
        .addIntegerOption(o =>
            o.setName('volume')
             .setDescription('Volume level (0–5, default 1)')
             .setMinValue(0).setMaxValue(5))
        .addIntegerOption(o =>
            o.setName('cols')
             .setDescription('Terminal column width (default: auto)')
             .setMinValue(40).setMaxValue(500))
        .addBooleanOption(o =>
            o.setName('pixel')
             .setDescription('Use pixel/block mode instead of ASCII characters'))
        .addBooleanOption(o =>
            o.setName('loop')
             .setDescription('Loop this video continuously')),

    async execute(interaction) {
        await interaction.deferReply();

        const url   = interaction.options.getString('url');
        const mode  = interaction.options.getInteger('mode')   ?? 1;
        const vol   = interaction.options.getInteger('volume') ?? 1;
        const cols  = interaction.options.getInteger('cols')   ?? undefined;
        const pixel = interaction.options.getBoolean('pixel')  ?? false;
        const loop  = interaction.options.getBoolean('loop')   ?? false;

        let res;
        try {
            res = await guiPost('/api/media/enqueue', { url, mode, vol, cols, pixel, loop });
        } catch (err) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ ASCILINE Unreachable')
                    .setDescription('Cannot reach the ASCILINE stream server. Make sure `stream_server.py` and `gui-server.js` are running.')
                    .setFooter({ text: err.message })],
            });
        }

        if (!res.ok) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF6600)
                    .setTitle('⚠️ Enqueue Failed')
                    .setDescription(res.error || 'Unknown error from stream server.')],
            });
        }

        const short = url.length > 72 ? url.slice(0, 69) + '...' : url;
        const flags = [
            `Mode **${mode}**`,
            `Vol **${vol}/5**`,
            cols  ? `Cols **${cols}**`  : null,
            pixel ? '🟣 **Pixel**'      : null,
            loop  ? '🔁 **Loop**'       : null,
        ].filter(Boolean).join('  •  ');

        const embed = new EmbedBuilder()
            .setColor(0x39FF14)
            .setTitle(`▶️ Queued #${res.position}`)
            .setDescription(`\`${short}\``)
            .addFields({ name: 'Settings', value: flags })
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        if (res.position === 1)
            embed.addFields({ name: 'Status', value: '🟢 Playing now' });
        else
            embed.addFields({ name: 'Status', value: `🟡 Position ${res.position} in queue` });

        return interaction.editReply({ embeds: [embed] });
    },
};
