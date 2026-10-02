import { describe, it, expect } from 'vitest';
import { computeOrgStats, treeEquivalent } from './orgStats';

const now = new Date(2026, 9, 15); // 15 Oct 2026
const order = (status, createdAt, extra = {}) => ({
  status, createdAt, savedKg: 2, co2Kg: 5, paidAmount: 40, portionCount: 2, ...extra,
});

describe('computeOrgStats', () => {
  it('is all zeroes with no orders', () => {
    const stats = computeOrgStats([], now);
    expect(stats).toMatchObject({ savedKg: 0, co2Kg: 0, revenue: 0, portions: 0 });
    expect(stats.monthly).toHaveLength(4);
  });

  it('counts only completed orders', () => {
    const stats = computeOrgStats([
      order('completed', '2026-10-02T09:00:00Z'),
      order('confirmed', '2026-10-03T09:00:00Z'),
      order('cancelled', '2026-10-04T09:00:00Z'),
    ], now);
    expect(stats.savedKg).toBe(2);
    expect(stats.revenue).toBe(40);
    expect(stats.portions).toBe(2);
  });

  it('puts each order in its month, oldest first, keeping empty months', () => {
    const stats = computeOrgStats([
      order('completed', '2026-10-02T09:00:00Z'),
      order('completed', '2026-08-20T09:00:00Z', { savedKg: 3 }),
    ], now);
    expect(stats.monthly.map(m => m.savedKg)).toEqual([0, 3, 0, 2]);
    expect(stats.monthly[3].month).toBe('Ekim (Bu ay)');
    expect(stats.monthly[1].month).toBe('Ağustos');
  });

  it('tolerates orders written before the impact columns existed', () => {
    const stats = computeOrgStats([{ status: 'completed', createdAt: '2026-10-02T09:00:00Z' }], now);
    expect(stats.savedKg).toBe(0);
  });
});

describe('treeEquivalent', () => {
  it('rounds CO2 to whole trees', () => {
    expect(treeEquivalent(0)).toBe(0);
    expect(treeEquivalent(210)).toBe(10);
  });
});
