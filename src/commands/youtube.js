const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getYoutubeSubs, addYoutubeSub, removeYoutubeSub } = require('../utils/db.js');
const { resolveChannel } = require('../services/youtube.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Manage YouTube upload alert subscriptions')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Subscribe to a YouTube channel\'s upload alerts')
            .addStringOption(opt => opt.setName('channel').setDescription('YouTube channel ID (UCxxxxxx) or @handle').setRequired(true))
            .addChannelOption(opt => opt.setName('post_channel').setDescription('Discord channel to post alerts in').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Remove a YouTube upload alert subscription')
            .addStringOption(opt => opt.setName('channel').setDescription('YouTube channel ID or @handle to remove').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('List all tracked YouTube channels')
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'list') {
            const subs = getYoutubeSubs(guildId);
            if (!subs.length) {
                return interaction.reply({ content: 'No YouTube channels tracked yet. Use `/youtube add` to add one.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle('📥 Tracked YouTube Channels')
                .setColor('#FF0000')
                .setDescription(subs.map(s => `• **${s.channel_name}** (\`${s.yt_channel_id}\`) → <#${s.post_channel_id}>`).join('\n'))
                .setFooter({ text: `Sigil • ${subs.length} channel${subs.length !== 1 ? 's' : ''} tracked` });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'add') {
            const input       = interaction.options.getString('channel').trim();
            const postChannel = interaction.options.getChannel('post_channel');

            await interaction.deferReply({ ephemeral: true });

            let resolved = null;
            try { resolved = await resolveChannel(input); } catch {}

            if (!resolved) {
                return interaction.editReply({ content: `❌ Could not resolve YouTube channel \`${input}\`. Use the channel ID (starts with UC) or @handle.` });
            }

            addYoutubeSub(guildId, resolved.id, resolved.name, postChannel.id);

            const embed = new EmbedBuilder()
                .setTitle('✅ YouTube Alert Added')
                .setDescription(`Alerts for **${resolved.name}** will post in <#${postChannel.id}>.\n\nℹ️ The next alert will fire when a *new* video is uploaded (existing videos are skipped on first run).`)
                .setColor('#FF0000')
                .setFooter({ text: `Sigil • youtube add • ID: ${resolved.id}` });

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'remove') {
            const input   = interaction.options.getString('channel').trim();
            const guildSubs = getYoutubeSubs(guildId);

            // Match by channel ID or channel name
            const found = guildSubs.find(s =>
                s.yt_channel_id === input ||
                s.channel_name.toLowerCase() === input.toLowerCase() ||
                `@${s.channel_name}`.toLowerCase() === input.toLowerCase()
            );

            if (!found) {
                return interaction.reply({ content: `❌ No subscription found for \`${input}\`. Check \`/youtube list\`.`, ephemeral: true });
            }

            removeYoutubeSub(guildId, found.yt_channel_id);
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('✅ YouTube Alert Removed')
                    .setDescription(`Alerts for **${found.channel_name}** have been removed.`)
                    .setColor('#FF0000')
                    .setFooter({ text: 'Sigil • youtube remove' })],
                ephemeral: true,
            });
        }
    },
};
