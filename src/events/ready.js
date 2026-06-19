const { handleWeeklyReport }        = require('../automation/weeklyReportHandler.js');
const { startScheduledPostRunner }  = require('../automation/scheduledPostRunner.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`[Sigil] Logged in as ${client.user.tag}`);
        startWeeklyCron(client);
        startScheduledPostRunner(client);
    },
};

function startWeeklyCron(client) {
    function msUntilNextMonday9UTC() {
        const now  = new Date();
        const next = new Date(now);
        const day  = now.getUTCDay();
        if (day === 1 && now.getUTCHours() < 9) {
            next.setUTCHours(9, 0, 0, 0);
        } else {
            const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
            next.setUTCDate(now.getUTCDate() + daysUntilMonday);
            next.setUTCHours(9, 0, 0, 0);
        }
        return next.getTime() - now.getTime();
    }

    function scheduleNext() {
        const delay = msUntilNextMonday9UTC();
        console.log(`[weeklyCron] Next report in ${Math.round(delay / 3600000)}h`);
        setTimeout(async () => {
            await handleWeeklyReport(client);
            scheduleNext();
        }, delay);
    }

    scheduleNext();
}
