import { describe, it, expect } from 'vitest';
import { computeImpact, computeBadges, levelFromPoints } from './impact';

const reservation = (overrides = {}) => ({
  status: 'completed',
  portionCount: 1,
  savedKg: 0,
  co2Kg: 0,
  savedAmount: 0,
  businessId: 'biz_01',
  ...overrides,
});

describe('computeImpact', () => {
  it('is all zeroes for an account that has rescued nothing', () => {
    expect(computeImpact([])).toMatchObject({
      portionsCount: 0,
      savedKg: 0,
      co2SavedKg: 0,
      moneySavedTl: 0,
      points: 0,
      businessCount: 0,
    });
  });

  // A confirmed order is a promise and a cancelled one never happened; counting either
  // would let someone inflate their impact by reserving and walking away.
  it('counts only completed pickups', () => {
    const impact = computeImpact([
      reservation({ status: 'cancelled', savedKg: 10, portionCount: 5 }),
      reservation({ status: 'confirmed', savedKg: 10, portionCount: 5 }),
    ]);
    expect(impact.portionsCount).toBe(0);
    expect(impact.savedKg).toBe(0);
  });

  it('sums the snapshotted figures across orders', () => {
    const impact = computeImpact([
      reservation({ savedKg: 1.5, co2Kg: 3.75, savedAmount: 95, portionCount: 1, businessId: 'biz_01' }),
      reservation({ savedKg: 2.0, co2Kg: 5.0, savedAmount: 60, portionCount: 2, businessId: 'biz_02' }),
      reservation({ savedKg: 0.5, co2Kg: 1.25, savedAmount: 20, portionCount: 1, businessId: 'biz_01' }),
      reservation({ status: 'cancelled', savedKg: 99, portionCount: 9 }),
    ]);

    expect(impact).toMatchObject({
      portionsCount: 4,
      savedKg: 4,
      co2SavedKg: 10,
      moneySavedTl: 175,
      points: 200,
      businessCount: 2,
    });
  });

  it('tolerates rows written before the impact columns existed', () => {
    const impact = computeImpact([{ status: 'completed', portionCount: 2, businessId: 'biz_01' }]);
    expect(impact.savedKg).toBe(0);
    expect(impact.portionsCount).toBe(2);
  });
});

describe('levelFromPoints', () => {
  it('climbs on the documented thresholds', () => {
    expect(levelFromPoints(0)).toBe(1);
    expect(levelFromPoints(199)).toBe(1);
    expect(levelFromPoints(200)).toBe(2);
    expect(levelFromPoints(499)).toBe(2);
    expect(levelFromPoints(500)).toBe(3);
  });

  it('stops at the top level instead of growing forever', () => {
    expect(levelFromPoints(15000)).toBe(10);
    expect(levelFromPoints(10_000_000)).toBe(10);
  });
});

describe('computeBadges', () => {
  it('leaves every badge locked for a new account', () => {
    expect(computeBadges(computeImpact([]), []).every(b => !b.unlocked)).toBe(true);
  });

  it('unlocks the early bird only inside the ten minute window', () => {
    const now = Date.now();
    const within = [reservation({
      listingCreatedAt: new Date(now - 5 * 60_000).toISOString(),
      createdAt: new Date(now).toISOString(),
    })];
    const outside = [reservation({
      listingCreatedAt: new Date(now - 60 * 60_000).toISOString(),
      createdAt: new Date(now).toISOString(),
    })];

    const earlyBird = (rows) => computeBadges(computeImpact(rows), rows).find(b => b.id === 'b4').unlocked;
    expect(earlyBird(within)).toBe(true);
    expect(earlyBird(outside)).toBe(false);
  });

  // A progress bar rendered with width: `${progress}%` breaks its container past 100.
  it('never reports progress above 100', () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      reservation({ portionCount: 1, co2Kg: 10, businessId: `biz_${i}` })
    );
    for (const badge of computeBadges(computeImpact(many), many)) {
      expect(badge.progress).toBeLessThanOrEqual(100);
      expect(badge.progress).toBeGreaterThanOrEqual(0);
    }
  });
});
