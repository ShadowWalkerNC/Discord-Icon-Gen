const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');

// store: msgId -> { title, description, cap, role, signups: Map<userId, displayName>, waitlist: [], guild, host, opened }
const volunteerStore = new Map();

function buildEmbed(data, guild, ended = false) {
    const filled    = data.signups.size;
    const remaining = data.cap ? Math.max(0, data.cap - filled) : null;
    const waiting   = data.waitlist.length;

    const embed = new EmbedBuilder()
        .setTitle(`\uD83D\uDC4B ${data.title}`)
        .setColor(ended ? '#555555' : filled >= (data.cap ?? Infinity) ? '#FFA500' : '#5865F2')
        .setTimestamp();

    let desc = data.description ? `${data.description}\n\n` : '';
    if (data.role)  desc += `\uD83C\uDFF7\uFE0F **Role awarded:** <@&${data.role}>\n`;
    if (data.cap)   desc += `\uD83D\uDCCB **Spots:** ${filled}/${data.cap}${remaining === 0 ? ' \u2014 **FULL**' : ` \u2014 ${remaining} left`}\n`;
    else            desc += `\uD83D\uDCCB **Signed up:** ${filled}\n`;
    desc += `\uD83D\uDC64 **Organizer:** <@${data.host}>\n\n`;

    if (filled > 0) {
        desc += `**Volunteers (${filled}):**\n`;
        desc += [...data.signups.values()].map(n => `\u2022 ${n}`).join('\n');
    } else {
        desc += '*No volunteers yet.*';
    }

    if (waiting > 0) desc += `\n\n**Waitlist (${waiting}):**\n` + data.waitlist.map((u, i) => `${i + 1}. <@${u}>`).join('\n');
    if (ended) desc += '\n\n*This sign-up is closed.*';

    embed.setDescription(desc);
    embed.setFooter({ text: `Sigil \u2022 Volunteer Sign-Up \u2022 ${guild.name}` });
    return embed;
}

function buildButtons(msgId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vol_signup_${msgId}`)
            .setLabel('\uD83D\uDC4B Sign Up')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`vol_leave_${msgId}`)
            .setLabel('\u274C Withdraw')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`vol_close_${msgId}`)
            .setLabel('Close Sign-Up')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volunteer')
        .setDescription('Create a volunteer sign-up sheet')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption(opt =>
            opt.setName('title').setDescription('Event or role title').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('description').setDescription('Details about the volunteer opportunity').setRequired(false)
        )
        .addIntegerOption(opt =>
            opt.setName('cap').setDescription('Max number of volunteers (leave blank for unlimited)').setRequired(false).setMinValue(1)
        )
        .addRoleOption(opt =>
            opt.setName('role').setDescription('Role to automatically assign to volunteers').setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('channel').setDescription('Channel to post in (defaults to current)').setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('ping').setDescription('Role to ping').setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('expiry').setDescription('Auto-close after (e.g. 3d, 12h)').setRequired(false)
        ),

    async execute(interaction) {
        const title       = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const cap         = interaction.options.getInteger('cap');
        const roleOpt     = interaction.options.getRole('role');
        const target      = interaction.options.getChannel('channel') ?? interaction.channel;
        const ping        = interaction.options.getRole('ping');
        const expiryStr   = interaction.options.getString('expiry');
        const expiryMs    = parseExpiry(expiryStr);

        const data = {
            title, description, cap,
            role: roleOpt?.id ?? null,
            host: interaction.user.id,
            guild: interaction.guild,
            signups: new Map(),
            waitlist: [],
            opened: Date.now(),
        };

        const embed   = buildEmbed(data, interaction.guild);
        const content = ping ? `<@&${ping.id}>` : undefined;

        let msg;
        try {
            msg = await target.send({ content, embeds: [embed], components: [buildButtons('placeholder')] });
        } catch (err) {
            console.error('[Volunteer] Failed to post:', err.message);
            return interaction.reply({
                content: `\u274C Could not post to <#${target.id}>. Check my permissions.`,
                ephemeral: true,
            });
        }

        data.message = msg;
        volunteerStore.set(msg.id, data);
        await msg.edit({ components: [buildButtons(msg.id)] }).catch(() => {});

        if (expiryMs) {
            setTimeout(async () => {
                const d = volunteerStore.get(msg.id);
                if (!d) return;
                const closedEmbed = buildEmbed(d, d.guild, true);
                await d.message.edit({ embeds: [closedEmbed], components: [buildButtons(msg.id, true)] }).catch(() => {});
                volunteerStore.delete(msg.id);
            }, expiryMs);
        }

        await interaction.reply({
            content: `\u2705 Volunteer sign-up posted to <#${target.id}>${expiryStr ? `. Closes in **${expiryStr}**` : ''}.`,
            ephemeral: true,
        });
    },

    async handleButton(interaction) {
        const id = interaction.customId;
        if (!id.startsWith('vol_')) return false;

        const parts  = id.split('_');
        const action = parts[1];
        const msgId  = parts.slice(2).join('_');
        const data   = volunteerStore.get(msgId);

        if (!data) return interaction.reply({ content: 'This sign-up is no longer active.', ephemeral: true });

        const userId = interaction.user.id;
        const member = interaction.member;
        const guild  = interaction.guild;

        if (action === 'close') {
            const isMod = interaction.memberPermissions?.has('ManageEvents');
            if (userId !== data.host && !isMod)
                return interaction.reply({ content: '\u274C Only the organizer or a mod can close this.', ephemeral: true });
            const closedEmbed = buildEmbed(data, data.guild, true);
            await interaction.update({ embeds: [closedEmbed], components: [buildButtons(msgId, true)] });
            volunteerStore.delete(msgId);
            return true;
        }

        if (action === 'signup') {
            if (data.signups.has(userId))
                return interaction.reply({ content: 'You are already signed up.', ephemeral: true });

            if (data.cap && data.signups.size >= data.cap) {
                if (data.waitlist.includes(userId))
                    return interaction.reply({ content: 'You are already on the waitlist.', ephemeral: true });
                data.waitlist.push(userId);
                const updated = buildEmbed(data, data.guild);
                await interaction.update({ embeds: [updated], components: [buildButtons(msgId)] });
                await interaction.followUp({
                    content: `\uD83D\uDCCB You have been added to the waitlist at position **${data.waitlist.length}**.`,
                    ephemeral: true,
                });
                return true;
            }

            data.signups.set(userId, member.displayName ?? interaction.user.username);
            if (data.role) {
                const role = guild.roles.cache.get(data.role);
                if (role) await member.roles.add(role, 'Volunteer sign-up').catch(() => {});
            }
            const updated = buildEmbed(data, data.guild);
            await interaction.update({ embeds: [updated], components: [buildButtons(msgId)] });
            return true;
        }

        if (action === 'leave') {
            if (data.waitlist.includes(userId)) {
                data.waitlist = data.waitlist.filter(id => id !== userId);
                const updated = buildEmbed(data, data.guild);
                await interaction.update({ embeds: [updated], components: [buildButtons(msgId)] });
                await interaction.followUp({ content: '\u2705 Removed you from the waitlist.', ephemeral: true });
                return true;
            }

            if (!data.signups.has(userId))
                return interaction.reply({ content: 'You are not signed up.', ephemeral: true });

            data.signups.delete(userId);
            if (data.role) {
                const role = guild.roles.cache.get(data.role);
                if (role) await member.roles.remove(role, 'Volunteer withdrew').catch(() => {});
            }

            if (data.waitlist.length > 0) {
                const nextId     = data.waitlist.shift();
                const nextMember = await guild.members.fetch(nextId).catch(() => null);
                if (nextMember) {
                    data.signups.set(nextId, nextMember.displayName ?? nextMember.user.username);
                    if (data.role) {
                        const role = guild.roles.cache.get(data.role);
                        if (role) await nextMember.roles.add(role, 'Promoted from waitlist').catch(() => {});
                    }
                    await data.message.reply({
                        content: `\uD83C\uDF89 <@${nextId}> \u2014 a spot opened up! You have been moved from the waitlist to the volunteer list.`,
                    }).catch(() => {});
                }
            }

            const updated = buildEmbed(data, data.guild);
            await interaction.update({ embeds: [updated], components: [buildButtons(msgId)] });
            return true;
        }

        return false;
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
