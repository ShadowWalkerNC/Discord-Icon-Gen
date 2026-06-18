// start.js — spawns both the Discord bot and GUI server as child processes
const { spawn } = require('child_process');

function launch(label, cmd, args) {
    const proc = spawn(cmd, args, { stdio: 'pipe', env: process.env });

    proc.stdout.on('data', d => process.stdout.write(`[${label}] ${d}`));
    proc.stderr.on('data', d => process.stderr.write(`[${label}] ${d}`));

    proc.on('exit', (code) => {
        console.error(`[${label}] exited with code ${code} — restarting in 3s...`);
        setTimeout(() => launch(label, cmd, args), 3000);
    });

    return proc;
}

console.log('[Sigil] Starting bot + GUI server...');
launch('bot', 'node', ['src/index.js']);
launch('gui', 'node', ['gui/gui-server.js']);
