'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { guiPost } = require('../util/guiRequest.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mediaconfig')
        .setDescription('Configure live ASCILINE playback settings (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s =>
            s.setName('volume')
             .setDescription('Set the playback volume')
             .addIntegerOption(o =>
                 o.setName('level').setDescription('Volume 0–5').setMinValue(0).setMaxValue(5).setRequired(true)))
        .addSubcommand(s =>
            s.setName('seek')
             .setDescription('Seek to a timestamp in the current video')
             .addNumberOption(o =>
                 o.setName('seconds').setDescription('Timestamp in seconds').setMinValue(0).setRequired(true)))
        .addSubcommand(s =>
            s.setName('mode')
             .setDescription('Change the ASCII render mode')
             .addIntegerOption(o =>
                 o.setName('value').setDescription('Mode 1–5').setMinValue(1).setMaxValue(5).setRequired(true)))
        .addSubcommand(s =>
            s.setName('cols')
             .setDescription('Set terminal column width')
             .addIntegerOption(o =>
                 o.setName('width').setDescription('Width 40–500').setMinValue(40).setMaxValue(500).setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const sub = interaction.options.getSubcommand();

        if (sub === 'volume') {
            const vol = interaction.options.getInteger('level');
            let res;
            try { res = await guiPost('/api/media/volume', { vol }); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(0x39FF14).setTitle(`🔊 Volume → ${vol}/5`).setDescription('Volume updated for the current stream.')],
            });
        }

        if (sub === 'seek') {
            const time = interaction.options.getNumber('seconds');
            let res;
            try { res = await guiPost('/api/media/seek', { time }); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            const mm = Math.floor(time / 60);
            const ss = String(Math.floor(time % 60)).padStart(2, '0');
            return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(0x39FF14).setTitle(`⏩ Seeked to ${mm}:${ss}`).setDescription(`Playback jumped to **${mm}m ${ss}s**.`)],
            });
        }

        if (sub === 'mode') {
            const mode = interaction.options.getInteger('value');
            const modeLabels = { 1: 'Standard ASCII', 2: 'Extended ASCII', 3: 'Braille', 4: 'Block', 5: 'Color Block' };
            let res;
            try { res = await guiPost('/api/media/mode', { mode }); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(0x39FF14).setTitle(`🎨 Mode → ${mode}`).setDescription(`Render mode set to **${modeLabels[mode] || mode}**. Takes effect on the next frame.`)],
            });
        }

        if (sub === 'cols') {
            const cols = interaction.options.getInteger('width');
            let res;
            try { res = await guiPost('/api/media/cols', { cols }); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(0x39FF14).setTitle(`📏 Columns → ${cols}`).setDescription(`Terminal width set to **${cols}** columns. Takes effect on the next frame.`)],
            });
        }
    },
};

function errEmbed(msg) {
    return new EmbedBuilder().setColor(0xFF0000).setTitle('❌ ASCILINE Unreachable').setDescription('Cannot reach the stream server. Make sure both servers are running.').setFooter({ text: msg });
}
function warnEmbed(msg) {
    return new EmbedBuilder().setColor(0xFF6600).setTitle('⚠️ Error').setDescription(msg || 'Unknown error.');
}
