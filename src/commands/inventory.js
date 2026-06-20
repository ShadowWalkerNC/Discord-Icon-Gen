const {
    SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
} = require('discord.js');
const { getConfig, fetchFromCulinaryOS } = require('./menu.js');

const STOCK_COLORS = {
    ok:       '#57F287',
    low:      '#FEE75C',
    critical: '#ED4245',
    out:      '#ED4245',
};

function stockEmoji(status) {
    if (!status) return '📦';
    const s = status.toLowerCase();
    if (s === 'out' || s === 'out_of_stock') return '🔴';
    if (s === 'critical' || s === 'very_low') return '🟠';
    if (s === 'low') return '🟡';
    return '🟢';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View inventory status from CulinaryOS')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('View full current inventory status')
                .addStringOption(opt => opt.setName('filter').setDescription('Filter: all (default), low, critical, out').setRequired(false)
                    .addChoices(
                        { name: 'All items',       value: 'all' },
                        { name: 'Low stock only',  value: 'low' },
                        { name: 'Critical only',   value: 'critical' },
                        { name: 'Out of stock',    value: 'out' },
                    )
                )
        )
        .addSubcommand(sub =>
            sub.setName('item')
                .setDescription('Look up a specific inventory item')
                .addStringOption(opt => opt.setName('name').setDescription('Item name to look up').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('alerts')
                .setDescription('View all current low-stock / out-of-stock alerts')
        ),

    async execute(interaction) {
        const sub    = interaction.options.getSubcommand();
        const gId    = interaction.guild.id;
        const config = getConfig.get(gId);

        if (!config)
            return interaction.reply({ content: '❌ CulinaryOS is not configured. Ask an admin to run `/menu setup` first.', ephemeral: true });

        await interaction.deferReply({ ephemeral: sub !== 'alerts' });

        try {
            if (sub === 'status') {
                const filter = interaction.options.getString('filter') ?? 'all';
                const path   = filter === 'all' ? '/api/inventory' : `/api/inventory?status=${filter}`;
                const data   = await fetchFromCulinaryOS(config, path);
                const items  = Array.isArray(data) ? data : (data.items ?? data.inventory ?? []);

                if (!items.length)
                    return interaction.editReply({ content: '📦 No inventory items found.' });

                const embed = new EmbedBuilder()
                    .setTitle('📦 Inventory Status')
                    .setColor(filter === 'all' ? '#5865F2' : STOCK_COLORS[filter] ?? '#5865F2')
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                const lines = items.slice(0, 25).map(i =>
                    `${stockEmoji(i.status)} **${i.name}** — ${i.quantity ?? '?'} ${i.unit ?? ''} ` +
                    (i.reorderLevel ? `*(reorder at ${i.reorderLevel})*` : '')
                );

                embed.setDescription(lines.join('\n'));
                if (items.length > 25) embed.setDescription(embed.data.description + `\n\n*…and ${items.length - 25} more items.*`);

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'item') {
                const name = interaction.options.getString('name');
                const data = await fetchFromCulinaryOS(config, `/api/inventory/search?q=${encodeURIComponent(name)}`);
                const items = Array.isArray(data) ? data : (data.items ?? data.results ?? []);

                if (!items.length)
                    return interaction.editReply({ content: `❌ No inventory item found matching **${name}**.` });

                const item  = items[0];
                const embed = new EmbedBuilder()
                    .setTitle(`${stockEmoji(item.status)} ${item.name}`)
                    .setColor(STOCK_COLORS[item.status?.toLowerCase()] ?? '#5865F2');

                let desc = '';
                desc += `**Quantity:** ${item.quantity ?? 'N/A'} ${item.unit ?? ''}\n`;
                if (item.reorderLevel) desc += `**Reorder Level:** ${item.reorderLevel} ${item.unit ?? ''}\n`;
                if (item.supplier)     desc += `**Supplier:** ${item.supplier}\n`;
                if (item.lastUpdated)  desc += `**Last Updated:** ${new Date(item.lastUpdated).toLocaleString()}\n`;
                if (item.status)       desc += `**Status:** ${item.status}\n`;

                embed.setDescription(desc)
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'alerts') {
                const data  = await fetchFromCulinaryOS(config, '/api/inventory/alerts');
                const items = Array.isArray(data) ? data : (data.alerts ?? data.items ?? []);

                if (!items.length)
                    return interaction.editReply({ content: '✅ No active inventory alerts. All stock levels are good.' });

                const critical = items.filter(i => ['critical','out','out_of_stock','very_low'].includes(i.status?.toLowerCase()));
                const low      = items.filter(i => i.status?.toLowerCase() === 'low');

                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Inventory Alerts')
                    .setColor(critical.length ? '#ED4245' : '#FEE75C')
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                if (critical.length) {
                    embed.addFields({
                        name: '🔴 Critical / Out of Stock',
                        value: critical.map(i => `• **${i.name}** — ${i.quantity ?? 0} ${i.unit ?? ''} remaining`).join('\n').slice(0, 1024),
                        inline: false,
                    });
                }
                if (low.length) {
                    embed.addFields({
                        name: '🟡 Low Stock',
                        value: low.map(i => `• **${i.name}** — ${i.quantity ?? '?'} ${i.unit ?? ''} (reorder: ${i.reorderLevel ?? '?'})`).join('\n').slice(0, 1024),
                        inline: false,
                    });
                }

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (err) {
            console.error('[Inventory] CulinaryOS error:', err.message);
            return interaction.editReply({ content: `❌ Could not reach CulinaryOS: \`${err.message}\`` });
        }
    },
};
