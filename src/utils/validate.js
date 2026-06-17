export function validateIconBuffer(buf) {
  if (!buf || !Buffer.isBuffer(buf)) throw new Error('Icon buffer is empty or invalid');
  const size = buf.length;
  if (size > 256 * 1024) throw new Error(`Icon too large: ${Math.round(size/1024)}KB (max 256KB)`);
  if (size < 100)         throw new Error('Icon buffer is suspiciously small');
  return true;
}

export function validateBannerBuffer(buf) {
  if (!buf || !Buffer.isBuffer(buf)) throw new Error('Banner buffer is empty or invalid');
  const size = buf.length;
  if (size > 10 * 1024 * 1024) throw new Error(`Banner too large: ${Math.round(size/1024/1024)}MB (max 10MB)`);
  if (size < 100)               throw new Error('Banner buffer is suspiciously small');
  return true;
}

export function checkPermission(guild, permName) {
  const me = guild.members.me;
  if (!me) return false;
  return me.permissions.has(permName);
}

export function canUseRoleIcons(guild) {
  return (guild.premiumTier || 0) >= 2;
}

export function getMaxEmojiSlots(guild) {
  return { 0: 50, 1: 100, 2: 150, 3: 250 }[guild.premiumTier || 0] || 50;
}
