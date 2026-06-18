const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all Sigil commands and options'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📖 Sigil — Command Reference')
            .setColor('#8B0000')
            .setDescription('Generate Discord server icons, banners, and full brand kits powered by AI.')
            .addFields(
                {
                    name: '🖼️ `/icon`',
                    value: [
                        '`text` *(required)* — text to render',
                        '`shape` — Circle / Rounded / Square / Hexagon / Diamond',
                        '`background` — one of 20 presets',
                        '`border` — none / solid / glow / gradient / double / dashed',
                        '`primary_color` / `secondary_color` — hex color with autocomplete',
                        '`font` — Arial Black, Impact, Bebas Neue…',
                        '`glow` — 0–25',
                        '`opacity` — 0.0–1.0',
                    ].join('\n'),
                },
                {
                    name: '🎨 `/logo`',
                    value: [
                        '`text` *(required)*',
                        '`shape` — Circle / Rounded / Square / Hexagon / Diamond',
                        '`background`, `primary_color`, `secondary_color`, `font`, `glow`',
                        '`transparent` — true/false for transparent background',
                    ].join('\n'),
                },
                {
                    name: '🏞️ `/banner`',
                    value: [
                        '`text` *(required)*',
                        '`subtitle`, `background`, `border`, `primary_color`, `secondary_color`',
                        '`font`, `glow`, `opacity`, `align` (left / center / right)',
                    ].join('\n'),
                },
                {
                    name: '🤖 `/brand ai`',
                    value: 'Describe your server → Gemini designs a full brand kit (icon + banner + palette + AI image)',
                },
                {
                    name: '📦 `/brand kit`',
                    value: 'Manually specify brand name, tagline, colors, background, border, font, glow',
                },
                {
                    name: '🎲 `/random`',
                    value: 'Generate a fully randomized icon — random shape, colors, background, border, font, glow',
                },
                {
                    name: '🔍 `/compare`',
                    value: 'Side-by-side comparison of two icon configs (two `text` options, each with full styling)',
                },
                {
                    name: '🧑‍🎨 `/avatar`',
                    value: 'Server avatar / profile icon with optional image overlay',
                },
                {
                    name: '🌈 `/mood`',
                    value: 'Generate a 5-color palette from a mood description (AI)',
                },
                {
                    name: '🗂️ `/preview`',
                    value: 'Grid preview of all available backgrounds',
                },
                {
                    name: '💾 `/saveme`',
                    value: 'Save your most recent design as a named kit',
                },
                {
                    name: '📜 `/history`',
                    value: 'View recent command history with copy-paste commands',
                },
                {
                    name: '🖥️ `/gui open`',
                    value: 'Get the link to the visual GUI brand builder',
                },
                {
                    name: '🟢 `/gui status`',
                    value: 'Check if the GUI server is online',
                },
                {
                    name: 'ℹ️ `/status`',
                    value: 'Show bot status, uptime, and version',
                },
            )
            .setFooter({ text: 'Sigil v1.6.0 • /help' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
