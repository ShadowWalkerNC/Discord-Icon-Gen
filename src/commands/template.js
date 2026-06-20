// template.js — package-gated (branding)
const guard = require('../utils/packageGuard');
const _original = require('./_template_impl');

module.exports = {
    data: _original.data,
    async autocomplete(interaction) { return _original.autocomplete?.(interaction); },
    async execute(interaction) {
        if (await guard(interaction, 'branding')) return;
        return _original.execute(interaction);
    },
};
