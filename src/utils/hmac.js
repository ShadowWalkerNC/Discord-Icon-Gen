const crypto = require('crypto');

/**
 * Validates an HMAC-SHA256 signature against a raw request body.
 *
 * @param {Buffer} rawBody   - The raw request body buffer
 * @param {string} secret    - The shared secret stored in guild config
 * @param {string} signature - The signature from the request header (hex or 'sha256=hex')
 * @returns {boolean}
 */
function verifyHmac(rawBody, secret, signature) {
    if (!secret || !signature) return false;
    // Strip 'sha256=' prefix if present (GitHub / generic format)
    const clean = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(
            Buffer.from(clean,    'hex'),
            Buffer.from(expected, 'hex')
        );
    } catch {
        return false;
    }
}

module.exports = { verifyHmac };
