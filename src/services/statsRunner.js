/**
 * Weekly stats report runner.
 * Fires automatically every Monday at 09:00 UTC.
 * Also exported for on-demand use via /stats command.
 */
const { EmbedBuilder } = require('discord.js');
const { setConfig, getWeeklyTopXP } = require('../utils/db.js');
const { calculateLevel }            = require('../utils/xp.js');
const registry                      = require('../util/serviceRegistry.js');
const Database = require('better-sqlite3');
const path     = require('path');
const DB_PATH  = path.join(__dirname, '../../data/sigil.db');

const STATS_CHECK_INTERVAL = 5 * 60_000;
registry.register('stats-runner', { interval: STATS_CHECK_INTERVAL, description: 'Weekly server stats poster (Mon 09:00 UTC)' });

function getGuildsWithStatsChannel() {
    try {
        const db = new Database(DB_PATH, { readonly: true });
        return db.prepare('SELECT * FROM guild_config WHERE stats_channel IS NOT NULL').all();
    } catch { return []; }
}

async function buildStatsEmbed(guild) {
    let members;
    try { members = await guild.members.fetch(); } catch { members = guild.members.cache; }

    const totalMembers = guild.memberCount;
    const botCount     = members.filter(m => m.user.bot).size;
    const humanCount   = totalMembers - botCount;
    const onlineCount  = members.filter(m =>
        m.presence?.status && m.presence.status !== 'offline'
    ).size;

    const since7d  = Date.now() - 7 * 86_400_000;
    const newJoins = members.filter(m => m.joinedTimestamp && m.joinedTimestamp >= since7d).size;

    const boostCount   = guild.premiumSubscriptionCount ?? 0;
    const boostTier    = guild.premiumTier ?? 0;
    const channelCount = guild.channels.cache.size;
    const roleCount    = guild.roles.cache.size - 1;
    const emojiCount   = guild.emojis.cache.size;

    const topXP    = getWeeklyTopXP(guild.id, 3);
    const medals   = ['🥇', '🥈', '🥉'];
    const topLines = topXP.length
        ? topXP.map((r, i) => {
            const { level } = calculateLevel(r.xp);
            return `${medals[i]} <@${r.user_id}> • Lvl ${level} • ${r.xp.toLocaleString()} XP`;
          }).join('\n')
        : '*No XP activity this week*';

    const now       = new Date();
    const weekLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    return new EmbedBuilder()
        .setTitle(`📊 Weekly Server Report — w/e ${weekLabel}`)
        .setColor('#5865F2')
        .setThumbnail(guild.iconURL({ size: 128 }) ?? null)
        .addFields(
            { name: '👥 Members',        value: `**${humanCount.toLocaleString()}** humans • ${botCount} bots`,             inline: true  },
            { name: '🟢 Online',          value: `**${onlineCount.toLocaleString()}** right now`,                               inline: true  },
            { name: '✨ New This Week',   value: `**${newJoins.toLocaleString()}** joined`,                                      inline: true  },
            { name: '🚀 Boost Status',    value: `Tier **${boostTier}** • **${boostCount}** boost${boostCount !== 1 ? 's' : ''}`, inline: true  },
            { name: '💬 Channels',        value: `**${channelCount}**`,                                                        inline: true  },
            { name: '🏷️ Roles',           value: `**${roleCount}**`,                                                         inline: true  },
            { name: '😄 Emojis',          value: `**${emojiCount}**`,                                                         inline: true  },
            { name: '⭐ Top XP This Week', value: topLines,                                                                    inline: false },
        )
        .setFooter({ text: 'Sigil • Weekly Stats • Auto-posts every Monday 09:00 UTC' })
        .setTimestamp();
}

async function runStatsForGuild(client, guildId, channelId) {
    try {
        const guild   = await client.guilds.fetch(guildId);
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return false;

        const embed = await buildStatsEmbed(guild);
        await channel.send({ embeds: [embed] });
        setConfig(guildId, { last_stats_at: new Date().toISOString() });
        registry.heartbeat('stats-runner');
        return true;
    } catch (err) {
        console.error(`[Stats] Failed for guild ${guildId}:`, err.message);
        registry.setError('stats-runner', err);
        return false;
    }
}

async function runWeeklyStats(client) {
    const now = new Date();
    registry.heartbeat('stats-runner'); // alive even when it's not Monday

    if (now.getUTCDay() !== 1 || now.getUTCHours() !== 9) return;

    const rows = getGuildsWithStatsChannel();
    for (const cfg of rows) {
        if (!cfg.stats_channel) continue;

        if (cfg.last_stats_at) {
            const lastAt     = new Date(cfg.last_stats_at);
            const sameMonday = lastAt.getUTCDay() === 1 &&
                lastAt.getUTCFullYear() === now.getUTCFullYear() &&
                lastAt.getUTCMonth()    === now.getUTCMonth() &&
                lastAt.getUTCDate()     === now.getUTCDate();
            if (sameMonday) continue;
        }

        await runStatsForGuild(client, cfg.guild_id, cfg.stats_channel);
    }
}

function startStatsRunner(client) {
    setInterval(() => runWeeklyStats(client), STATS_CHECK_INTERVAL);
    console.log('[Stats] Weekly stats runner started (checks every 5 min).');
}

module.exports = { startStatsRunner, runStatsForGuild, buildStatsEmbed };
