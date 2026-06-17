/**
 * /brand — manual kit + AI-designed brand kit
 * Refactored to use src/utils/canvas.js shared render functions.
 */
'use strict';

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas }                                          = require('canvas');
const { getFont, getFontChoices }                               = require('../utils/fonts');
const { getBackgroundChoices }                                  = require('../utils/backgrounds');
const { getBorderChoices }                                      = require('../utils/borders');
const { geminiRequest, geminiImageRequest, extractJson }        = require('../utils/gemini');
const { getColorAutocomplete }                                  = require('../utils/colors');
const {
    registerAllFonts,
    autoFontSize,
    renderIcon,
    renderBanner,
    renderPalette,
    renderKit,
} = require('../utils/canvas');

registerAllFonts();

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const VALID_BACKGROUNDS = [
    'plain-black', 'plain-white', 'midnight-gradient',
    'sunset', 'forest', 'cyberpunk-grid', 'starfield', 'carbon-fiber',
];
const VALID_BORDERS = [
    'none', 'solid', 'glow', 'gradient', 'double', 'dashed', 'corner', 'neon',
];

// ── AI response parser ─────────────────────────────────────────────────────────────
function parseAiKitResponse(raw) {
    const p   = extractJson(raw);
    const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    return {
        name:       typeof p.name       === 'string' ? p.name.slice(0, 30).trim()                         : 'My Server',
        initials:   typeof p.initials   === 'string' ? p.initials.slice(0, 4).toUpperCase().trim()         : 'SRV',
        color:      hex.test(p.color)                ? p.color                                              : '#FFFFFF',
        color2:     p.color2 && hex.test(p.color2)   ? p.color2                                             : null,
        background: VALID_BACKGROUNDS.includes(p.background) ? p.background                                : 'plain-black',
        border:     VALID_BORDERS.includes(p.border)          ? p.border                                   : 'none',
        glow:       ['0','5','10','15','25'].includes(String(p.glow)) ? String(p.glow)                      : '10',
        tagline:    typeof p.tagline    === 'string' ? p.tagline.slice(0, 60).trim()                        : '',
        rationale:  typeof p.rationale  === 'string' ? p.rationale.slice(0, 300).trim()                    : '',
    };
}

// ── Command ───────────────────────────────────────────────────────────────────────
module.exports = {
    cooldown: 8,

    data: new SlashCommandBuilder()
        .setName('brand')
        .setDescription('Brand kit tools: manual or fully AI-designed.')
        .addSubcommand(sub =>
            sub.setName('kit')
                .setDescription('Generate icon + banner + palette manually.')
                .addStringOption(o => o.setName('name').setDescription('Brand/server name').setRequired(true))
                .addStringOption(o => o.setName('initials').setDescription('Short initials for the icon (1–4 chars)').setRequired(true))
                .addStringOption(o =>
                    o.setName('color')
                        .setDescription('Primary colour — pick a preset or type a hex code like #FF4500')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(o => o.setName('background').setDescription('Background style').setRequired(true).addChoices(...getBackgroundChoices()))
                .addStringOption(o =>
                    o.setName('color2')
                        .setDescription('Optional second colour for gradients')
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(o => o.setName('tagline').setDescription('Subtitle on the banner').setRequired(false))
                .addStringOption(o => o.setName('glow').setDescription('Glow intensity (default: Medium)').setRequired(false).addChoices(
                    { name: 'None',   value: '0'  },
                    { name: 'Low',    value: '5'  },
                    { name: 'Medium', value: '10' },
                    { name: 'High',   value: '15' },
                    { name: 'Ultra',  value: '25' },
                ))
                .addStringOption(o => o.setName('border').setDescription('Icon border style').setRequired(false).addChoices(...getBorderChoices()))
                .addStringOption(o => o.setName('font').setDescription('Font for both assets').setRequired(false).addChoices(...getFontChoices()))
        )
        .addSubcommand(sub =>
            sub.setName('ai')
                .setDescription('Describe your server — Gemini designs the full brand kit + custom image.')
                .addStringOption(o =>
                    o.setName('description')
                        .setDescription('Describe your server (e.g. "dark fantasy RPG with dragons")')
                        .setRequired(true)
                        .setMaxLength(200))
                .addStringOption(o =>
                    o.setName('image_prompt')
                        .setDescription('Image to generate — min 8 words')
                        .setRequired(true)
                        .setMaxLength(300))
                .addStringOption(o =>
                    o.setName('name')
                        .setDescription('Override the server name (optional)')
                        .setRequired(false)
                        .setMaxLength(30))
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'color' || focused.name === 'color2')
            await interaction.respond(getColorAutocomplete(focused.value));
    },

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ── /brand kit ───────────────────────────────────────────────────────────
        if (sub === 'kit') {
            const name       = interaction.options.getString('name');
            const initials   = interaction.options.getString('initials').slice(0, 4);
            const color      = interaction.options.getString('color');
            const color2     = interaction.options.getString('color2') || null;
            const background = interaction.options.getString('background') || 'plain-black';
            const tagline    = interaction.options.getString('tagline') || null;
            const glow       = interaction.options.getString('glow') || '10';
            const border     = interaction.options.getString('border') || 'none';
            const fontKey    = interaction.options.getString('font') || 'another-danger';

            if (!HEX_COLOR_REGEX.test(color))
                return interaction.reply({ content: '\u274c Primary color must be a valid hex code (e.g. #FF4500).', ephemeral: true });
            if (color2 && !HEX_COLOR_REGEX.test(color2))
                return interaction.reply({ content: '\u274c Secondary color must be a valid hex code.', ephemeral: true });

            const loadingEmbed = new EmbedBuilder().setColor('#808080').setDescription('\u2726 Crafting your brand kit\u2026');
            const reply = await interaction.reply({ embeds: [loadingEmbed] });

            try {
                const kit = await renderKit({ name, initials, color, color2, background, border, glow, tagline, fontKey });
                const colorLabel = color2 ? `${color} \u2192 ${color2}` : color;

                await reply.edit({
                    embeds: [new EmbedBuilder()
                        .setColor('#808080')
                        .setTitle(`\u2726 Brand Kit \u2014 ${name}`)
                        .setDescription([
                            `**Icon** \u2014 \`${initials}\` \u00b7 400\u00d7400`,
                            `**Banner** \u2014 \`${name}\`${tagline ? ` \u00b7 *${tagline}*` : ''} \u00b7 1024\u00d7320`,
                            `**Palette** \u2014 ${colorLabel}`,
                        ].join('\n'))
                        .setFooter({ text: `Sigil \u2022 /brand kit \u2022 ${name} \u2022 ${background} \u2022 ${colorLabel}` })],
                    files: [
                        new AttachmentBuilder(kit.icon,    { name: 'icon.png'    }),
                        new AttachmentBuilder(kit.banner,  { name: 'banner.png'  }),
                        new AttachmentBuilder(kit.palette, { name: 'palette.png' }),
                    ],
                });
            } catch (err) {
                console.error('[ERROR] /brand kit failed:', err);
                await reply.edit({ embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('Failed to generate the brand kit. Please try again.')] });
            }
            return;
        }

        // ── /brand ai ─────────────────────────────────────────────────────────────
        if (sub === 'ai') {
            const description  = interaction.options.getString('description').trim();
            const imagePrompt  = interaction.options.getString('image_prompt').trim();
            const nameOverride = interaction.options.getString('name') || null;

            if (!process.env.GEMINI_API_KEY)
                return interaction.reply({ content: '\u274c `GEMINI_API_KEY` is not configured.', ephemeral: true });

            const wordCount = imagePrompt.split(/\s+/).filter(Boolean).length;
            if (wordCount < 8)
                return interaction.reply({
                    content: `\u274c Your image prompt is too short (**${wordCount} word${wordCount === 1 ? '' : 's'}**). Use at least **8 words**.\n\n*Example: "dark mystical forest with glowing ancient runes at dusk"*`,
                    ephemeral: true,
                });

            const reply = await interaction.reply({
                embeds: [new EmbedBuilder().setColor('#808080')
                    .setDescription(`\u2726 Gemini is designing your brand kit and generating your image\u2026\n*"${description}"*`)],
            });

            const kitPrompt =
`Server description: "${description}"
${nameOverride ? `Server name: "${nameOverride}"` : 'Suggest a short punchy server name.'}

Available backgrounds: ${VALID_BACKGROUNDS.join(', ')}
Available borders: ${VALID_BORDERS.join(', ')}

Return ONLY a JSON object with these keys:
  name (string, max 30 chars${nameOverride ? `, use "${nameOverride}"` : ''})
  initials (string, 1-4 uppercase chars)
  color (hex string, e.g. "#FF4500")
  color2 (hex string or null)
  background (one of the available backgrounds)
  border (one of the available borders)
  glow (one of: "0" "5" "10" "15" "25")
  tagline (string, max 8 words)
  rationale (string, 1-2 sentences)

Start with { and end with }. Nothing else.`;

            const enhancedImagePrompt = `Discord server branding art: ${imagePrompt}. High quality, vibrant, detailed.`;

            try {
                await reply.edit({ embeds: [new EmbedBuilder().setColor('#808080')
                    .setDescription(`\u2726 Running in parallel\u2026\n\n**1.** Designing brand kit\n**2.** Generating image: *"${imagePrompt}"*`)] });

                const [rawResult, imageBuf] = await Promise.allSettled([
                    geminiRequest(kitPrompt, { temperature: 1.0, maxOutputTokens: 256 }),
                    geminiImageRequest(enhancedImagePrompt),
                ]);

                if (rawResult.status === 'rejected')
                    throw new Error(`Brand kit design failed: ${rawResult.reason?.message}`);

                const kit    = parseAiKitResponse(rawResult.value);
                const assets = await renderKit({
                    name:       kit.name,
                    initials:   kit.initials,
                    color:      kit.color,
                    color2:     kit.color2,
                    background: kit.background,
                    border:     kit.border,
                    glow:       kit.glow,
                    tagline:    kit.tagline,
                });

                const colorLabel = kit.color2 ? `${kit.color} \u2192 ${kit.color2}` : kit.color;
                const files = [
                    new AttachmentBuilder(assets.icon,    { name: 'icon.png'    }),
                    new AttachmentBuilder(assets.banner,  { name: 'banner.png'  }),
                    new AttachmentBuilder(assets.palette, { name: 'palette.png' }),
                ];

                let imageNote = '';
                if (imageBuf.status === 'fulfilled') {
                    files.push(new AttachmentBuilder(imageBuf.value, { name: 'generated-image.png' }));
                    imageNote = '\n\ud83c\udfa8 **Generated Image** \u2014 attached above';
                } else {
                    console.warn('[WARN] /brand ai image gen failed (non-fatal):', imageBuf.reason?.message);
                    imageNote = `\n\u26a0\ufe0f Image generation failed: *${imageBuf.reason?.message || 'unknown error'}*`;
                }

                await reply.edit({
                    embeds: [new EmbedBuilder()
                        .setColor(kit.color)
                        .setTitle(`\u2726 AI Brand Kit \u2014 ${kit.name}`)
                        .setDescription([
                            kit.tagline   ? `*"${kit.tagline}"*\n`            : '',
                            `**Icon** \u2014 \`${kit.initials}\` \u00b7 400\u00d7400`,
                            `**Banner** \u2014 \`${kit.name}\` \u00b7 1024\u00d7320`,
                            `**Palette** \u2014 ${colorLabel}`,
                            `**Background** \u2014 \`${kit.background}\``,
                            `**Border** \u2014 \`${kit.border}\``,
                            `**Glow** \u2014 ${kit.glow}`,
                            imageNote,
                            '',
                            kit.rationale ? `\ud83e\udde0 *${kit.rationale}*` : '',
                            '',
                            '\u26a1 Use these values in `/brand kit` to tweak.',
                        ].filter(Boolean).join('\n'))
                        .setFooter({ text: 'Sigil \u2022 /brand ai \u2022 powered by Gemini' })],
                    files,
                });
            } catch (err) {
                console.error('[ERROR] /brand ai failed:', err);
                await reply.edit({
                    embeds: [new EmbedBuilder().setColor('#FF0000')
                        .setDescription(`Failed to generate AI brand kit. ${err.message || 'Please try again.'}`)],
                });
            }
        }
    },
};
