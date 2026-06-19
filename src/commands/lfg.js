const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');

// In-memory LFG store: lfgId -> { game, mode, size, current: Set, message, host, guild, voiceChannel }
const lfgSessions = new Map();

function buildEmbed(guild, data, ended = false) {
    const spotsLeft = data.size - data.current.size;
    const memberList = data.current.size > 0
        ? [...data.current].map(id => `<@${id}>`).join(', ')
        : '*No one yet*';

    const embed = new EmbedBuilder()
        .setTitle(`\uD83C\uDFAE LFG — ${data.game}`)
        .setColor(ended ? '#555555' : spotsLeft === 0 ? '#FFA500' : '#43B581')
        .setTimestamp();

    let desc = '';
    if (data.mode)         desc += `\uD83D\uDFE2 **Mode:** ${data.mode}\n`;
    if (data.voiceChannel) desc += `\uD83D\uDD0A **Voice:** <#${data.voiceChannel}>\n`;
    desc += `\uD83D\uDC65 **Party:** ${data.current.size}/${data.size} — ${spotsLeft === 0 ? '**FULL**' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}\n`;
    desc += `\uD83D\uDC64 **Host:** <@${data.host}>\n`;
    desc += `\n**Players:**\n${memberList}`;
    if (ended) desc += '\n\n*This LFG session has closed.*';

    embed.setDescription(desc);
    embed.setFooter({ text: `Sigil \u2022 LFG \u2022 ${guild.name}` });
    return embed;
}

function buildButtons(lfgId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`lfg_join_${lfgId}`)
            .setLabel('\uD83D\uDFE2 Join')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`lfg_leave_${lfgId}`)
            .setLabel('\uD83D\uDD34 Leave')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`lfg_close_${lfgId}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('Post a Looking for Group listing for your game')
        .addStringOption(opt =>
            opt.setName('game').setDescription('Game you are playing').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('size').setDescription('Max party size (default 4)').setRequired(false).setMinValue(2).setMaxValue(20)
        )
        .addStringOption(opt =>
            opt.setName('mode').setDescription('Game mode, rank, or notes (e.g. Ranked, Casual, No mic)').setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('voice').setDescription('Voice channel to link').setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('expiry').setDescription('Auto-close after (e.g. 30m, 2h — default 1h)').setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('ping').setDescription('Role to ping (e.g. @Gamers)').setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('channel').setDescription('Channel to post in (defaults to current)').setRequired(false)
        ),

    async execute(interaction) {
        const game    = interaction.options.getString('game');
        const size    = interaction.options.getInteger('size') ?? 4;
        const mode    = interaction.options.getString('mode');
        const voice   = interaction.options.getChannel('voice');
        const expiry  = interaction.options.getString('expiry');
        const ping    = interaction.options.getRole('ping');
        const target  = interaction.options.getChannel('channel') ?? interaction.channel;

        const lfgId   = `${interaction.guild.id}_${Date.now()}`;
        const expiryMs = parseExpiry(expiry) ?? 3_600_000; // default 1h

        const data = {
            game, size, mode,
            voiceChannel: voice?.id ?? null,
            host: interaction.user.id,
            guild: interaction.guild,
            current: new Set([interaction.user.id]), // host auto-joins
            reminderFired: false,
        };

        const embed   = buildEmbed(interaction.guild, data);
        const row     = buildButtons(lfgId);
        const content = ping ? `<@&${ping.id}>` : undefined;

        let msg;
        try {
            msg = await target.send({ content, embeds: [embed], components: [row] });
        } catch (err) {
            console.error('[LFG] Failed to post:', err.message);
            return interaction.reply({
                content: `\u274C Could not post to <#${target.id}>. Check my permissions.`,
                ephemeral: true,
            });
        }

        data.message = msg;
        lfgSessions.set(lfgId, data);

        // Auto-close
        setTimeout(async () => {
            const d = lfgSessions.get(lfgId);
            if (!d) return;
            const closedEmbed = buildEmbed(d.guild, d, true);
            await d.message.edit({ embeds: [closedEmbed], components: [buildButtons(lfgId, true)] }).catch(() => {});
            lfgSessions.delete(lfgId);
        }, expiryMs);

        await interaction.reply({
            content: `\u2705 LFG posted to <#${target.id}>. Auto-closes in **${expiry ?? '1h'}**.`,
            ephemeral: true,
        });
    },

    async handleButton(interaction) {
        const id = interaction.customId;
        if (!id.startsWith('lfg_')) return false;

        const parts  = id.split('_');
        const action = parts[1]; // join | leave | close
        const lfgId  = parts.slice(2).join('_');
        const data   = lfgSessions.get(lfgId);

        if (!data) {
            return interaction.reply({ content: 'This LFG session has already closed.', ephemeral: true });
        }

        const userId = interaction.user.id;

        if (action === 'close') {
            if (userId !== data.host && !interaction.memberPermissions?.has('ManageMessages')) {
                return interaction.reply({ content: '\u274C Only the host or a mod can close this.', ephemeral: true });
            }
            const closedEmbed = buildEmbed(data.guild, data, true);
            await interaction.update({ embeds: [closedEmbed], components: [buildButtons(lfgId, true)] });
            lfgSessions.delete(lfgId);
            return true;
        }

        if (action === 'join') {
            if (data.current.has(userId)) {
                return interaction.reply({ content: 'You are already in this party.', ephemeral: true });
            }
            if (data.current.size >= data.size) {
                return interaction.reply({ content: '\uD83D\uDEAB This party is full.', ephemeral: true });
            }
            data.current.add(userId);
        }

        if (action === 'leave') {
            if (!data.current.has(userId)) {
                return interaction.reply({ content: 'You are not in this party.', ephemeral: true });
            }
            data.current.delete(userId);
        }

        const updated = buildEmbed(data.guild, data);

        // Auto-close embed when party is full
        const isFull = data.current.size >= data.size;
        await interaction.update({ embeds: [updated], components: [buildButtons(lfgId, isFull)] });

        if (isFull) {
            await data.message.reply({
                content: `\uD83C\uDF89 Party full! ${[...data.current].map(id => `<@${id}>`).join(' ')} — good luck!`,
            }).catch(() => {});
        }

        return true;
    },
};

function parseExpiry(str) {
    if (!str) return null;
    const s = str.toLowerCase();
    const match = s.match(/(\d+)\s*(d(?:ays?)?|h(?:ours?)?|m(?:in(?:utes?)?)?)/);
    if (!match) return null;
    const n = parseInt(match[1]);
    const unit = match[2][0];
    if (unit === 'd') return n * 86_400_000;
    if (unit === 'h') return n * 3_600_000;
    if (unit === 'm') return n * 60_000;
    return null;
}
