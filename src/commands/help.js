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
            .setDescription('Generate custom profile icons and server banners directly in Discord.')
            .addFields(
                {
                    name: '`/icon` — Generate a 400×400 profile icon',
                    value: [
                        '**`text`** *(required)* — Text to display. Max 20 characters.',
                        '**`size`** *(required)* — Font size in pixels. Range: 10–200.',
                        '**`color`** *(required)* — Text color as a hex code (e.g. `#FF0000`).',
                        '**`glow`** *(required)* — Glow intensity: `Low`, `Medium`, or `High`.',
                        '**`background`** *(required)* — `Plain (Black)`, `Custom Background 1`, or `Custom Background 2`.',
                        '**`font`** *(optional)* — Font style. Defaults to `Another Danger`.',
                        '',
                        '**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`',
                    ].join('\n'),
                },
                {
                    name: '`/banner` — Generate a 1024×320 server banner',
                    value: [
                        '**`text`** *(required)* — Primary text. Max 30 characters.',
                        '**`size`** *(required)* — Font size in pixels. Range: 10–150.',
                        '**`color`** *(required)* — Text color as a hex code (e.g. `#00FFFF`).',
                        '**`glow`** *(required)* — Glow intensity: `Low`, `Medium`, or `High`.',
                        '**`background`** *(required)* — `Plain (Black)`, `Custom Background 1`, or `Custom Background 2`.',
                        '**`subtitle`** *(optional)* — Smaller text beneath the main text. Max 50 characters.',
                        '**`font`** *(optional)* — Font style. Defaults to `Another Danger`.',
                        '',
                        '**Example:** `/banner text:MyServer size:90 color:#00FFFF glow:Medium background:Plain (Black) subtitle:Est. 2024`',
                    ].join('\n'),
                },
                {
                    name: '`/help` — Show this reference',
                    value: 'Displays all commands and their options. Only visible to you.',
                }
            )
            .setFooter({ text: 'Discord Icon Gen • forked from NoVa-Gh0ul' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
