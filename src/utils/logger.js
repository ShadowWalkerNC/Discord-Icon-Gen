const { getConfig } = require('./db.js');

async function sendLog(client, guildId, embed) {
    try {
        const config = getConfig(guildId);
        if (!config?.mod_log_channel) return;
        const channel = await client.channels.fetch(config.mod_log_channel).catch(() => null);
        if (!channel?.isTextBased()) return;
        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('[Logger] Failed to send log:', err.message);
    }
}

module.exports = { sendLog };
