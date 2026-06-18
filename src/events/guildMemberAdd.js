const { handleMemberJoin }  = require('../automation/welcomeHandler.js');
const { handleMilestoneCheck } = require('../automation/milestoneHandler.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try { await handleMemberJoin(member); }    catch (e) { console.error('[welcomeHandler]', e); }
        try { await handleMilestoneCheck(member.guild); } catch (e) { console.error('[milestoneHandler]', e); }
    },
};
