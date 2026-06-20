'use strict';

const { apiRequest, getServer } = require('../lib/request.js');
const { ok, err, info, json: printJson, divider } = require('../lib/output.js');

module.exports = async function packages({ sub, flags, positional }) {
    const srv     = getServer(flags);
    const guildId = String(flags.guild || flags.g || '');

    if (!sub || sub === 'list') {
        if (!guildId) {
            err('Usage: sigil packages list --guild <guild_id>');
            process.exit(1);
        }
        const { status, body: res } = await apiRequest('GET', `/api/packages?guild_id=${guildId}`, null, srv);
        if (flags.json) return printJson(res);
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }
        divider(`Packages — Guild ${guildId}`);
        for (const p of res.packages) {
            const state = p.enabled
                ? '\x1b[32m● enabled \x1b[0m'
                : '\x1b[31m○ disabled\x1b[0m';
            console.log(`  ${state}  \x1b[1m${p.emoji} ${p.key}\x1b[0m  \x1b[90m${p.description}\x1b[0m`);
        }
        console.log();
        return;
    }

    if (sub === 'enable' || sub === 'disable') {
        const pkgKey = positional[0] || flags.package || flags.pkg;
        if (!pkgKey) {
            err(`Usage: sigil packages ${sub} <package_key> --guild <guild_id>`);
            process.exit(1);
        }
        if (!guildId) {
            err('Missing --guild <guild_id>');
            process.exit(1);
        }
        const enabled = sub === 'enable';
        const { status, body: res } = await apiRequest('POST', '/api/packages', { guild_id: guildId, package: pkgKey, enabled }, srv);
        if (flags.json) return printJson(res);
        if (res.ok) {
            ok(sub === 'enable' ? 'Enabled' : 'Disabled', `\x1b[1m${pkgKey}\x1b[0m for guild ${guildId}`);
            if (res.result === 'already_on')  info('Note', 'Package was already enabled');
            if (res.result === 'already_off') info('Note', 'Package was already disabled');
        } else {
            err(res.error || `HTTP ${status}`);
            process.exit(1);
        }
        console.log();
        return;
    }

    err(`Unknown packages subcommand: ${sub}`);
    process.exit(1);
};
