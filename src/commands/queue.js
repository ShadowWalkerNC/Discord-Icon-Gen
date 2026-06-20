'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guiGet, guiPost } = require('../util/guiRequest.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View or manage the ASCILINE media queue')
        .addSubcommand(s =>
            s.setName('list')
             .setDescription('Show the current video queue'))
        .addSubcommand(s =>
            s.setName('skip')
             .setDescription('Skip the current video'))
        .addSubcommand(s =>
            s.setName('stop')
             .setDescription('Stop playback and clear the entire queue'))
        .addSubcommand(s =>
            s.setName('loop')
             .setDescription('Toggle loop mode on or off')
             .addStringOption(o =>
                 o.setName('state')
                  .setDescription('on or off (omit to toggle)')
                  .addChoices(
                      { name: 'On',  value: 'on' },
                      { name: 'Off', value: 'off' },
                  ))),

    async execute(interaction) {
        await interaction.deferReply();
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            let res;
            try { res = await guiGet('/api/media/queue'); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });

            if (!res.queue.length) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle('📋 Queue Empty')
                        .setDescription('Nothing is queued. Use `/play` to add videos.')],
                });
            }

            const lines = res.queue.map((e, i) => {
                const cur   = i === res.current_index ? ' ◀ **NOW**' : '';
                const label = e.video.length > 60 ? e.video.slice(0, 57) + '...' : e.video;
                const meta  = `mode=${e.mode} vol=${e.vol}${e.pixel ? ' pixel' : ''}${e.loop ? ' loop' : ''}`;
                return `\`${String(i + 1).padStart(2)}.\` ${label}${cur}\n​    \`${meta}\``;
            });

            let desc = lines.join('\n');
            if (desc.length > 3800) desc = desc.slice(0, 3800) + `\n...and more`;

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle(`📋 Queue — ${res.queue.length} item(s)`)
                    .setDescription(desc)
                    .setFooter({ text: 'ASCILINE Stream Server' })
                    .setTimestamp()],
            });
        }

        if (sub === 'skip') {
            let res;
            try { res = await guiPost('/api/media/skip', {}); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('⏭️ Skipped')
                    .setDescription('Moving to the next video in the queue.')],
            });
        }

        if (sub === 'stop') {
            let res;
            try { res = await guiPost('/api/media/stop', {}); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⏹️ Stopped')
                    .setDescription('Playback stopped and queue cleared.')],
            });
        }

        if (sub === 'loop') {
            const state = interaction.options.getString('state');
            let enabled;
            if (state === 'on')       enabled = true;
            else if (state === 'off') enabled = false;
            else {
                try { const s = await guiGet('/api/media/status'); enabled = !s.loop; }
                catch { enabled = true; }
            }
            let res;
            try { res = await guiPost('/api/media/loop', { enabled }); }
            catch (err) { return interaction.editReply({ embeds: [errEmbed(err.message)] }); }
            if (!res.ok) return interaction.editReply({ embeds: [warnEmbed(res.error)] });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(enabled ? 0x39FF14 : 0x808080)
                    .setTitle(enabled ? '🔁 Loop Enabled' : '➡️ Loop Disabled')
                    .setDescription(enabled
                        ? 'The current video will loop continuously.'
                        : 'Loop mode is now off.')],
            });
        }
    },
};

function errEmbed(msg) {
    return new EmbedBuilder().setColor(0xFF0000).setTitle('❌ ASCILINE Unreachable').setDescription('Cannot reach the stream server.').setFooter({ text: msg });
}
function warnEmbed(msg) {
    return new EmbedBuilder().setColor(0xFF6600).setTitle('⚠️ Error').setDescription(msg || 'Unknown error from stream server.');
}
