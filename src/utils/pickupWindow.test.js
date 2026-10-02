import { describe, it, expect } from 'vitest';
import { pickupInstant, isListingExpired, canCancelReservation } from './pickupWindow';

// 2026-10-02 10:00 in Turkey is 07:00 UTC.
const created = '2026-10-02T07:00:00Z';
const at = (hhmm) => new Date(`2026-10-02T${hhmm}:00+03:00`).getTime();

describe('pickupInstant', () => {
  it('reads the clock time on the Turkish day the record was created', () => {
    expect(pickupInstant(created, '21:00')).toBe(at('21:00'));
  });

  it('uses the Turkish day, not the UTC day, near midnight', () => {
    // 23:30 UTC on the 1st is already 02:30 on the 2nd in Turkey.
    expect(pickupInstant('2026-10-01T23:30:00Z', '21:00')).toBe(at('21:00'));
  });

  it('returns null for missing or malformed times', () => {
    expect(pickupInstant(created, null)).toBeNull();
    expect(pickupInstant(created, '25:00')).toBeNull();
    expect(pickupInstant(null, '21:00')).toBeNull();
  });
});

describe('isListingExpired', () => {
  const listing = { createdAt: created, pickupEndTime: '21:00' };

  it('is live until the end time, expired after', () => {
    expect(isListingExpired(listing, at('20:59'))).toBe(false);
    expect(isListingExpired(listing, at('21:01'))).toBe(true);
  });

  it('expires the next day regardless of clock time', () => {
    expect(isListingExpired(listing, at('08:00') + 24 * 60 * 60 * 1000)).toBe(true);
  });

  it('never expires when the end time is unreadable', () => {
    expect(isListingExpired({ createdAt: created, pickupEndTime: null }, at('23:59'))).toBe(false);
  });
});

describe('canCancelReservation', () => {
  const reservation = { createdAt: created, pickupStartTime: '19:00' };

  it('allows cancelling up to 30 minutes before pickup starts', () => {
    expect(canCancelReservation(reservation, at('18:30'))).toBe(true);
    expect(canCancelReservation(reservation, at('18:31'))).toBe(false);
  });

  it('allows cancelling when the start time is unknown', () => {
    expect(canCancelReservation({ createdAt: created, pickupStartTime: null }, at('23:00'))).toBe(true);
  });
});
