/**
 * src/utils/packages.js
 *
 * Package registry + gate helper.
 *
 * Usage in any command:
 *   const { isEnabled, PACKAGES } = require('../utils/packages');
 *   if (!isEnabled(interaction.guild.id, 'faith')) {
 *     return interaction.reply({ content: '📦 The **Faith** package is not enabled on this server.', ephemeral: true });
 *   }
 */

const db = require('../db');

// ── Registry ─────────────────────────────────────────────────────────────────
// key          : internal identifier used in the disabled array + sigilconfig
// label        : friendly display name
// emoji        : shown in status embeds
// description  : one-line description shown in /sigilconfig packages list
// commands     : illustrative list (not enforced here — each command self-gates)

const PACKAGES = {
  branding: {
    key:         'branding',
    label:       'Branding',
    emoji:       '🎨',
    description: 'Server icons, banners, logos, splash screens, and brand kits.',
    commands:    ['/icon', '/banner', '/logo', '/avatar', '/compare', '/brand', '/template'],
  },
  nitrofree: {
    key:         'nitrofree',
    label:       'Nitro-Free',
    emoji:       '🚀',
    description: 'Stickers, emotes, reaction packs, role badges, and image tools — no Nitro needed.',
    commands:    ['/sticker', '/emote', '/reactionpack', '/rolebadge', '/resize', '/splash', '/namecard', '/servercard', '/profilecard', '/texteffect', '/themepreview'],
  },
  community: {
    key:         'community',
    label:       'Community',
    emoji:       '🏆',
    description: 'Welcome cards, rank cards, event banners, certificates, and invite cards.',
    commands:    ['/welcomecard', '/rankcard', '/announcebanner', '/eventbanner', '/certificate', '/invitecard'],
  },
  xp: {
    key:         'xp',
    label:       'XP & Levels',
    emoji:       '⭐',
    description: 'Passive XP gain, rank cards, leaderboards, and level-up role rewards.',
    commands:    ['/xprank', '/xpleaderboard', '/xpadmin', '/levelroles'],
  },
  tickets: {
    key:         'tickets',
    label:       'Tickets',
    emoji:       '🎟️',
    description: 'Thread-based private support channels with staff routing.',
    commands:    ['/ticket'],
  },
  polls: {
    key:         'polls',
    label:       'Polls',
    emoji:       '🗳️',
    description: 'Multi-option polls with live tracking and timed giveaways.',
    commands:    ['/poll', '/giveaway'],
  },
  analytics: {
    key:         'analytics',
    label:       'Analytics',
    emoji:       '📊',
    description: 'Weekly server health reports and live server stats.',
    commands:    ['/serverstats'],
  },
  faith: {
    key:         'faith',
    label:       'Faith',
    emoji:       '📖',
    description: 'Daily devotionals, Bible verse lookup, sermon posting, and prayer requests.',
    commands:    ['/devotional', '/sermon', '/prayer'],
  },
  aitools: {
    key:         'aitools',
    label:       'AI Tools',
    emoji:       '🧠',
    description: 'AI-powered palette extraction, mood check-ins, and smart helpers.',
    commands:    ['/mood', '/palette', '/saveme', '/history', '/gui'],
  },
};

// ── Cached prepared statements ────────────────────────────────────────────────
const stmtGet = db.prepare(
  `SELECT packages_disabled FROM guild_config WHERE guild_id = ?`
);
const stmtUpsert = db.prepare(`
  INSERT INTO guild_config (guild_id, packages_disabled)
  VALUES (?, ?)
  ON CONFLICT(guild_id) DO UPDATE SET packages_disabled = excluded.packages_disabled
`);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the current disabled-package array for a guild.
 * @param {string} guildId
 * @returns {string[]}
 */
function getDisabled(guildId) {
  const row = stmtGet.get(guildId);
  if (!row || !row.packages_disabled) return [];
  try { return JSON.parse(row.packages_disabled); } catch { return []; }
}

/**
 * Persist a new disabled list for a guild.
 * @param {string}   guildId
 * @param {string[]} list
 */
function setDisabled(guildId, list) {
  stmtUpsert.run(guildId, JSON.stringify(list));
}

/**
 * Returns true when the package is enabled (i.e. NOT in the disabled list).
 * All packages default to enabled — only explicitly disabled ones return false.
 *
 * @param {string} guildId
 * @param {string} packageKey  — one of the keys in PACKAGES
 * @returns {boolean}
 */
function isEnabled(guildId, packageKey) {
  const disabled = getDisabled(guildId);
  return !disabled.includes(packageKey);
}

/**
 * Enable a package (remove from disabled list).
 * @param {string} guildId
 * @param {string} packageKey
 * @returns {'ok'|'already_on'|'unknown'}
 */
function enablePackage(guildId, packageKey) {
  if (!PACKAGES[packageKey]) return 'unknown';
  const list = getDisabled(guildId);
  if (!list.includes(packageKey)) return 'already_on';
  setDisabled(guildId, list.filter(k => k !== packageKey));
  return 'ok';
}

/**
 * Disable a package (add to disabled list).
 * @param {string} guildId
 * @param {string} packageKey
 * @returns {'ok'|'already_off'|'unknown'}
 */
function disablePackage(guildId, packageKey) {
  if (!PACKAGES[packageKey]) return 'unknown';
  const list = getDisabled(guildId);
  if (list.includes(packageKey)) return 'already_off';
  setDisabled(guildId, [...list, packageKey]);
  return 'ok';
}

/**
 * Returns a snapshot of all packages with their current enabled state.
 * @param {string} guildId
 * @returns {Array<{key, label, emoji, description, commands, enabled}>}
 */
function getAllPackageStates(guildId) {
  const disabled = getDisabled(guildId);
  return Object.values(PACKAGES).map(pkg => ({
    ...pkg,
    enabled: !disabled.includes(pkg.key),
  }));
}

module.exports = { PACKAGES, isEnabled, enablePackage, disablePackage, getAllPackageStates };
