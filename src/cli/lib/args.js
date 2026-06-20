'use strict';

/**
 * Minimal zero-dependency arg parser.
 * Handles:
 *   sigil health
 *   sigil media play <url> --guild 123 --mode 3
 *   sigil packages list --guild 123
 *   sigil packages enable xp --guild 123
 *   sigil preview welcome --username Shadow --color "#39FF14"
 */
function parseArgs(argv) {
    const positional = [];
    const flags = {};
    let command = null;
    let sub = null;

    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                flags[key] = next;
                i += 2;
            } else {
                flags[key] = true;
                i++;
            }
        } else if (arg.startsWith('-') && arg.length === 2) {
            const key = arg.slice(1);
            const next = argv[i + 1];
            if (next && !next.startsWith('-')) {
                flags[key] = next;
                i += 2;
            } else {
                flags[key] = true;
                i++;
            }
        } else {
            positional.push(arg);
            i++;
        }
    }

    if (positional.length > 0) command   = positional[0];
    if (positional.length > 1) sub       = positional[1];

    return { command, sub, flags, positional: positional.slice(2) };
}

module.exports = { parseArgs };
