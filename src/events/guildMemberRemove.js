const { handleMemberLeave } = require('../automation/goodbyeHandler.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try { await handleMemberLeave(member); } catch (e) { console.error('[goodbyeHandler]', e); }
    },
};
