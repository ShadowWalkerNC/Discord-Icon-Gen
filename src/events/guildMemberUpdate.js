const { handleBoost } = require('../automation/boostHandler.js');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        // Detect new boost
        const wasBooster = oldMember.premiumSince;
        const isBooster  = newMember.premiumSince;
        if (!wasBooster && isBooster) {
            try { await handleBoost(newMember); } catch (e) { console.error('[boostHandler]', e); }
        }
    },
};
