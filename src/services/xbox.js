// Xbox / OpenXBL service
// Docs: https://xbl.io/console

const BASE_URL = 'https://xbl.io/api/v2';

function headers() {
  return {
    'X-Authorization': process.env.OPENXBL_API_KEY,
    'Accept': 'application/json',
    'Accept-Language': 'en-US',
  };
}

async function searchPlayer(gamertag) {
  const res = await fetch(
    `${BASE_URL}/friends/search?gt=${encodeURIComponent(gamertag)}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`OpenXBL ${res.status}: ${res.statusText}`);
  return res.json();
}

async function getProfile(xuid) {
  const res = await fetch(
    `${BASE_URL}/account/${xuid}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`OpenXBL ${res.status}: ${res.statusText}`);
  return res.json();
}

async function getAchievements(xuid) {
  const res = await fetch(
    `${BASE_URL}/achievements/player/${xuid}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`OpenXBL ${res.status}: ${res.statusText}`);
  return res.json();
}

async function getPresence(xuid) {
  const res = await fetch(
    `${BASE_URL}/presence/${xuid}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`OpenXBL ${res.status}: ${res.statusText}`);
  return res.json();
}

function isEnabled() {
  return !!process.env.OPENXBL_API_KEY;
}

module.exports = { searchPlayer, getProfile, getAchievements, getPresence, isEnabled };
