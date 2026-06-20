const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sermon')
        .setDescription('Post a sermon announcement with video/audio links')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(opt => opt.setName('title').setDescription('Sermon title').setRequired(true))
        .addStringOption(opt => opt.setName('speaker').setDescription('Speaker / preacher name').setRequired(true))
        .addStringOption(opt => opt.setName('scripture').setDescription('Scripture reference (e.g. John 3:16)').setRequired(false))
        .addStringOption(opt => opt.setName('date').setDescription('Sermon date (e.g. June 22, 2026)').setRequired(false))
        .addStringOption(opt => opt.setName('description').setDescription('Brief description or summary').setRequired(false))
        .addStringOption(opt => opt.setName('video').setDescription('Video URL (YouTube, Vimeo, etc.)').setRequired(false))
        .addStringOption(opt => opt.setName('audio').setDescription('Audio/podcast URL').setRequired(false))
        .addStringOption(opt => opt.setName('notes').setDescription('Study notes or bulletin URL').setRequired(false))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in (defaults to current)').setRequired(false))
        .addRoleOption(opt => opt.setName('ping').setDescription('Role to ping').setRequired(false)),

    async execute(interaction) {
        const title       = interaction.options.getString('title');
        const speaker     = interaction.options.getString('speaker');
        const scripture   = interaction.options.getString('scripture');
        const date        = interaction.options.getString('date');
        const description = interaction.options.getString('description');
        const video       = interaction.options.getString('video');
        const audio       = interaction.options.getString('audio');
        const notes       = interaction.options.getString('notes');
        const target      = interaction.options.getChannel('channel') ?? interaction.channel;
        const ping        = interaction.options.getRole('ping');

        const embed = new EmbedBuilder()
            .setTitle(`\u26EA ${title}`)
            .setColor('#7C3AED')
            .setTimestamp();

        let desc = '';
        if (date)        desc += `\uD83D\uDCC5 **Date:** ${date}\n`;
        if (speaker)     desc += `\uD83C\uDFA4 **Speaker:** ${speaker}\n`;
        if (scripture)   desc += `\uD83D\uDCD6 **Scripture:** ${scripture}\n`;
        if (description) desc += `\n${description}\n`;

        const links = [];
        if (video)  links.push(`[\uD83C\uDFA5 Watch Video](${video})`);
        if (audio)  links.push(`[\uD83C\uDFA7 Listen to Audio](${audio})`);
        if (notes)  links.push(`[\uD83D\uDCDD Study Notes](${notes})`);
        if (links.length) desc += `\n${links.join('  \u2022  ')}`;

        if (!desc) desc = '*No additional details provided.*';
        embed.setDescription(desc);
        embed.setFooter({ text: `Sigil \u2022 Sermon \u2022 ${interaction.guild.name}` });

        let msg;
        try {
            msg = await target.send({
                content: ping ? `<@&${ping.id}>` : undefined,
                embeds: [embed],
            });
        } catch (err) {
            return interaction.reply({
                content: `\u274C Could not post to <#${target.id}>. Check my permissions.`,
                ephemeral: true,
            });
        }

        return interaction.reply({
            content: `\u2705 Sermon posted to <#${target.id}>.`,
            ephemeral: true,
        });
    },
};
