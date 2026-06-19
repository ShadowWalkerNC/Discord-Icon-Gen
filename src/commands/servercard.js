const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { registerAllFonts, getAllFontFamilies } = require('../utils/canvas.js');
const { getBackgroundChoices } = require('../utils/backgrounds.js');
const { saveEntry } = require('../utils/history.js');
const { dispatchAutocomplete, autocompleteColor, autocompleteBackground } = require('../utils/autocomplete.js');

registerAllFonts();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servercard')
        .setDescription('Generate a shareable server profile card with live stats')
        .addStringOption(opt => opt.setName('tagline').setDescription('Custom server tagline'))
        .addStringOption(opt => opt.setName('primary_color').setDescription('Accent color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('secondary_color').setDescription('Secondary color').setAutocomplete(true))
        .addStringOption(opt => opt.setName('background').setDescription('Background style').addChoices(...getBackgroundChoices()))
        .addStringOption(opt => opt.setName('font').setDescription('Font family').addChoices(...getAllFontFamilies().map(f => ({ name: f, value: f })))),

    async autocomplete(interaction) {
        await dispatchAutocomplete(interaction, {
            primary_color:   autocompleteColor,
            secondary_color: autocompleteColor,
            background:      autocompleteBackground,
        });
    },

    async execute(interaction) {
        await interaction.deferReply();

        const tagline    = interaction.options.getString('tagline')        ?? interaction.guild?.description ?? 'A great community.';
        const primary    = interaction.options.getString('primary_color')  ?? '#5865F2';
        const secondary  = interaction.options.getString('secondary_color') ?? '#ffffff';
        const background = interaction.options.getString('background')     ?? 'gradient-dark';
        const font       = interaction.options.getString('font')           ?? getAllFontFamilies()[0];

        const guild = interaction.guild;
        const members   = guild?.memberCount ?? 0;
        const online    = guild?.presences?.cache.filter(p => p.status !== 'offline').size ?? 0;
        const channels  = guild?.channels.cache.filter(c => c.type !== 4).size ?? 0;
        const roles     = guild?.roles.cache.size ?? 0;
        const boosts    = guild?.premiumSubscriptionCount ?? 0;
        const boostTier = guild?.premiumTier ?? 0;

        const W = 700, H = 280;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

        let icon;
        try { icon = await loadImage(guild?.iconURL({ extension: 'png', size: 128 }) ?? ''); } catch { icon = null; }
        if (icon) {
            ctx.save();
            ctx.beginPath(); ctx.arc(80, 80, 55, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(icon, 25, 25, 110, 110);
            ctx.restore();
            ctx.beginPath(); ctx.arc(80, 80, 57, 0, Math.PI*2);
            ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();
        }

        ctx.font = `bold 26px "${font}"`; ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(guild?.name ?? 'Server', 155, 60);
        ctx.font = `14px "${font}"`; ctx.fillStyle = '#99AAB5';
        ctx.fillText(tagline, 155, 85);

        const stats = [
            [`👥 ${members}`,  'Members'],
            [`🟢 ${online}`,   'Online'],
            [`💬 ${channels}`, 'Channels'],
            [`🎭 ${roles}`,    'Roles'],
            [`💎 ${boosts}`,   `Tier ${boostTier}`],
        ];
        stats.forEach(([val, label], i) => {
            const x = 30 + i * 135, y = 170;
            ctx.font = `bold 22px "${font}"`; ctx.fillStyle = primary; ctx.textAlign = 'left';
            ctx.fillText(val, x, y);
            ctx.font = `12px "${font}"`; ctx.fillStyle = '#99AAB5';
            ctx.fillText(label, x, y + 22);
        });

        const divGrad = ctx.createLinearGradient(0, 0, W, 0);
        divGrad.addColorStop(0, primary); divGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = divGrad; ctx.fillRect(0, H - 6, W, 6);

        const buf = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: 'servercard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🏠 ${guild?.name ?? 'Server'} Card`)
            .setDescription(tagline)
            .setImage('attachment://servercard.png')
            .setColor(primary)
            .addFields(
                { name: 'Members',  value: `${members}`,     inline: true },
                { name: 'Online',   value: `${online}`,      inline: true },
                { name: 'Channels', value: `${channels}`,    inline: true },
            )
            .setFooter({ text: 'Sigil • servercard' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        saveEntry(interaction.user.id, { command: 'servercard', tagline, primary_color: primary, secondary_color: secondary, background, font });
    },
};
