const {
    SlashCommandBuilder, EmbedBuilder,
} = require('discord.js');
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '../../data/sigil.db'));
db.exec(`
    CREATE TABLE IF NOT EXISTS culinaryos_config (
        guild_id     TEXT PRIMARY KEY,
        api_url      TEXT NOT NULL,
        api_key      TEXT,
        menu_channel TEXT,
        alert_channel TEXT
    );
`);

const getConfig = db.prepare('SELECT * FROM culinaryos_config WHERE guild_id = ?');

const CATEGORY_EMOJI = {
    appetizer:  '🥗', appetizers: '🥗',
    entree:     '🍽️', entrees: '🍽️', mains: '🍽️',
    dessert:    '🍰', desserts: '🍰',
    drink:      '🥤', drinks: '🥤', beverages: '🥤',
    soup:       '🍜', soups: '🍜',
    salad:      '🥙', salads: '🥙',
    side:       '🥔', sides: '🥔',
    special:    '⭐', specials: '⭐',
};

function emoji(category) {
    return CATEGORY_EMOJI[category?.toLowerCase()] ?? '🍴';
}

function formatPrice(p) {
    if (p == null) return '';
    return ` — $${parseFloat(p).toFixed(2)}`;
}

async function fetchFromCulinaryOS(config, path) {
    const headers = { 'Content-Type': 'application/json' };
    if (config.api_key) headers['X-API-Key'] = config.api_key;
    const res = await fetch(`${config.api_url.replace(/\/$/, '')}${path}`, {
        headers,
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`CulinaryOS API ${res.status}: ${res.statusText}`);
    return res.json();
}

module.exports = {
    getConfig,
    fetchFromCulinaryOS,

    data: new SlashCommandBuilder()
        .setName('menu')
        .setDescription('View the current menu from CulinaryOS')
        .addSubcommand(sub =>
            sub.setName('today')
                .setDescription('Show today\'s full menu')
                .addStringOption(opt => opt.setName('category').setDescription('Filter by category (e.g. Entrees, Desserts)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('specials')
                .setDescription('Show today\'s specials only')
        )
        .addSubcommand(sub =>
            sub.setName('item')
                .setDescription('Look up a specific menu item')
                .addStringOption(opt => opt.setName('name').setDescription('Item name to search').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Connect to your CulinaryOS instance (Admin)')
                .addStringOption(opt => opt.setName('api_url').setDescription('CulinaryOS API base URL (e.g. http://192.168.1.10:8080)').setRequired(true))
                .addStringOption(opt => opt.setName('api_key').setDescription('API key if required').setRequired(false))
                .addChannelOption(opt => opt.setName('menu_channel').setDescription('Default channel for /menu today posts').setRequired(false))
                .addChannelOption(opt => opt.setName('alert_channel').setDescription('Channel for low-stock alerts from CulinaryOS').setRequired(false))
        ),

    async execute(interaction) {
        const sub   = interaction.options.getSubcommand();
        const gId   = interaction.guild.id;

        if (sub === 'setup') {
            if (!interaction.memberPermissions.has('ManageGuild'))
                return interaction.reply({ content: '❌ You need **Manage Server** to configure CulinaryOS.', ephemeral: true });

            const apiUrl     = interaction.options.getString('api_url').replace(/\/$/, '');
            const apiKey     = interaction.options.getString('api_key') ?? null;
            const menuChan   = interaction.options.getChannel('menu_channel');
            const alertChan  = interaction.options.getChannel('alert_channel');

            db.prepare(`
                INSERT OR REPLACE INTO culinaryos_config (guild_id, api_url, api_key, menu_channel, alert_channel)
                VALUES (?, ?, ?, ?, ?)
            `).run(gId, apiUrl, apiKey, menuChan?.id ?? null, alertChan?.id ?? null);

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('✅ CulinaryOS Connected')
                    .setColor('#57F287')
                    .setDescription(
                        `**API URL:** \`${apiUrl}\`\n` +
                        `**API Key:** ${apiKey ? '`set`' : 'none'}\n` +
                        `**Menu Channel:** ${menuChan ? `<#${menuChan.id}>` : 'not set'}\n` +
                        `**Alert Channel:** ${alertChan ? `<#${alertChan.id}>` : 'not set'}`
                    )
                    .setFooter({ text: `Sigil • CulinaryOS Bridge • ${interaction.guild.name}` })
                    .setTimestamp()],
                ephemeral: true,
            });
        }

        const config = getConfig.get(gId);
        if (!config)
            return interaction.reply({ content: '❌ CulinaryOS is not configured. Ask an admin to run `/menu setup` first.', ephemeral: true });

        await interaction.deferReply();

        try {
            if (sub === 'today') {
                const categoryFilter = interaction.options.getString('category')?.toLowerCase();
                const data = await fetchFromCulinaryOS(config, '/api/menu/today');
                const items = Array.isArray(data) ? data : (data.items ?? data.menu ?? []);

                if (!items.length)
                    return interaction.editReply({ content: '📋 No menu items found for today.' });

                // Group by category
                const groups = {};
                for (const item of items) {
                    const cat = item.category ?? 'Other';
                    if (categoryFilter && cat.toLowerCase() !== categoryFilter) continue;
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(item);
                }

                if (!Object.keys(groups).length)
                    return interaction.editReply({ content: `📋 No items found in category **${categoryFilter}**.` });

                const embed = new EmbedBuilder()
                    .setTitle(`🍽️ Today's Menu — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`)
                    .setColor('#F4A642')
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                for (const [cat, catItems] of Object.entries(groups)) {
                    const lines = catItems.map(i =>
                        `**${i.name}**${formatPrice(i.price)}${i.description ? `\n*${i.description}*` : ''}`
                    ).join('\n\n');
                    embed.addFields({ name: `${emoji(cat)} ${cat}`, value: lines.slice(0, 1024), inline: false });
                }

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'specials') {
                const data  = await fetchFromCulinaryOS(config, '/api/menu/specials');
                const items = Array.isArray(data) ? data : (data.items ?? data.specials ?? []);

                if (!items.length)
                    return interaction.editReply({ content: '⭐ No specials today.' });

                const embed = new EmbedBuilder()
                    .setTitle(`⭐ Today's Specials`)
                    .setColor('#FEE75C')
                    .setDescription(items.map(i =>
                        `**${i.name}**${formatPrice(i.price)}\n${i.description ?? ''}`
                    ).join('\n\n'))
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'item') {
                const name = interaction.options.getString('name');
                const data = await fetchFromCulinaryOS(config, `/api/menu/search?q=${encodeURIComponent(name)}`);
                const items = Array.isArray(data) ? data : (data.items ?? data.results ?? []);

                if (!items.length)
                    return interaction.editReply({ content: `❌ No menu item found matching **${name}**.` });

                const item  = items[0];
                const embed = new EmbedBuilder()
                    .setTitle(`${emoji(item.category)} ${item.name}`)
                    .setColor('#F4A642');

                let desc = '';
                if (item.description) desc += `${item.description}\n\n`;
                if (item.price)       desc += `**Price:** $${parseFloat(item.price).toFixed(2)}\n`;
                if (item.category)    desc += `**Category:** ${item.category}\n`;
                if (item.allergens?.length) desc += `**Allergens:** ${item.allergens.join(', ')}\n`;
                if (item.calories)    desc += `**Calories:** ${item.calories}\n`;

                embed.setDescription(desc || 'No additional details available.')
                    .setFooter({ text: `Sigil • CulinaryOS • ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (err) {
            console.error('[Menu] CulinaryOS error:', err.message);
            return interaction.editReply({ content: `❌ Could not reach CulinaryOS: \`${err.message}\`` });
        }
    },
};
