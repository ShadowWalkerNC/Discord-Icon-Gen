'use strict';

const { apiRequest, getServer } = require('../lib/request.js');
const { ok, err, info, json: printJson, divider } = require('../lib/output.js');

module.exports = async function health({ flags }) {
    const srv = getServer(flags);
    divider('Server Health');
    console.log(`  Checking \x1b[36mhttp://${srv.host}:${srv.port}/health\x1b[0m ...\n`);

    const { status, body } = await apiRequest('GET', '/health', null, srv);

    if (flags.json) {
        printJson(body);
        return;
    }

    if (status === 200 && body.ok) {
        ok('Status',     '\x1b[32mONLINE\x1b[0m');
        ok('Version',    body.version || 'unknown');
        ok('AI',         body.ai_enabled ? '\x1b[32menabled\x1b[0m' : '\x1b[90mdisabled\x1b[0m');
        info('Host',     `${srv.host}:${srv.port}`);
    } else {
        err(`Server returned status ${status}`);
        process.exit(1);
    }
    console.log();
};
