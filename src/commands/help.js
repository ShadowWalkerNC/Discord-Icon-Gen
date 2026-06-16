const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    cooldown: 1,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and how to use them.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#808080')
            .setTitle('Discord Icon Gen \u2014 Command Reference')
            .setDescription('Generate custom profile icons, server banners, avatar overlays, and transparent logos.')
            .addFields(
                {
                    name: '`/icon` \u2014 400\u00d7400 profile icon',
                    value: '`text` `size` `color` `glow` `background` `font(opt)`\n**Example:** `/icon text:Nova size:80 color:#FF4500 glow:High background:Plain (Black)`',
                },
                {
                    name: '`/banner` \u2014 1024\u00d7320 server banner',
                    value: '`text` `size` `color` `glow` `background` `subtitle(opt)` `font(opt)`\n**Example:** `/banner text:MyServer size:90 color:#00FFFF glow:Medium background:Plain (Black) subtitle:Est. 2024`',
                },
                {
                    name: '`/avatar` \u2014 Text overlay on your Discord avatar',
                    value: '`text` `size` `color` `glow` `position` `circular(opt)` `font(opt)`\n**Example:** `/avatar text:Nova size:60 color:#FFFFFF glow:High position:Bottom circular:True`',
                },
                {
                    name: '`/logo` \u2014 512\u00d7512 transparent PNG logo',
                    value: '`text` `size` `color` `glow` `shape(opt)` `font(opt)`\nShapes: `None`, `Circle Ring`, `Underline`\n**Example:** `/logo text:Nova size:120 color:#FF4500 glow:High shape:Circle Ring`',
                },
                {
                    name: '`/help` \u2014 Show this reference',
                    value: 'Only visible to you.',
                }
            )
            .setFooter({ text: 'Discord Icon Gen \u2022 forked from NoVa-Gh0ul' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
