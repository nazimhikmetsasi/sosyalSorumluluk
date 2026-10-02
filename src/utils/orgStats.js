// Figures for one organisation's own panels, worked out from its completed orders. kg and
// CO2 are the amounts snapshotted on each order when it was placed, so editing a listing
// later cannot rewrite history.

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Roughly what one tree absorbs in a year; only used to phrase the CO2 figure.
const KG_CO2_PER_TREE_PER_YEAR = 21;

const round1 = (n) => Math.round(n * 10) / 10;

export const treeEquivalent = (co2Kg) => Math.round(co2Kg / KG_CO2_PER_TREE_PER_YEAR);

export const computeOrgStats = (reservations = [], now = new Date(), monthCount = 4) => {
  const completed = reservations.filter(r => r.status === 'completed');

  const total = (list) => ({
    savedKg: round1(list.reduce((sum, r) => sum + (r.savedKg || 0), 0)),
    co2Kg: round1(list.reduce((sum, r) => sum + (r.co2Kg || 0), 0)),
    revenue: Math.round(list.reduce((sum, r) => sum + (r.paidAmount || 0), 0)),
    portions: list.reduce((sum, r) => sum + (r.portionCount || 0), 0),
  });

  // The last `monthCount` calendar months, oldest first, including empty ones so the chart
  // does not silently skip a quiet month.
  const monthly = [];
  for (let back = monthCount - 1; back >= 0; back -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const inMonth = completed.filter(r => {
      const created = new Date(r.createdAt);
      return created >= start && created < end;
    });
    monthly.push({
      month: `${MONTHS[start.getMonth()]}${back === 0 ? ' (Bu ay)' : ''}`,
      ...total(inMonth),
    });
  }

  return { ...total(completed), monthly };
};
