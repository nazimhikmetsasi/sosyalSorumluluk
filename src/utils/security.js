/**
 * Security Utility Helpers
 * Input sanitization, XSS prevention, and validation guards
 */

// Basic HTML and script tag stripping to prevent Stored / Reflected XSS
export const sanitizeText = (input, maxLength = 250) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[&<>"'/]/g, (match) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
      };
      return entities[match] || match;
    })
    .slice(0, maxLength)
    .trim();
};

// Safe numerical sanitizer with bounding
export const sanitizeNumber = (val, min = 0, max = 100000, fallback = 0) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

// Role authorization matrix
export const ROLE_PERMISSIONS = {
  admin_dash: ['admin'],
  admin_businesses: ['admin'],
  admin_categories: ['admin'],
  admin_reports: ['admin'],
  business_dash: ['business', 'admin'],
  business_orders: ['business', 'admin'],
  business_stats: ['business', 'admin'],
  business_new_listing: ['business', 'admin'],
  ngo_dash: ['ngo', 'admin'],
  ngo_bulk_requests: ['ngo', 'admin'],
  ngo_distribution: ['ngo', 'admin'],
  ngo_volunteers: ['ngo', 'admin'],
  explore: ['buyer', 'business', 'ngo', 'admin'],
  map: ['buyer', 'business', 'ngo', 'admin'],
  reservations: ['buyer', 'business', 'ngo', 'admin'],
  badges: ['buyer', 'business', 'ngo', 'admin'],
  profile: ['buyer', 'business', 'ngo', 'admin'],
  leaderboard: ['buyer', 'business', 'ngo', 'admin'],
  notifications: ['buyer', 'business', 'ngo', 'admin'],
};

// Check if a role can view a tab
export const isAuthorized = (role, tab) => {
  const allowedRoles = ROLE_PERMISSIONS[tab];
  if (!allowedRoles) return true; // Default allow for unspecified public views
  return allowedRoles.includes(role);
};
