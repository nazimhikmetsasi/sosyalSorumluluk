import { describe, it, expect } from 'vitest';
import { isAuthorized, sanitizeText, sanitizeNumber, randomDigits, getHomeTab, ownsRecord } from './security';

describe('isAuthorized', () => {
  it('lets each role into its own panel', () => {
    expect(isAuthorized('admin', 'admin_dash')).toBe(true);
    expect(isAuthorized('business', 'business_orders')).toBe(true);
    expect(isAuthorized('ngo', 'ngo_dash')).toBe(true);
    expect(isAuthorized('buyer', 'explore')).toBe(true);
  });

  it('keeps roles out of panels that are not theirs', () => {
    expect(isAuthorized('buyer', 'admin_dash')).toBe(false);
    expect(isAuthorized('business', 'admin_dash')).toBe(false);
    expect(isAuthorized('business', 'ngo_dash')).toBe(false);
    expect(isAuthorized('ngo', 'business_stats')).toBe(false);
    expect(isAuthorized('admin', 'business_dash')).toBe(false);
  });

  // The guard used to return true for anything missing from the matrix, which made a
  // newly added tab public until someone remembered to list it.
  it('denies tabs that are not in the matrix', () => {
    expect(isAuthorized('buyer', 'admin_settings')).toBe(false);
    expect(isAuthorized('admin', 'tab_that_does_not_exist')).toBe(false);
    expect(isAuthorized('buyer', '')).toBe(false);
    expect(isAuthorized('buyer', undefined)).toBe(false);
  });

  it('denies unknown roles', () => {
    expect(isAuthorized('hacker', 'admin_dash')).toBe(false);
    expect(isAuthorized(undefined, 'explore')).toBe(false);
    expect(isAuthorized(null, 'explore')).toBe(false);
  });
});

describe('getHomeTab', () => {
  it('routes each role to its own landing tab', () => {
    expect(getHomeTab('admin')).toBe('admin_dash');
    expect(getHomeTab('business')).toBe('business_dash');
    expect(getHomeTab('ngo')).toBe('ngo_dash');
    expect(getHomeTab('buyer')).toBe('explore');
  });

  it('falls back to explore for a missing or unknown role', () => {
    expect(getHomeTab(undefined)).toBe('explore');
    expect(getHomeTab('nonsense')).toBe('explore');
  });

  it('only ever returns a tab the role is allowed to open', () => {
    for (const role of ['buyer', 'business', 'ngo', 'admin']) {
      expect(isAuthorized(role, getHomeTab(role))).toBe(true);
    }
  });
});

describe('ownsRecord', () => {
  const ourOrder = { pickupCode: 'GK-222333', businessId: 'biz_01' };
  const theirOrder = { pickupCode: 'GK-999111', businessId: 'biz_03' };

  it('accepts a record belonging to the acting business', () => {
    expect(ownsRecord('business', 'biz_01', ourOrder)).toBe(true);
  });

  // completeDelivery used to match a code against every reservation in the store, so
  // one business could mark another business's order as handed over.
  it('rejects a record belonging to another business', () => {
    expect(ownsRecord('business', 'biz_01', theirOrder)).toBe(false);
  });

  it('rejects roles that do not operate an organisation', () => {
    expect(ownsRecord('admin', 'biz_01', ourOrder)).toBe(false);
    expect(ownsRecord('buyer', 'biz_01', ourOrder)).toBe(false);
    expect(ownsRecord('ngo', 'biz_01', ourOrder)).toBe(false);
  });

  it('rejects when either side has no organisation id', () => {
    expect(ownsRecord('business', null, ourOrder)).toBe(false);
    expect(ownsRecord('business', undefined, ourOrder)).toBe(false);
    expect(ownsRecord('business', 'biz_01', { pickupCode: 'GK-1' })).toBe(false);
    expect(ownsRecord('business', 'biz_01', undefined)).toBe(false);
  });

  it('does not let a record with no owner be claimed by anyone', () => {
    const orphan = { pickupCode: 'GK-000000', businessId: undefined };
    expect(ownsRecord('business', 'biz_01', orphan)).toBe(false);
    expect(ownsRecord('business', 'biz_03', orphan)).toBe(false);
  });
});

describe('sanitizeText', () => {
  // It used to HTML-escape on top of React's own escaping, mangling Turkish text.
  it('leaves ordinary Turkish text untouched', () => {
    expect(sanitizeText('Taze & Sıcak Ekmek')).toBe('Taze & Sıcak Ekmek');
    expect(sanitizeText("Ayşe'nin Fırını")).toBe("Ayşe'nin Fırını");
    expect(sanitizeText('Kahvaltı/Şarküteri')).toBe('Kahvaltı/Şarküteri');
    expect(sanitizeText('19:00', 10)).toBe('19:00');
  });

  it('truncates without splitting the text into an escape sequence', () => {
    expect(sanitizeText('AAAAAAA&', 10)).toBe('AAAAAAA&');
    expect(sanitizeText('abcdefghijklmno', 5)).toBe('abcde');
  });

  it('strips control characters but keeps tabs and newlines', () => {
    expect(sanitizeText('kotu\u0000bayt\u001Bkacis')).toBe('kotubaytkacis');
    expect(sanitizeText('birinci\nikinci\tucuncu')).toBe('birinci\nikinci\tucuncu');
  });

  it('returns an empty string for non-strings', () => {
    expect(sanitizeText(123)).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText({})).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('clamps to the given bounds', () => {
    expect(sanitizeNumber(5, 0, 10)).toBe(5);
    expect(sanitizeNumber(-4, 0, 10)).toBe(0);
    expect(sanitizeNumber(99, 0, 10)).toBe(10);
  });

  it('falls back when the value is not a number', () => {
    expect(sanitizeNumber('abc', 0, 10, 7)).toBe(7);
    expect(sanitizeNumber(undefined, 0, 10, 3)).toBe(3);
  });
});

describe('randomDigits', () => {
  it('returns the requested number of digits', () => {
    expect(randomDigits(6)).toMatch(/^\d{6}$/);
    expect(randomDigits(16)).toMatch(/^\d{16}$/);
    expect(randomDigits(0)).toBe('');
  });

  // getRandomValues rejects buffers over 65536 bytes; a length-proportional buffer threw.
  it('handles lengths past the getRandomValues buffer limit', () => {
    expect(randomDigits(70000)).toHaveLength(70000);
  });

  // Dropping the byte < 250 rejection makes 0-5 about 2.5% likelier than 6-9. That skew
  // is under two standard deviations on a small sample, so a loose per-digit tolerance
  // misses it entirely; a chi-square over a large sample separates the two cleanly
  // (unbiased lands near 9, the modulo version near 750).
  it('spreads across all ten digits rather than favouring the low ones', () => {
    const counts = new Array(10).fill(0);
    for (const ch of randomDigits(2000000)) counts[Number(ch)] += 1;

    const expected = 2000000 / 10;
    const chiSquare = counts.reduce((acc, observed) => acc + (observed - expected) ** 2 / expected, 0);

    // 9 degrees of freedom: a fair generator exceeds 27.9 about once in 2000 runs.
    expect(chiSquare).toBeLessThan(30);
  });

  it('does not repeat itself across draws', () => {
    const drawn = new Set(Array.from({ length: 500 }, () => randomDigits(6)));
    expect(drawn.size).toBeGreaterThan(490);
  });
});
