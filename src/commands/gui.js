/**
 * /gui — Open the Sigil GUI Builder from Discord
 *
 * Replies with an ephemeral embed containing the local GUI server URL
 * so the user can click to open the visual brand builder in their browser.
 * Also registers a Discord webhook so generated assets are posted back
 * to the channel automatically after the user hits Generate in the GUI.
 *
 * Subcommands:
 *   /gui open            — post the GUI link (ephemeral)
 *   /gui open public     — post the GUI link publicly in the channel
 *   /gui status          — check if the GUI server is running
 */

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http  = require('http');

const GUI_PORT = Number(process.env.GUI_PORT) || 3420;
const GUI_URL  = process.env.GUI_PUBLIC_URL  || `http://127.0.0.1:${GUI_PORT}`;

// ── Health check against the local GUI server ─────────────────────────────
function pingGuiServer() {
    return new Promise(resolve => {
        const req = http.get(`http://127.0.0.1:${GUI_PORT}/health`, res => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end',  () => {
                try   { resolve({ ok: true, ...JSON.parse(data) }); }
                catch { resolve({ ok: true }); }
            });
        });
        req.setTimeout(2500, () => { req.destroy(); resolve({ ok: false }); });
        req.on('error', () => resolve({ ok: false }));
    });
}

// ── Register a webhook so the GUI can post results back to this channel ──
async function registerWebhook(interaction) {
    try {
        const existing = await interaction.channel.fetchWebhooks();
        let wh = existing.find(w => w.name === 'Sigil GUI');
        if (!wh) wh = await interaction.channel.createWebhook({ name: 'Sigil GUI', reason: 'Sigil GUI asset callback' });
        const body = JSON.stringify({ channelId: interaction.channelId, webhookUrl: wh.url });
        return new Promise(resolve => {
            const req = http.request({
                hostname: '127.0.0.1', port: GUI_PORT,
                path: '/webhook-register', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            }, res => { res.resume(); resolve(res.statusCode === 200); });
            req.setTimeout(2500, () => { req.destroy(); resolve(false); });
            req.on('error', () => resolve(false));
            req.write(body); req.end();
        });
    } catch { return false; }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gui')
        .setDescription('Open the Sigil visual brand builder GUI')
        .addSubcommand(sub =>
            sub.setName('open')
               .setDescription('Get the GUI link in your browser')
               .addBooleanOption(opt =>
                   opt.setName('public')
                      .setDescription('Post the link publicly in the channel (default: only you see it)')
                      .setRequired(false)
               )
        )
        .addSubcommand(sub =>
            sub.setName('status')
               .setDescription('Check if the Sigil GUI server is online')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ── /gui status ───────────────────────────────────────────────────────
        if (sub === 'status') {
            await interaction.deferReply({ ephemeral: true });
            const ping = await pingGuiServer();
            const embed = new EmbedBuilder()
                .setTitle(ping.ok ? '✦ GUI Server — Online' : '✦ GUI Server — Offline')
                .setColor(ping.ok ? 0x39ff14 : 0xa12c7b)
                .setDescription(ping.ok
                    ? `Server is running on port **${GUI_PORT}**. Uptime: **${Math.floor((ping.uptime || 0) / 60)}m**.`
                    : `GUI server is not responding on port **${GUI_PORT}**.\nStart it with: \`node gui/gui-server.js\``
                )
                .setFooter({ text: 'Sigil GUI Bridge' });
            return interaction.editReply({ embeds: [embed] });
        }

        // ── /gui open ─────────────────────────────────────────────────────────
        if (sub === 'open') {
            const isPublic = interaction.options.getBoolean('public') ?? false;
            await interaction.deferReply({ ephemeral: !isPublic });

            const ping = await pingGuiServer();

            // Register webhook so GUI can post assets back to this channel
            let webhookRegistered = false;
            if (ping.ok) {
                webhookRegistered = await registerWebhook(interaction).catch(() => false);
            }

            const embed = new EmbedBuilder()
                .setTitle('✦ Sigil GUI Builder')
                .setColor(0x8b0000)
                .setDescription([
                    `Open the visual brand builder in your browser:`,
                    `**[→ Launch GUI](${GUI_URL})**`,
                    '',
                    '**Features:**',
                    '• 54-color swatch library (click = primary, Shift+click = secondary)',
                    '• 12 background presets + gradient blend toggle',
                    '• 6 border modes, glow strength slider, 6 font options',
                    '• Live preview panel (icon, banner, palette, Discord embed)',
                    '• Export config JSON or hit **Generate** to run AI brand generation',
                    webhookRegistered
                        ? '\n✓ Asset callback registered — generated kits post here automatically.'
                        : '',
                ].join('\n').trim())
                .addFields(
                    { name: 'Server', value: ping.ok ? `✓ Online — port ${GUI_PORT}` : '✗ Offline — run `node gui/gui-server.js`', inline: true },
                    { name: 'Integration', value: 'Linked to `/brand ai` pipeline', inline: true },
                )
                .setFooter({ text: `Sigil GUI v1.0 • ${GUI_URL}` });

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
