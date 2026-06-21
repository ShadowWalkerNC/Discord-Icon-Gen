/**
 * src/utils/ssrfGuard.js
 * Validates that a URL is safe to proxy — blocks RFC-1918, loopback,
 * link-local, and metadata service addresses (OWASP A10:2021 SSRF).
 */

const { URL } = require('url');
const dns     = require('dns').promises;
const net     = require('net');

// CIDR ranges that must never be contacted via user-supplied URLs
const BLOCKED_CIDRS = [
    // Loopback
    { base: '127.0.0.0',   prefix: 8  },
    // RFC-1918 private
    { base: '10.0.0.0',    prefix: 8  },
    { base: '172.16.0.0',  prefix: 12 },
    { base: '192.168.0.0', prefix: 16 },
    // Link-local / APIPA
    { base: '169.254.0.0', prefix: 16 },
    // AWS/GCP/Azure metadata
    { base: '100.64.0.0',  prefix: 10 },
    // IPv6 loopback (handled separately below)
];

function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function cidrContains(ip, base, prefix) {
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

function isBlockedIPv4(ip) {
    return BLOCKED_CIDRS.some(({ base, prefix }) => cidrContains(ip, base, prefix));
}

function isBlockedIPv6(ip) {
    const normalized = ip.toLowerCase().replace(/^::ffff:/, '');
    // Block loopback ::1, link-local fe80::/10, and unspecified ::
    return normalized === '::1' || normalized === '::' || normalized.startsWith('fe80');
}

/**
 * Validates a URL string for safe external proxying.
 * @param {string} rawUrl
 * @throws {Error} with a safe message if the URL is blocked
 * @returns {URL} the parsed URL
 */
async function assertSafeUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http and https URLs are permitted.');
    }

    const hostname = parsed.hostname;

    // Block bare IPv4 literals
    if (net.isIPv4(hostname)) {
        if (isBlockedIPv4(hostname)) throw new Error('URL resolves to a blocked IP range.');
        return parsed;
    }

    // Block bare IPv6 literals
    if (net.isIPv6(hostname)) {
        if (isBlockedIPv6(hostname)) throw new Error('URL resolves to a blocked IP range.');
        return parsed;
    }

    // DNS resolution check — prevent DNS rebinding to internal IPs
    try {
        const addrs = await dns.resolve4(hostname).catch(() => []);
        const addrs6 = await dns.resolve6(hostname).catch(() => []);
        for (const ip of addrs) {
            if (isBlockedIPv4(ip)) throw new Error('URL resolves to a blocked IP range.');
        }
        for (const ip of addrs6) {
            if (isBlockedIPv6(ip)) throw new Error('URL resolves to a blocked IP range.');
        }
    } catch (err) {
        if (err.message.includes('blocked')) throw err;
        // DNS resolution failure — allow through (will fail at request time)
    }

    return parsed;
}

module.exports = { assertSafeUrl };
