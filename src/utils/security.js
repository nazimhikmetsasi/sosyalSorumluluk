/**
 * Security Utility Helpers
 * Input sanitization, XSS prevention, and validation guards
 */

// Trims stored text to a sane shape. It deliberately does NOT HTML-escape: React
// escapes every interpolated string on render, and this codebase uses no
// dangerouslySetInnerHTML, so escaping here only double-encodes — "Taze & Sıcak"
// reached the screen as "Taze &amp; Sıcak" and Turkish apostrophes were mangled.
// If raw HTML ever gets rendered, escape at that call site, not here.
export const sanitizeText = (input, maxLength = 250) => {
  if (typeof input !== 'string') return '';
  return input
    // eslint-disable-next-line no-control-regex -- matching control characters is the point
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '') // control chars, keeping tab and newline
    .slice(0, maxLength)
    .trim();
};

// Cryptographically random decimal string. Bytes at or above 250 are discarded so the
// remaining 250 values map onto 0-9 evenly; Math.random and a plain modulo both skew.
export const randomDigits = (length) => {
  const digits = [];
  // Fixed chunk: getRandomValues rejects buffers over 65536 bytes, and the loop
  // already refills as many times as it needs.
  const buffer = new Uint8Array(256);
  while (digits.length < length) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte < 250 && digits.length < length) digits.push(byte % 10);
    }
  }
  return digits.join('');
};

// Safe numerical sanitizer with bounding
export const sanitizeNumber = (val, min = 0, max = 100000, fallback = 0) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const EVERY_ROLE = ['buyer', 'business', 'ngo', 'admin'];

// Role authorization matrix. Organisation panels are limited to the role that owns an
// organisation: since those views are scoped by organisationId, an admin would only
// ever see an empty panel there, and moderation lives in the admin tabs instead.
export const ROLE_PERMISSIONS = {
  admin_dash: ['admin'],
  admin_businesses: ['admin'],
  admin_categories: ['admin'],
  admin_reports: ['admin'],
  business_dash: ['business'],
  business_orders: ['business'],
  business_stats: ['business'],
  business_new_listing: ['business'],
  ngo_dash: ['ngo'],
  ngo_bulk_requests: ['ngo'],
  ngo_distribution: ['ngo'],
  ngo_volunteers: ['ngo'],
  explore: EVERY_ROLE,
  map: EVERY_ROLE,
  reservations: EVERY_ROLE,
  badges: EVERY_ROLE,
  profile: EVERY_ROLE,
  leaderboard: EVERY_ROLE,
  notifications: EVERY_ROLE,
};

// Landing tab each role is sent to after login or after a denied navigation
const ROLE_HOME_TAB = {
  buyer: 'explore',
  business: 'business_dash',
  ngo: 'ngo_dash',
  admin: 'admin_dash',
};

export const getHomeTab = (role) => ROLE_HOME_TAB[role] || 'explore';

// Deny by default: a tab that nobody thought to add to the matrix must not become
// silently reachable by every role. Adding a view means adding its entry above.
export const isAuthorized = (role, tab) => (ROLE_PERMISSIONS[tab] || []).includes(role);

// A record belongs to the caller only when the caller is a business acting for a known
// organisation and the record carries that same organisation id. Missing ids never match,
// so an unscoped record cannot be claimed by whoever asks first.
export const ownsRecord = (role, organisationId, record) => {
  if (role !== 'business' || !organisationId) return false;
  return Boolean(record) && record.businessId === organisationId;
};
