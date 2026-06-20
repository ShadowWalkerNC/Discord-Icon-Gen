/**
 * CulinaryOS → Sigil Webhook Handler
 *
 * Mount this on your Express/http server in index.js:
 *   const culinaryWebhook = require('./webhooks/culinaryos.js');
 *   culinaryWebhook.register(app, client);
 *
 * CulinaryOS sends POST to: http://your-sigil-host:PORT/webhooks/culinaryos
 * with header: X-Sigil-Secret matching CULINARYOS_WEBHOOK_SECRET in .env
 */

const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const path     = require('path');

const db        = new Database(path.join(__dirname, '../../data/sigil.db'));
const getConfig = db.prepare('SELECT * FROM culinaryos_config WHERE guild_id = ?');
const getAll    = db.prepare('SELECT * FROM culinaryos_config WHERE alert_channel IS NOT NULL');

const STOCK_COLORS = {
    low:      '#FEE75C',
    critical: '#ED4245',
    out:      '#ED4245',
    out_of_stock: '#ED4245',
};

function stockEmoji(status) {
    const s = (status ?? '').toLowerCase();
    if (s === 'out' || s === 'out_of_stock') return '🔴';
    if (s === 'critical' || s === 'very_low') return '🟠';
    if (s === 'low') return '🟡';
    return '🟢';
}

async function postAlert(client, guildId, embed) {
    const cfg = getConfig.get(guildId);
    if (!cfg?.alert_channel) return;
    const guild   = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const channel = await guild.channels.fetch(cfg.alert_channel).catch(() => null);
    if (!channel) return;
    await channel.send({ embeds: [embed] }).catch(e => console.error('[CulinaryOS webhook] post error:', e.message));
}

module.exports = {
    register(app, client) {
        app.post('/webhooks/culinaryos', async (req, res) => {
            // Verify secret
            const secret = process.env.CULINARYOS_WEBHOOK_SECRET;
            if (secret && req.headers['x-sigil-secret'] !== secret) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const body = req.body;
            if (!body) return res.status(400).json({ error: 'Empty body' });

            const { event, guild_id, data } = body;

            // Determine which guilds to notify
            const targets = guild_id
                ? [{ guild_id }]
                : getAll.all();

            try {
                switch (event) {

                    // ─ Low stock alert
                    case 'inventory.low':
                    case 'inventory.critical':
                    case 'inventory.out': {
                        const items  = Array.isArray(data) ? data : [data];
                        const isCrit = items.some(i => ['critical','out','out_of_stock','very_low'].includes(i.status?.toLowerCase()));
                        const embed  = new EmbedBuilder()
                            .setTitle(`${isCrit ? '🔴' : '🟡'} Inventory Alert — ${isCrit ? 'Critical / Out of Stock' : 'Low Stock'}`)
                            .setColor(isCrit ? '#ED4245' : '#FEE75C')
                            .setDescription(items.map(i =>
                                `${stockEmoji(i.status)} **${i.name}** — ${i.quantity ?? 0} ${i.unit ?? ''} remaining` +
                                (i.reorderLevel ? ` *(reorder at ${i.reorderLevel})*` : '')
                            ).join('\n'))
                            .setFooter({ text: 'Sigil • CulinaryOS • Inventory Alert' })
                            .setTimestamp();

                        for (const t of targets) await postAlert(client, t.guild_id, embed);
                        break;
                    }

                    // ─ New menu published
                    case 'menu.published': {
                        const embed = new EmbedBuilder()
                            .setTitle('🍽️ Menu Updated')
                            .setColor('#F4A642')
                            .setDescription(
                                (data?.message ?? `Today's menu has been published.`) +
                                `\n\nUse \`/menu today\` to view it.`
                            )
                            .setFooter({ text: 'Sigil • CulinaryOS • Menu Update' })
                            .setTimestamp();

                        for (const t of targets) await postAlert(client, t.guild_id, embed);
                        break;
                    }

                    // ─ Recipe added
                    case 'recipe.added': {
                        const embed = new EmbedBuilder()
                            .setTitle(`📖 New Recipe Added: ${data?.name ?? 'Unnamed'}`)
                            .setColor('#57F287')
                            .setDescription(
                                (data?.description ? `*${data.description}*\n\n` : '') +
                                `Use \`/recipe get ${data?.name ?? ''}\ ` + '`' + ' to view the full recipe.'
                            )
                            .setFooter({ text: 'Sigil • CulinaryOS • New Recipe' })
                            .setTimestamp();

                        for (const t of targets) await postAlert(client, t.guild_id, embed);
                        break;
                    }

                    // ─ Order alert (optional — for POS integration)
                    case 'order.alert': {
                        const embed = new EmbedBuilder()
                            .setTitle('🧾 Order Alert')
                            .setColor('#5865F2')
                            .setDescription(data?.message ?? 'A new order alert was received from CulinaryOS.')
                            .setFooter({ text: 'Sigil • CulinaryOS • Order Alert' })
                            .setTimestamp();

                        for (const t of targets) await postAlert(client, t.guild_id, embed);
                        break;
                    }

                    default:
                        console.log('[CulinaryOS webhook] Unknown event:', event);
                }

                res.status(200).json({ ok: true });
            } catch (err) {
                console.error('[CulinaryOS webhook] Error:', err.message);
                res.status(500).json({ error: err.message });
            }
        });

        console.log('[CulinaryOS] Webhook handler registered at POST /webhooks/culinaryos');
    },
};
