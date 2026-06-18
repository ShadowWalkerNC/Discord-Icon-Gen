const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../utils/db.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { getAllFontFamilies } = require('../utils/canvas.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sigilconfig')
        .setDescription('Configure Sigil automations for this server (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub
            .setName('welcome')
            .setDescription('Configure auto-welcome cards')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable auto-welcome cards').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post welcome cards in').addChannelTypes(ChannelType.GuildText))
            .addStringOption(opt => opt.setName('color').setDescription('Accent color (hex)').setAutocomplete(true))
            .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
            .addStringOption(opt => opt.setName('font').setDescription('Font').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f }))))
        )
        .addSubcommand(sub => sub
            .setName('goodbye')
            .setDescription('Configure auto-goodbye cards')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable auto-goodbye cards').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post goodbye cards in').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sub => sub
            .setName('milestone')
            .setDescription('Configure auto-milestone celebration cards')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable milestone cards').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post milestone cards in').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sub => sub
            .setName('boost')
            .setDescription('Configure auto-boost thank-you cards')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable boost cards').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post boost cards in').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Show current automation status for this server')
        ),

    async autocomplete(interaction) {
        const { colorAutocomplete } = require('../utils/colors.js');
        await colorAutocomplete(interaction);
    },

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'status') {
            const cfg = getConfig(guildId);
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Sigil Automation Status')
                .setColor('#5865F2')
                .addFields(
                    { name: '👋 Welcome',   value: cfg.welcome_enabled   ? `🟢 On — <#${cfg.welcome_channel}>`   : '🔴 Off', inline: true },
                    { name: '👋 Goodbye',   value: cfg.goodbye_enabled   ? `🟢 On — <#${cfg.goodbye_channel}>`   : '🔴 Off', inline: true },
                    { name: '🎉 Milestone', value: cfg.milestone_enabled ? `🟢 On — <#${cfg.milestone_channel}>` : '🔴 Off', inline: true },
                    { name: '🚀 Boost',     value: cfg.boost_enabled     ? `🟢 On — <#${cfg.boost_channel}>`     : '🔴 Off', inline: true },
                )
                .setFooter({ text: 'Sigil • sigilconfig status' });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const enabled = interaction.options.getBoolean('enabled');
        const channel = interaction.options.getChannel('channel');

        if (sub === 'welcome') {
            const color  = interaction.options.getString('color')      ?? null;
            const bg     = interaction.options.getString('background') ?? null;
            const font   = interaction.options.getString('font')       ?? null;
            const update = { welcome_enabled: enabled ? 1 : 0 };
            if (channel) update.welcome_channel = channel.id;
            if (color)   update.welcome_color   = color;
            if (bg)      update.welcome_bg       = bg;
            if (font)    update.welcome_font     = font;
            setConfig(guildId, update);
        } else if (sub === 'goodbye') {
            const update = { goodbye_enabled: enabled ? 1 : 0 };
            if (channel) update.goodbye_channel = channel.id;
            setConfig(guildId, update);
        } else if (sub === 'milestone') {
            const update = { milestone_enabled: enabled ? 1 : 0 };
            if (channel) update.milestone_channel = channel.id;
            setConfig(guildId, update);
        } else if (sub === 'boost') {
            const update = { boost_enabled: enabled ? 1 : 0 };
            if (channel) update.boost_channel = channel.id;
            setConfig(guildId, update);
        }

        const embed = new EmbedBuilder()
            .setTitle(`✅ Sigil — ${sub.charAt(0).toUpperCase() + sub.slice(1)} Updated`)
            .setDescription(`**${sub}** automation is now **${enabled ? 'enabled' : 'disabled'}**${channel ? ` in <#${channel.id}>` : ''}.`)
            .setColor(enabled ? '#39FF14' : '#ff4444')
            .setFooter({ text: 'Sigil • sigilconfig' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
