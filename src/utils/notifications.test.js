import { describe, it, expect } from 'vitest';
import { buildNotifications, relativeTime } from './notifications';

const NOW = new Date('2026-10-02T12:00:00Z').getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

const reservation = (overrides = {}) => ({
  id: 'res_1',
  status: 'confirmed',
  listingTitle: 'Ekmek Paketi',
  pickupCode: 'GK-123456',
  businessName: 'Moda Fırını',
  createdAt: ago(5 * 60_000),
  savedKg: 1.5,
  ...overrides,
});

describe('relativeTime', () => {
  it('describes each bucket in Turkish', () => {
    expect(relativeTime(ago(30_000), NOW)).toBe('Az önce');
    expect(relativeTime(ago(5 * 60_000), NOW)).toBe('5 dk önce');
    expect(relativeTime(ago(3 * 3600_000), NOW)).toBe('3 saat önce');
    expect(relativeTime(ago(2 * 86400_000), NOW)).toBe('2 gün önce');
  });

  // Clock skew between the device and the server can put a timestamp slightly ahead.
  it('does not produce negative ages', () => {
    expect(relativeTime(new Date(NOW + 60_000).toISOString(), NOW)).toBe('Az önce');
  });
});

describe('buildNotifications', () => {
  it('is empty when nothing has been reserved', () => {
    expect(buildNotifications([], [], NOW)).toEqual([]);
  });

  it('describes each reservation state differently', () => {
    const feed = buildNotifications(
      [
        reservation({ id: 'a', status: 'confirmed' }),
        reservation({ id: 'b', status: 'completed' }),
        reservation({ id: 'c', status: 'cancelled' }),
      ],
      [],
      NOW
    );

    expect(feed.map(n => n.title)).toEqual(
      expect.arrayContaining([
        'Rezervasyon Onaylandı',
        'Teslimat Tamamlandı',
        'Rezervasyon İptal Edildi',
      ])
    );
  });

  it('shows the pickup code while an order is still waiting', () => {
    const [notification] = buildNotifications([reservation({ status: 'confirmed' })], [], NOW);
    expect(notification.message).toContain('GK-123456');
  });

  it('puts the newest first', () => {
    const feed = buildNotifications(
      [
        reservation({ id: 'old', createdAt: ago(5 * 86400_000) }),
        reservation({ id: 'new', createdAt: ago(60_000) }),
      ],
      [],
      NOW
    );
    expect(feed[0].id).toBe('new:confirmed');
  });

  it('marks entries the user has already seen', () => {
    const feed = buildNotifications([reservation({ id: 'a' })], ['a:confirmed'], NOW);
    expect(feed[0].read).toBe(true);
  });

  // The id carries the status, so a handover surfaces as a fresh unread entry rather than
  // reusing the read flag from when it was merely confirmed.
  it('treats a status change as a new unread entry', () => {
    const read = ['a:confirmed'];
    const [confirmed] = buildNotifications([reservation({ id: 'a', status: 'confirmed' })], read, NOW);
    const [completed] = buildNotifications([reservation({ id: 'a', status: 'completed' })], read, NOW);

    expect(confirmed.read).toBe(true);
    expect(completed.read).toBe(false);
  });
});
