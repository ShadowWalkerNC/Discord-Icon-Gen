const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const PRESETS = [
    { name: 'Server Icon (512×512)',       value: '512x512'    },
    { name: 'Server Banner (1920×480)',    value: '1920x480'   },
    { name: 'Invite Splash (1920×1080)',   value: '1920x1080'  },
    { name: 'Emoji (128×128)',             value: '128x128'    },
    { name: 'Sticker (320×320)',           value: '320x320'    },
    { name: 'Profile Banner (600×240)',    value: '600x240'    },
    { name: 'Square (256×256)',            value: '256x256'    },
    { name: 'Square (1024×1024)',          value: '1024x1024'  },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resize')
        .setDescription('Resize any image URL to Discord-optimal dimensions and download as PNG')
        .addStringOption(opt => opt.setName('url').setDescription('URL of the image to resize').setRequired(true))
        .addStringOption(opt => opt.setName('preset').setDescription('Target size preset').setRequired(true).addChoices(...PRESETS))
        .addBooleanOption(opt => opt.setName('fit').setDescription('Fit inside dimensions without cropping (default: true)')),

    async execute(interaction) {
        await interaction.deferReply();

        const url    = interaction.options.getString('url');
        const preset = interaction.options.getString('preset');
        const fit    = interaction.options.getBoolean('fit') ?? true;

        const [W, H] = preset.split('x').map(Number);

        let img;
        try {
            img = await loadImage(url);
        } catch {
            return interaction.editReply({ content: '\u274C Could not load that image URL. Make sure it\'s a direct link to a PNG, JPG, or GIF.' });
        }

        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');

        // Fill background black for transparent images
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        if (fit) {
            // Fit: scale to fit inside W×H, centred, letterboxed
            const scale = Math.min(W / img.width, H / img.height);
            const dw    = img.width  * scale;
            const dh    = img.height * scale;
            const dx    = (W - dw) / 2;
            const dy    = (H - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        } else {
            // Fill: cover, centre-cropped
            const scale = Math.max(W / img.width, H / img.height);
            const dw    = img.width  * scale;
            const dh    = img.height * scale;
            const dx    = (W - dw) / 2;
            const dy    = (H - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        }

        const buf        = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buf, { name: `resized-${preset}.png` });

        const presetLabel = PRESETS.find(p => p.value === preset)?.name ?? preset;

        const embed = new EmbedBuilder()
            .setTitle('\uD83D\uDDBC\uFE0F Image Resized')
            .setDescription(`Resized to **${presetLabel}** using ${fit ? 'fit (letterbox)' : 'fill (crop)'} mode.`)
            .setImage(`attachment://resized-${preset}.png`)
            .setColor('#39FF14')
            .addFields(
                { name: 'Original', value: `${img.width} × ${img.height} px`, inline: true },
                { name: 'Output',   value: `${W} × ${H} px`,                  inline: true },
                { name: 'Mode',     value: fit ? 'Fit' : 'Fill',              inline: true },
            )
            .setFooter({ text: 'Sigil \u2022 resize \u2014 optimised for Discord upload' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    },
};
