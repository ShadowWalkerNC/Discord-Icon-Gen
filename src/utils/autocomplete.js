/**
 * autocomplete.js
 * Central registry for all shared autocomplete option types.
 * Import helpers from here into any command that needs them.
 */

const { getBackgroundChoices } = require('./backgrounds.js');
const { getBorderChoices }     = require('./borders.js');
const { getColorAutocomplete } = require('./colors.js');

// ── Static choice lists ────────────────────────────────────────────────────

const SHAPE_CHOICES = [
    { name: 'Circle',  value: 'circle'  },
    { name: 'Rounded', value: 'rounded' },
    { name: 'Square',  value: 'square'  },
    { name: 'Hexagon', value: 'hexagon' },
    { name: 'Diamond', value: 'diamond' },
];

const EFFECT_CHOICES = [
    { name: 'Neon',    value: 'neon'    },
    { name: 'Chrome',  value: 'chrome'  },
    { name: 'Fire',    value: 'fire'    },
    { name: 'Glitch',  value: 'glitch'  },
    { name: 'Ice',     value: 'ice'     },
    { name: 'Gold',    value: 'gold'    },
    { name: 'Shadow',  value: 'shadow'  },
    { name: 'Outline', value: 'outline' },
];

const TEMPLATE_CHOICES = [
    { name: 'Demonfall',    value: 'demonfall'    },
    { name: 'Cyber Nexus',  value: 'cyber-nexus'  },
    { name: 'Arcane Order', value: 'arcane-order' },
    { name: 'Cozy Den',     value: 'cozy-den'     },
    { name: 'Neon Drift',   value: 'neon-drift'   },
    { name: 'Polar Ops',    value: 'polar-ops'    },
    { name: 'Emerald Fang', value: 'emerald-fang' },
    { name: 'Void Protocol',value: 'void-protocol'},
];

const RESIZE_PRESET_CHOICES = [
    { name: 'Server Icon (512×512)',       value: 'server-icon'     },
    { name: 'Banner (960×540)',            value: 'banner'          },
    { name: 'Splash (1920×1080)',          value: 'splash'          },
    { name: 'Emoji (128×128)',             value: 'emoji'           },
    { name: 'Sticker (320×320)',           value: 'sticker'         },
    { name: 'Avatar (256×256)',            value: 'avatar'          },
    { name: 'Profile Banner (600×240)',    value: 'profile-banner'  },
    { name: 'Thumbnail (320×180)',         value: 'thumbnail'       },
];

const ANNOUNCE_TYPE_CHOICES = [
    { name: 'Announcement',  value: 'announcement'  },
    { name: 'Alert',         value: 'alert'         },
    { name: 'Update',        value: 'update'        },
    { name: 'Event',         value: 'event'         },
    { name: 'Maintenance',   value: 'maintenance'   },
    { name: 'Celebration',   value: 'celebration'   },
];

const EVENT_TYPE_CHOICES = [
    { name: 'Gaming',      value: 'gaming'      },
    { name: 'Music',       value: 'music'       },
    { name: 'Art',         value: 'art'         },
    { name: 'Education',   value: 'education'   },
    { name: 'Social',      value: 'social'      },
    { name: 'Tournament',  value: 'tournament'  },
];

const CERTIFICATE_TYPE_CHOICES = [
    { name: 'Achievement',       value: 'achievement'       },
    { name: 'Completion',        value: 'completion'        },
    { name: 'Staff of the Month',value: 'staff_of_month'    },
    { name: 'Tournament Winner', value: 'tournament_winner' },
    { name: 'Top Contributor',   value: 'top_contributor'   },
    { name: 'Anniversary',       value: 'anniversary'       },
    { name: 'Custom',            value: 'custom'            },
    { name: 'Milestone',         value: 'milestone'         },
];

const STICKER_STYLE_CHOICES = [
    { name: 'Standard', value: 'standard' },
    { name: 'Outlined', value: 'outlined' },
    { name: 'Bubble',   value: 'bubble'   },
];

const ROLE_BADGE_STYLE_CHOICES = [
    { name: 'Pill',     value: 'pill'     },
    { name: 'Rounded',  value: 'rounded'  },
    { name: 'Hex',      value: 'hex'      },
    { name: 'Diamond',  value: 'diamond'  },
];

const PALETTE_FORMAT_CHOICES = [
    { name: 'CSS Variables', value: 'css'      },
    { name: 'Tailwind Config',value: 'tailwind' },
    { name: 'Hex List',      value: 'hex'      },
];

// ── Autocomplete filter helpers ────────────────────────────────────────────

/**
 * Generic filter: returns up to 25 matching choices from a list.
 * @param {string} focused - Current typed value
 * @param {{ name: string, value: string }[]} choices
 */
function filterChoices(focused, choices) {
    const q = focused.toLowerCase();
    return choices
        .filter(c => c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q))
        .slice(0, 25);
}

/**
 * Autocomplete handler for color options — delegates to colors.js.
 * Usage: await interaction.respond(getColorAutocomplete(focused));
 */
function autocompleteColor(focused) {
    return getColorAutocomplete(focused);
}

function autocompleteShape(focused)          { return filterChoices(focused, SHAPE_CHOICES);            }
function autocompleteEffect(focused)         { return filterChoices(focused, EFFECT_CHOICES);           }
function autocompleteTemplate(focused)       { return filterChoices(focused, TEMPLATE_CHOICES);         }
function autocompleteResizePreset(focused)   { return filterChoices(focused, RESIZE_PRESET_CHOICES);    }
function autocompleteAnnounceType(focused)   { return filterChoices(focused, ANNOUNCE_TYPE_CHOICES);    }
function autocompleteEventType(focused)      { return filterChoices(focused, EVENT_TYPE_CHOICES);       }
function autocompleteCertType(focused)       { return filterChoices(focused, CERTIFICATE_TYPE_CHOICES); }
function autocompleteStickerStyle(focused)   { return filterChoices(focused, STICKER_STYLE_CHOICES);    }
function autocompleteRoleBadgeStyle(focused) { return filterChoices(focused, ROLE_BADGE_STYLE_CHOICES); }
function autocompletePaletteFormat(focused)  { return filterChoices(focused, PALETTE_FORMAT_CHOICES);   }

/**
 * Background autocomplete — filters getBackgroundChoices() by typed value.
 */
function autocompleteBackground(focused) {
    return filterChoices(focused, getBackgroundChoices());
}

/**
 * Border autocomplete — filters getBorderChoices() by typed value.
 */
function autocompleteBorder(focused) {
    return filterChoices(focused, getBorderChoices());
}

/**
 * Master dispatcher for commands with multiple autocomplete-enabled options.
 * Pass the interaction and a map of optionName -> autocomplete function.
 *
 * Example usage in a command:
 *   async autocomplete(interaction) {
 *       await dispatchAutocomplete(interaction, {
 *           primary_color:   autocompleteColor,
 *           secondary_color: autocompleteColor,
 *           background:      autocompleteBackground,
 *           border:          autocompleteBorder,
 *           effect:          autocompleteEffect,
 *       });
 *   }
 */
async function dispatchAutocomplete(interaction, handlerMap) {
    const focused = interaction.options.getFocused(true);
    const handler = handlerMap[focused.name];
    if (handler) {
        await interaction.respond(handler(focused.value));
    } else {
        await interaction.respond([]);
    }
}

module.exports = {
    // Choice arrays (for .addChoices(...) in SlashCommandBuilder)
    SHAPE_CHOICES,
    EFFECT_CHOICES,
    TEMPLATE_CHOICES,
    RESIZE_PRESET_CHOICES,
    ANNOUNCE_TYPE_CHOICES,
    EVENT_TYPE_CHOICES,
    CERTIFICATE_TYPE_CHOICES,
    STICKER_STYLE_CHOICES,
    ROLE_BADGE_STYLE_CHOICES,
    PALETTE_FORMAT_CHOICES,

    // Filter functions
    filterChoices,

    // Autocomplete handlers
    autocompleteColor,
    autocompleteShape,
    autocompleteEffect,
    autocompleteTemplate,
    autocompleteResizePreset,
    autocompleteAnnounceType,
    autocompleteEventType,
    autocompleteCertType,
    autocompleteStickerStyle,
    autocompleteRoleBadgeStyle,
    autocompletePaletteFormat,
    autocompleteBackground,
    autocompleteBorder,

    // Master dispatcher
    dispatchAutocomplete,
};
