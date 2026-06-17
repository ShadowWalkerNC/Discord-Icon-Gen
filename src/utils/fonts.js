const path = require('path');
const fs   = require('fs');

const FONTS = {
    'another-danger': {
        label:  'Another Danger',
        file:   path.resolve(__dirname, '..', 'fonts', 'font.otf'),
        family: 'Another Danger',
    },
    'bebas-neue': {
        label:  'Bebas Neue',
        file:   path.resolve(__dirname, '..', 'fonts', 'BebasNeue-Regular.ttf'),
        family: 'Bebas Neue',
    },
    'oswald': {
        label:  'Oswald',
        file:   path.resolve(__dirname, '..', 'fonts', 'Oswald-Bold.ttf'),
        family: 'Oswald',
    },
    'playfair': {
        label:  'Playfair Display',
        file:   path.resolve(__dirname, '..', 'fonts', 'PlayfairDisplay-Bold.ttf'),
        family: 'Playfair Display',
    },
    'dancing-script': {
        label:  'Dancing Script',
        file:   path.resolve(__dirname, '..', 'fonts', 'DancingScript-Bold.ttf'),
        family: 'Dancing Script',
    },
    'source-code-pro': {
        label:  'Source Code Pro',
        file:   path.resolve(__dirname, '..', 'fonts', 'SourceCodePro-Bold.ttf'),
        family: 'Source Code Pro',
    },
};

function getAllFonts() {
    return Object.values(FONTS).filter(font => {
        if (!fs.existsSync(font.file)) return false;
        const size = fs.statSync(font.file).size;
        if (size < 1024) return false;
        return true;
    });
}

function getFont(key) {
    const font = FONTS[key];
    if (!font) return FONTS['another-danger'];
    if (!fs.existsSync(font.file) || fs.statSync(font.file).size < 1024)
        return FONTS['another-danger'];
    return font;
}

function getFontChoices() {
    const available = new Set(getAllFonts().map(f => f.family));
    return Object.entries(FONTS)
        .filter(([, font]) => available.has(font.family))
        .map(([value, font]) => ({ name: font.label, value }));
}

function getAllFontOptions() {
    return Object.entries(FONTS).map(([value, font]) => ({ label: font.label, value }));
}

module.exports = { getFont, getAllFonts, getFontChoices, getAllFontOptions };
