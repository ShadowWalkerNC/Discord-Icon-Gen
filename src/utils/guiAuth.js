/**
 * src/utils/guiAuth.js
 * Bearer-token authentication middleware for the GUI server.
 *
 * Set GUI_AUTH_TOKEN in your environment to a long random string:
 *   openssl rand -hex 32
 *
 * Requests must include:  Authorization: Bearer <token>
 *
 * If GUI_AUTH_TOKEN is not set the middleware BLOCKS all requests with 503
 * so the server is never accidentally left open.
 */

const crypto = require('crypto');

/**
 * Returns an Express middleware that enforces bearer-token auth.
 * Call once at server startup and attach to all /api/* and /ws/* routes.
 */
function guiAuthMiddleware(req, res, next) {
    const secret = process.env.GUI_AUTH_TOKEN || '';

    // Hard-fail if the operator hasn't configured the secret.
    if (!secret) {
        return res.status(503).json({
            ok: false,
            error: 'GUI_AUTH_TOKEN is not configured. Set it in your environment to enable API access.',
        });
    }

    const authHeader = String(req.headers['authorization'] || '').trim();
    const provided   = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!provided) {
        return res.status(401).json({ ok: false, error: 'Missing Authorization header.' });
    }

    // Constant-time comparison to prevent timing attacks (ASVS V2.7)
    let valid = false;
    try {
        const a = Buffer.from(provided);
        const b = Buffer.from(secret);
        // crypto.timingSafeEqual requires equal-length buffers
        if (a.length === b.length) {
            valid = crypto.timingSafeEqual(a, b);
        }
    } catch {
        valid = false;
    }

    if (!valid) {
        return res.status(401).json({ ok: false, error: 'Invalid token.' });
    }

    return next();
}

module.exports = { guiAuthMiddleware };
