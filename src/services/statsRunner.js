/**
 * Weekly stats report runner.
 * Fires automatically every Monday at 09:00 UTC.
 * Also exported for on-demand use via /stats command.
 */
const { EmbedBuilder } = require('discord.js');
const { getConfig, setConfig, getGuildsWithFeature, getLeaderboard, getWeeklyTopXP } = require('../utils/db.js');
const { calculateLevel } = require('../utils/xp.js');

/**
 * Collect guild stats and build the report embed.
 */
async function buildStatsEmbed(guild) {
    // Fetch fresh member data
    let members;
    try { members = await guild.members.fetch(); } catch { members = guild.members.cache; }

    const totalMembers = guild.memberCount;
    const botCount     = members.filter(m => m.user.bot).size;
    const humanCount   = totalMembers - botCount;
    const onlineCount  = members.filter(m =>
        m.presence?.status && m.presence.status !== 'offline'
    ).size;

    // New joins in last 7 days
    const since7d   = Date.now() - 7 * 86_400_000;
    const newJoins  = members.filter(m => m.joinedTimestamp && m.joinedTimestamp >= since7d).size;

    const boostCount   = guild.premiumSubscriptionCount ?? 0;
    const boostTier    = guild.premiumTier ?? 0;
    const channelCount = guild.channels.cache.size;
    const roleCount    = guild.roles.cache.size - 1; // exclude @everyone
    const emojiCount   = guild.emojis.cache.size;

    // Top XP earners this week
    const topXP  = getWeeklyTopXP(guild.id, 3);
    const medals = ['🥇', '🥈', '🥉'];
    const topLines = topXP.length
        ? topXP.map((r, i) => {
            const { level } = calculateLevel(r.xp);
            return `${medals[i]} <@${r.user_id}> • Lvl ${level} • ${r.xp.toLocaleString()} XP`;
          }).join('\n')
        : '*No XP activity this week*';

    const now = new Date();
    const weekLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    return new EmbedBuilder()
        .setTitle(`📊 Weekly Server Report — w/e ${weekLabel}`)
        .setColor('#5865F2')
        .setThumbnail(guild.iconURL({ size: 128 }) ?? null)
        .addFields(
            { name: '👥 Members',       value: `**${humanCount.toLocaleString()}** humans • ${botCount} bots`,            inline: true  },
            { name: '🟢 Online',         value: `**${onlineCount.toLocaleString()}** right now`,                              inline: true  },
            { name: '✨ New This Week',  value: `**${newJoins.toLocaleString()}** joined`,                                     inline: true  },
            { name: '🚀 Boost Status',   value: `Tier **${boostTier}** • **${boostCount}** boost${boostCount !== 1 ? 's' : ''}`, inline: true  },
            { name: '💬 Channels',       value: `**${channelCount}**`,                                                       inline: true  },
            { name: '🏷️ Roles',          value: `**${roleCount}**`,                                                        inline: true  },
            { name: '😄 Emojis',         value: `**${emojiCount}**`,                                                        inline: true  },
            { name: '⭐ Top XP This Week', value: topLines,                                                                   inline: false },
        )
        .setFooter({ text: 'Sigil • Weekly Stats • Auto-posts every Monday 09:00 UTC' })
        .setTimestamp();
}

/**
 * Run the stats report for a single guild.
 * Returns true if posted successfully.
 */
async function runStatsForGuild(client, guildId, channelId) {
    try {
        const guild   = await client.guilds.fetch(guildId);
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return false;

        const embed = await buildStatsEmbed(guild);
        await channel.send({ embeds: [embed] });
        setConfig(guildId, { last_stats_at: new Date().toISOString() });
        return true;
    } catch (err) {
        console.error(`[Stats] Failed for guild ${guildId}:`, err.message);
        return false;
    }
}

/**
 * Check all guilds with stats_channel set and post if it's Monday 09:00 UTC.
 * Deduped by last_stats_at — won't post twice in the same Monday window.
 */
async function runWeeklyStats(client) {
    const now = new Date();
    // Monday = 1, hour = 9 UTC
    if (now.getUTCDay() !== 1 || now.getUTCHours() !== 9) return;

    const guilds = getGuildsWithFeature('stats_channel');
    // Actually filter to rows that have stats_channel set (non-boolean column)
    const eligible = guilds.filter ? guilds : [];
    const rows = require('../utils/db.js').getConfig
        ? (() => {
            // Re-query properly: all guilds with stats_channel not null
            const Database = require('better-sqlite3');
            return []; // handled below via getGuildsWithStatsChannel
          })()
        : [];

    // Use direct query via shared db instance
    const allWithStats = _getGuildsWithStatsChannel();
    for (const cfg of allWithStats) {
        if (!cfg.stats_channel) continue;

        // Dedup: skip if already posted this Monday
        if (cfg.last_stats_at) {
            const lastAt = new Date(cfg.last_stats_at);
            const sameMonday = lastAt.getUTCDay() === 1 &&
                lastAt.getUTCFullYear() === now.getUTCFullYear() &&
                lastAt.getUTCMonth()    === now.getUTCMonth() &&
                lastAt.getUTCDate()     === now.getUTCDate();
            if (sameMonday) continue;
        }

        await runStatsForGuild(client, cfg.guild_id, cfg.stats_channel);
    }
}

// Direct DB access to get all guilds with stats_channel set
const Database = require('better-sqlite3');
const path     = require('path');
const DB_PATH  = path.join(__dirname, '../../data/sigil.db');

function _getGuildsWithStatsChannel() {
    try {
        const db = new Database(DB_PATH, { readonly: true });
        return db.prepare('SELECT * FROM guild_config WHERE stats_channel IS NOT NULL').all();
    } catch { return []; }
}

function startStatsRunner(client) {
    // Check every 5 minutes — precise enough for Monday 09:00 window
    setInterval(() => runWeeklyStats(client), 5 * 60_000);
    console.log('[Stats] Weekly stats runner started (checks every 5 min).');
}

module.exports = { startStatsRunner, runStatsForGuild, buildStatsEmbed };
