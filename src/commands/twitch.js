const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getTwitchSubs, addTwitchSub, removeTwitchSub } = require('../utils/db.js');
const { getUserByLogin } = require('../services/twitch.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('Manage Twitch live alert subscriptions')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Subscribe to a Twitch streamer\'s live alerts')
            .addStringOption(opt => opt.setName('streamer').setDescription('Twitch username').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Discord channel to post alerts in').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Remove a Twitch live alert subscription')
            .addStringOption(opt => opt.setName('streamer').setDescription('Twitch username to remove').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('List all tracked Twitch streamers')
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const subs = getTwitchSubs(guildId);
            if (!subs.length) {
                return interaction.reply({ content: 'No Twitch streamers tracked yet. Use `/twitch add` to add one.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle('🟥 Tracked Twitch Streamers')
                .setColor('#9146FF')
                .setDescription(subs.map(s => `• [${s.streamer_name}](https://twitch.tv/${s.streamer_login}) → <#${s.post_channel_id}>`).join('\n'))
                .setFooter({ text: `Sigil • ${subs.length} streamer${subs.length !== 1 ? 's' : ''} tracked` });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'add') {
            const login   = interaction.options.getString('streamer').toLowerCase().trim();
            const channel = interaction.options.getChannel('channel');

            await interaction.deferReply({ ephemeral: true });

            // Validate streamer exists
            let user = null;
            try { user = await getUserByLogin(login); } catch {}

            if (!user) {
                const hasCredentials = process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET;
                if (hasCredentials) {
                    return interaction.editReply({ content: `❌ Twitch user \`${login}\` not found. Check the spelling and try again.` });
                }
                // No credentials — add anyway with the provided login as display name
                addTwitchSub(guildId, login, login, channel.id);
            } else {
                addTwitchSub(guildId, user.login, user.display_name, channel.id);
            }

            const displayName = user?.display_name ?? login;
            const embed = new EmbedBuilder()
                .setTitle('✅ Twitch Alert Added')
                .setDescription(`Alerts for **[${displayName}](https://twitch.tv/${login})** will post in <#${channel.id}>.`)
                .setColor('#9146FF')
                .setThumbnail(user?.profile_image_url ?? null)
                .setFooter({ text: 'Sigil • twitch add' });

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'remove') {
            const login   = interaction.options.getString('streamer').toLowerCase().trim();
            const removed = removeTwitchSub(guildId, login);
            if (!removed) {
                return interaction.reply({ content: `❌ No subscription found for \`${login}\`. Check \`/twitch list\`.`, ephemeral: true });
            }
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('✅ Twitch Alert Removed')
                    .setDescription(`Alerts for \`${login}\` have been removed.`)
                    .setColor('#9146FF')
                    .setFooter({ text: 'Sigil • twitch remove' })],
                ephemeral: true,
            });
        }
    },
};
