const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const { getConfig, setConfig } = require('../utils/db.js');

module.exports.data = new SlashCommandBuilder()
    .setName('logging')
    .setDescription('Configure the server logging system')
    .addSubcommand(sub => sub
        .setName('setup')
        .setDescription('Set a channel to receive server logs')
        .addChannelOption(opt => opt
            .setName('channel')
            .setDescription('Channel to send logs to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub => sub
        .setName('disable')
        .setDescription('Disable logging')
    )
    .addSubcommand(sub => sub
        .setName('status')
        .setDescription('Check current logging configuration')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

module.exports.execute = async function execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const config  = getConfig(guildId);

    if (sub === 'setup') {
        const channel = interaction.options.getChannel('channel');
        setConfig(guildId, { mod_log_channel: channel.id });
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle('📋 Logging Enabled')
                .setDescription(`Server logs will now be sent to <#${channel.id}>.\n\n**Logged events:**\n• Message edits & deletes\n• Member joins & leaves\n• Bans & unbans\n• Role assignments & removals\n• Nickname changes\n• Channel creates & deletes\n• Voice channel activity`)
                .setColor('#5865F2')
                .setTimestamp()],
            ephemeral: true,
        });
    }

    if (sub === 'disable') {
        setConfig(guildId, { mod_log_channel: null });
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle('🔕 Logging Disabled')
                .setDescription('Server logging has been turned off.')
                .setColor('#F04747')
                .setTimestamp()],
            ephemeral: true,
        });
    }

    if (sub === 'status') {
        const ch = config.mod_log_channel;
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle('📋 Logging Status')
                .setDescription(ch ? `Logging is **enabled** → <#${ch}>` : 'Logging is **disabled**.')
                .setColor(ch ? '#43B581' : '#747F8D')
                .setTimestamp()],
            ephemeral: true,
        });
    }
};
