'use strict';

const { apiRequest, getServer } = require('../lib/request.js');
const { ok, err, info, json: printJson, divider } = require('../lib/output.js');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

function saveB64(b64, filename) {
    const outDir  = process.env.SIGIL_PREVIEW_DIR || os.tmpdir();
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    return outPath;
}

module.exports = async function preview({ sub, flags, positional }) {
    const srv  = getServer(flags);
    const save = flags.save || flags.out;

    // ── welcome ───────────────────────────────────────────────────────────
    if (!sub || sub === 'welcome') {
        const body = {
            username:     flags.username || flags.user || 'NewMember',
            message:      flags.message  || flags.msg  || 'Welcome to the server!',
            primary_color:flags.color    || flags.primary || '#39FF14',
            background:   flags.bg       || 'gradient-purple',
            font:         flags.font     || 'Arial',
            member_count: flags.members  ? `Member #${flags.members}` : undefined,
        };
        divider('Preview — Welcome Card');
        info('Username', body.username);
        info('Color',    body.primary_color);
        info('BG',       body.background);
        console.log();

        const { status, body: res } = await apiRequest('POST', '/preview/welcome', body, srv);
        if (flags.json) return printJson({ ok: res.ok, saved: false });
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }

        const filename = `sigil-welcome-${Date.now()}.png`;
        const outPath  = saveB64(res.image_b64, filename);
        ok('Rendered', outPath);
        info('Tip', `Open in browser: file://${outPath}`);
        console.log();
        return;
    }

    // ── rankcard ──────────────────────────────────────────────────────────
    if (sub === 'rankcard' || sub === 'rank') {
        const body = {
            username:     flags.username || flags.user  || 'Player',
            level:        Number(flags.level  || 1),
            rank:         Number(flags.rank   || 1),
            current_xp:  Number(flags.xp     || 0),
            required_xp: Number(flags.max    || 1000),
            primary_color:flags.color  || flags.primary || '#5865F2',
            background:   flags.bg     || 'solid-dark',
            font:         flags.font   || 'Arial',
        };
        divider('Preview — Rank Card');
        info('Username', body.username);
        info('Level',    body.level);
        info('Rank',     body.rank);
        console.log();

        const { status, body: res } = await apiRequest('POST', '/preview/rankcard', body, srv);
        if (flags.json) return printJson({ ok: res.ok });
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }

        const filename = `sigil-rankcard-${Date.now()}.png`;
        const outPath  = saveB64(res.image_b64, filename);
        ok('Rendered', outPath);
        info('Tip', `Open in browser: file://${outPath}`);
        console.log();
        return;
    }

    // ── brand ─────────────────────────────────────────────────────────────
    if (sub === 'brand') {
        const body = {
            text:           flags.text      || 'SIGIL',
            primary_color:  flags.primary   || flags.color || '#8B0000',
            secondary_color:flags.secondary || '#4B0082',
            background:     flags.bg        || 'midnight-gradient',
            border:         flags.border    || 'none',
            font:           flags.font      || 'Arial Black',
            glow:           Number(flags.glow    || 10),
            opacity:        Number(flags.opacity || 0.9),
            shape:          flags.shape     || 'square',
        };
        divider('Preview — Brand');
        info('Text',    body.text);
        info('Primary', body.primary_color);
        info('BG',      body.background);
        console.log();

        const { status, body: res } = await apiRequest('POST', '/preview', body, srv);
        if (flags.json) return printJson({ ok: res.ok });
        if (!res.ok) { err(res.error || `HTTP ${status}`); process.exit(1); }

        const iconPath   = saveB64(res.icon_b64,   `sigil-icon-${Date.now()}.png`);
        const bannerPath = saveB64(res.banner_b64, `sigil-banner-${Date.now()}.png`);
        ok('Icon',   iconPath);
        ok('Banner', bannerPath);
        info('Tip', `Open in browser: file://${iconPath}`);
        console.log();
        return;
    }

    err(`Unknown preview subcommand: ${sub}. Options: welcome, rankcard, brand`);
    process.exit(1);
};
