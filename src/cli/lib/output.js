'use strict';

/**
 * Pretty-print helpers for CLI output.
 * Pass --json flag to get raw JSON instead.
 */

function ok(label, value) {
    console.log(`  \x1b[32m✔\x1b[0m  \x1b[1m${label}:\x1b[0m ${value}`);
}

function info(label, value) {
    console.log(`  \x1b[36m→\x1b[0m  \x1b[1m${label}:\x1b[0m ${value}`);
}

function warn(msg) {
    console.log(`  \x1b[33m⚠\x1b[0m  ${msg}`);
}

function err(msg) {
    console.error(`  \x1b[31m✗\x1b[0m  ${msg}`);
}

function json(data) {
    console.log(JSON.stringify(data, null, 2));
}

function table(rows) {
    // rows: [{label, value, color?}]
    for (const row of rows) {
        const c = row.color || '\x1b[0m';
        console.log(`  ${c}${String(row.label).padEnd(18)}\x1b[0m ${row.value}`);
    }
}

function divider(title) {
    const bar = '─'.repeat(44);
    if (title) {
        console.log(`\n  \x1b[90m${bar}\x1b[0m`);
        console.log(`  \x1b[1m${title}\x1b[0m`);
        console.log(`  \x1b[90m${bar}\x1b[0m`);
    } else {
        console.log(`  \x1b[90m${bar}\x1b[0m`);
    }
}

module.exports = { ok, info, warn, err, json, table, divider };
