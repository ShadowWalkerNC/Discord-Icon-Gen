const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const GUIDE_URL = 'https://github.com/ShadowWalkerNC/Sigil/blob/main/docs/MINECRAFT.md';

const STEPS = [
    {
        title: '1\uFE0F\u20E3 Install DiscordSRV on your Minecraft server',
        value: [
            '\u2022 Download **DiscordSRV** from [SpigotMC](https://www.spigotmc.org/resources/discordsrv.18494/) or [Modrinth](https://modrinth.com/plugin/discordsrv)',
            '\u2022 Place the `.jar` in your server\'s `plugins/` folder',
            '\u2022 Start the server once to generate config files, then stop it',
        ].join('\n'),
    },
    {
        title: '2\uFE0F\u20E3 Create a Discord bot for DiscordSRV',
        value: [
            '\u2022 Go to [discord.com/developers/applications](https://discord.com/developers/applications)',
            '\u2022 Create a new application \u2192 Bot tab \u2192 **Reset Token** \u2192 copy the token',
            '\u2022 Enable **Server Members Intent** and **Message Content Intent** under Privileged Gateway Intents',
            '\u2022 OAuth2 \u2192 URL Generator \u2192 select `bot` scope \u2192 permissions: **Send Messages, Read Message History, Manage Roles** \u2192 invite to your server',
        ].join('\n'),
    },
    {
        title: '3\uFE0F\u20E3 Configure DiscordSRV',
        value: [
            '\u2022 Open `plugins/DiscordSRV/config.yml`',
            '\u2022 Set `BotToken: "YOUR_BOT_TOKEN"`',
            '\u2022 Set `Channels: {"global": "YOUR_CHANNEL_ID"}` (right-click channel \u2192 Copy ID)',
            '\u2022 Optionally set `DiscordConsoleChannelId` for server console output',
        ].join('\n'),
    },
    {
        title: '4\uFE0F\u20E3 Link roles (optional)',
        value: [
            '\u2022 In `config.yml`, set `MinecraftDiscordAccountLinkedRoleNameToAddUserTo` to a Discord role name',
            '\u2022 Players run `/discord link` in-game to link their accounts',
            '\u2022 Linked players automatically receive the configured Discord role',
        ].join('\n'),
    },
    {
        title: '5\uFE0F\u20E3 Start your server and verify',
        value: [
            '\u2022 Start the Minecraft server \u2014 DiscordSRV will connect to Discord on startup',
            '\u2022 Check your linked channel: server start/stop messages should appear',
            '\u2022 Send a message in Discord \u2014 it should appear in Minecraft chat',
            '\u2022 Check `plugins/DiscordSRV/` logs if anything fails',
        ].join('\n'),
    },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('DiscordSRV setup guide \u2014 link your Discord server to a Minecraft server')
        .addStringOption(opt =>
            opt.setName('step')
                .setDescription('Jump to a specific step (default: full guide)')
                .addChoices(
                    { name: '1 \u2014 Install DiscordSRV',          value: '0' },
                    { name: '2 \u2014 Create Discord bot',           value: '1' },
                    { name: '3 \u2014 Configure config.yml',         value: '2' },
                    { name: '4 \u2014 Link roles',                   value: '3' },
                    { name: '5 \u2014 Start server & verify',        value: '4' },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const stepIndex = interaction.options.getString('step');
        const isSingle  = stepIndex !== null;
        const steps     = isSingle ? [STEPS[parseInt(stepIndex, 10)]] : STEPS;

        const embed = new EmbedBuilder()
            .setTitle('\u26F3 DiscordSRV Setup Guide')
            .setColor('#39FF14')
            .setDescription(
                'Connect your Discord server to a Minecraft Java server using **DiscordSRV**.\n' +
                'Players can chat between Discord and Minecraft, link accounts, and sync roles.\n\n' +
                `\uD83D\uDCD6 [Full guide on GitHub](${GUIDE_URL})`
            );

        steps.forEach(s => embed.addFields({ name: s.title, value: s.value }));

        embed.setFooter({
            text: isSingle
                ? `Sigil \u2022 minecraft \u2014 step ${parseInt(stepIndex, 10) + 1} of ${STEPS.length} \u2022 run /minecraft for full guide`
                : `Sigil \u2022 minecraft \u2014 DiscordSRV v1.27+ \u2022 Minecraft Java 1.17\u20131.21 \u2022 full docs: ${GUIDE_URL}`,
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
