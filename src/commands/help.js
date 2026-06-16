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
            .setDescription('Generate custom profile icons, server banners, avatar overlays, and transparent logos.')
            .addFields(
                {
                    name: '`/icon` — 400×400 profile icon',
                    value: '`text` `size` `color` `glow` `background` `font(opt)`\n**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`',
                },
                {
                    name: '`/banner` — 1024×320 server banner',
                    value: '`text` `size` `color` `glow` `background` `subtitle(opt)` `font(opt)`\n**Example:** `/banner text:MyServer size:90 color:#00FFFF glow:Medium background:Plain (Black) subtitle:Est. 2024`',
                },
                {
                    name: '`/avatar` — Text overlay on your Discord avatar',
                    value: '`text` `size` `color` `glow` `position` `circular(opt)` `font(opt)`\n**Example:** `/avatar text:Nova size:60 color:#FFFFFF glow:High position:Bottom circular:True`',
                },
                {
                    name: '`/logo` — 512×512 transparent PNG logo',
                    value: '`text` `size` `color` `glow` `shape(opt)` `font(opt)`\nShapes: `None`, `Circle Ring`, `Underline`\n**Example:** `/logo text:Nova size:120 color:#FF4500 glow:High shape:Circle Ring`',
                },
                {
                    name: '`/help` — Show this reference',
                    value: 'Only visible to you.',
                }
            )
            .setFooter({ text: 'Discord Icon Gen • forked from NoVa-Gh0ul' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
