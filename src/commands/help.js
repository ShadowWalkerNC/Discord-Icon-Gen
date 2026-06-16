const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and how to use them.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('Discord Icon Gen — Command Reference')
            .setDescription('Generate custom profile icons, server banners, and avatar overlays directly in Discord.')
            .addFields(
                {
                    name: '`/icon` — Generate a 400×400 profile icon',
                    value: [
                        '**`text`** *(required)* — Text to display. Max 20 characters.',
                        '**`size`** *(required)* — Font size in pixels. Range: 10–200.',
                        '**`color`** *(required)* — Hex color (e.g. `#FF0000`).',
                        '**`glow`** *(required)* — `Low`, `Medium`, or `High`.',
                        '**`background`** *(required)* — `Plain (Black)`, `Custom Background 1`, or `Custom Background 2`.',
                        '**`font`** *(optional)* — Font style. Default: `Another Danger`.',
                        '',
                        '**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`',
                    ].join('\n'),
                },
                {
                    name: '`/banner` — Generate a 1024×320 server banner',
                    value: [
                        '**`text`** *(required)* — Primary text. Max 30 characters.',
                        '**`size`** *(required)* — Font size in pixels. Range: 10–150.',
                        '**`color`** *(required)* — Hex color (e.g. `#00FFFF`).',
                        '**`glow`** *(required)* — `Low`, `Medium`, or `High`.',
                        '**`background`** *(required)* — `Plain (Black)`, `Custom Background 1`, or `Custom Background 2`.',
                        '**`subtitle`** *(optional)* — Smaller text beneath the main text. Max 50 chars.',
                        '**`font`** *(optional)* — Font style. Default: `Another Danger`.',
                        '',
                        '**Example:** `/banner text:MyServer size:90 color:#00FFFF glow:Medium background:Plain (Black) subtitle:Est. 2024`',
                    ].join('\n'),
                },
                {
                    name: '`/avatar` — Overlay text on your Discord avatar',
                    value: [
                        '**`text`** *(required)* — Text to overlay. Max 20 characters.',
                        '**`size`** *(required)* — Font size in pixels. Range: 10–150.',
                        '**`color`** *(required)* — Hex color (e.g. `#FFFFFF`).',
                        '**`glow`** *(required)* — `Low`, `Medium`, or `High`.',
                        '**`position`** *(required)* — Text placement: `Top`, `Center`, or `Bottom`.',
                        '**`circular`** *(optional)* — Crop avatar into a circle. Default: `False`.',
                        '**`font`** *(optional)* — Font style. Default: `Another Danger`.',
                        '',
                        '**Example:** `/avatar text:Nova size:60 color:#FFFFFF glow:High position:Bottom circular:True`',
                    ].join('\n'),
                },
                {
                    name: '`/help` — Show this reference',
                    value: 'Displays all commands and options. Only visible to you.',
                }
            )
            .setFooter({ text: 'Discord Icon Gen • forked from NoVa-Gh0ul' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
