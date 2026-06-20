'use strict';

const { apiRequest, getServer } = require('../lib/request.js');
const { ok, err, info, warn, json: printJson, table, divider } = require('../lib/output.js');

const SUBS = ['play', 'skip', 'stop', 'seek', 'volume', 'vol', 'loop', 'status', 'queue', 'nowplaying'];

module.exports = async function media({ sub, flags, positional }) {
    const srv = getServer(flags);

    if (!sub) {
        err('Missing subcommand. Try: play, skip, stop, seek, volume, loop, status, queue');
        process.exit(1);
    }

    // ── play ──────────────────────────────────────────────────────────────
    if (sub === 'play') {
        const url = positional[0] || flags.url;
        if (!url) {
            err('Usage: sigil media play <url> [--mode 1-5] [--vol 0-5] [--cols N] [--pixel] [--loop]');
            process.exit(1);
        }
        const body = {
            url,
            mode:  Number(flags.mode  || 1),
            vol:   Number(flags.vol   || 1),
            cols:  flags.cols ? Number(flags.cols) : undefined,
            pixel: Boolean(flags.pixel),
            loop:  Boolean(flags.loop),
        };
        divider('Media — Enqueue');
        const { status, body: res } = await apiRequest('POST', '/api/media/enqueue', body, srv);
        if (flags.json) return printJson(res);
        if (res.ok) {
            ok('Queued',    `#${res.position}`);
            info('URL',     url.slice(0, 80));
            info('Mode',    body.mode);
            info('Volume',  body.vol);
            if (body.pixel) info('Pixel',  'ON');
            if (body.loop)  info('Loop',   'ON');
        } else {
            err(res.error || `HTTP ${status}`);
            process.exit(1);
        }
        console.log();
        return;
    }

    // ── skip ──────────────────────────────────────────────────────────────
    if (sub === 'skip') {
        const { status, body: res } = await apiRequest('POST', '/api/media/skip', {}, srv);
        if (flags.json) return printJson(res);
        res.ok ? ok('Skipped', 'Moving to next video') : err(res.error || `HTTP ${status}`);
        console.log();
        return;
    }

    // ── stop ──────────────────────────────────────────────────────────────
    if (sub === 'stop') {
        const { status, body: res } = await apiRequest('POST', '/api/media/stop', {}, srv);
        if (flags.json) return printJson(res);
        res.ok ? ok('Stopped', 'Queue cleared') : err(res.error || `HTTP ${status}`);
        console.log();
        return;
    }

    // ── seek ──────────────────────────────────────────────────────────────
    if (sub === 'seek') {
        const time = Number(positional[0] ?? flags.time ?? -1);
        if (time < 0) {
            err('Usage: sigil media seek <seconds>');
            process.exit(1);
        }
        const { status, body: res } = await apiRequest('POST', '/api/media/seek', { time }, srv);
        if (flags.json) return printJson(res);
        res.ok ? ok('Seeked', `${time}s`) : err(res.error || `HTTP ${status}`);
        console.log();
        return;
    }

    // ── volume ────────────────────────────────────────────────────────────
    if (sub === 'volume' || sub === 'vol') {
        const vol = Number(positional[0] ?? flags.vol ?? flags.level ?? -1);
        if (vol < 0 || vol > 5) {
            err('Usage: sigil media volume <0-5>');
            process.exit(1);
        }
        const { status, body: res } = await apiRequest('POST', '/api/media/volume', { vol }, srv);
        if (flags.json) return printJson(res);
        res.ok ? ok('Volume', `${vol}/5`) : err(res.error || `HTTP ${status}`);
        console.log();
        return;
    }

    // ── loop ──────────────────────────────────────────────────────────────
    if (sub === 'loop') {
        const raw = (positional[0] || flags.state || 'toggle').toLowerCase();
        let enabled;
        if (raw === 'on'  || raw === 'true'  || raw === '1') enabled = true;
        else if (raw === 'off' || raw === 'false' || raw === '0') enabled = false;
        else {
            // toggle: read current status first
            const { body: s } = await apiRequest('GET', '/api/media/status', null, srv);
            enabled = !s.loop;
        }
        const { status, body: res } = await apiRequest('POST', '/api/media/loop', { enabled }, srv);
        if (flags.json) return printJson(res);
        res.ok ? ok('Loop', enabled ? '\x1b[32mON\x1b[0m' : '\x1b[90mOFF\x1b[0m') : err(res.error || `HTTP ${status}`);
        console.log();
        return;
    }

    // ── status / nowplaying ───────────────────────────────────────────────
    if (sub === 'status' || sub === 'nowplaying') {
        const { status, body: res } = await apiRequest('GET', '/api/media/status', null, srv);
        if (flags.json) return printJson(res);
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }
        divider('Media — Now Playing');
        if (!res.playing) {
            warn('Nothing is playing.');
        } else {
            ok('Playing',  '\x1b[32mYES\x1b[0m');
            info('Video',   (res.video || '').slice(0, 72));
            info('Mode',    res.mode);
            info('Volume',  `${res.vol}/5`);
            info('Pixel',   res.pixel ? '\x1b[35mON\x1b[0m' : 'OFF');
            info('Loop',    res.loop  ? '\x1b[32mON\x1b[0m' : 'OFF');
            info('Queue',   `${res.current_index + 1} / ${res.queue_length}`);
        }
        console.log();
        return;
    }

    // ── queue ─────────────────────────────────────────────────────────────
    if (sub === 'queue') {
        const { status, body: res } = await apiRequest('GET', '/api/media/queue', null, srv);
        if (flags.json) return printJson(res);
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }
        divider(`Media Queue — ${res.queue.length} item(s)`);
        if (res.queue.length === 0) {
            warn('Queue is empty.');
        } else {
            for (let i = 0; i < res.queue.length; i++) {
                const e   = res.queue[i];
                const cur = i === res.current_index ? ' \x1b[32m← NOW\x1b[0m' : '';
                const px  = e.pixel ? ' \x1b[35m[pixel]\x1b[0m' : '';
                console.log(`  \x1b[90m${String(i + 1).padStart(3)}.\x1b[0m ${e.video.slice(0, 65)}${px}${cur}`);
                console.log(`       \x1b[90mmode=${e.mode} vol=${e.vol} cols=${e.cols}\x1b[0m`);
            }
        }
        console.log();
        return;
    }

    err(`Unknown media subcommand: ${sub}. Run \x1b[36msigil help\x1b[0m.`);
    process.exit(1);
};
