// Impact figures and badges, derived from the buyer's own reservations.
//
// These used to be hard-coded constants on the mock user, so every account claimed the
// same 18.5 kg rescued. Everything here is computed from reservations the database
// actually holds, using the per-reservation snapshot taken when the order was placed.

const POINTS_PER_PORTION = 50;

// Each level costs more than the last, so the number keeps meaning something as it grows.
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

export const levelFromPoints = (points) => {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (points >= threshold) level += 1;
  }
  return Math.min(level - 1, LEVEL_THRESHOLDS.length);
};

// Only completed pickups count: a confirmed order is a promise, not an outcome, and a
// cancelled one never saved anything.
export const computeImpact = (reservations = []) => {
  const completed = reservations.filter(r => r.status === 'completed');

  const portionsCount = completed.reduce((sum, r) => sum + r.portionCount, 0);
  const savedKg = completed.reduce((sum, r) => sum + (r.savedKg || 0), 0);
  const co2SavedKg = completed.reduce((sum, r) => sum + (r.co2Kg || 0), 0);
  const moneySavedTl = completed.reduce((sum, r) => sum + (r.savedAmount || 0), 0);
  const points = portionsCount * POINTS_PER_PORTION;

  return {
    portionsCount,
    savedKg: +savedKg.toFixed(1),
    co2SavedKg: +co2SavedKg.toFixed(1),
    moneySavedTl: Math.round(moneySavedTl),
    points,
    level: levelFromPoints(points),
    businessCount: new Set(completed.map(r => r.businessId)).size,
  };
};

const EARLY_BIRD_WINDOW_MS = 10 * 60 * 1000;

const wasEarlyBird = (reservations) =>
  reservations.some(r => {
    if (r.status !== 'completed' || !r.listingCreatedAt || !r.createdAt) return false;
    const gap = new Date(r.createdAt) - new Date(r.listingCreatedAt);
    return gap >= 0 && gap <= EARLY_BIRD_WINDOW_MS;
  });

// Progress is capped at 100 so a bar never overflows, but the underlying totals are not.
const ratio = (value, target) => Math.min(100, Math.round((value / target) * 100));

export const computeBadges = (impact, reservations = []) => [
  {
    id: 'b1',
    name: 'İlk Adım',
    description: 'İlk gıda kurtarma rezervasyonunu tamamla',
    emoji: '🌱',
    color: '#52B788',
    unlocked: impact.portionsCount >= 1,
    progress: ratio(impact.portionsCount, 1),
  },
  {
    id: 'b2',
    name: 'Karbon Avcısı',
    description: '25 kg ve üzeri CO₂ salımını engelle',
    emoji: '🌍',
    color: '#2D6A4F',
    unlocked: impact.co2SavedKg >= 25,
    progress: ratio(impact.co2SavedKg, 25),
  },
  {
    id: 'b3',
    name: 'Sıfır İsraf Şampiyonu',
    description: 'Toplam 50 porsiyon gıda kurtar',
    emoji: '🏆',
    color: '#F59E0B',
    unlocked: impact.portionsCount >= 50,
    progress: ratio(impact.portionsCount, 50),
  },
  {
    id: 'b4',
    name: 'Erken Kuş',
    description: 'İlan yayınlandıktan sonraki ilk 10 dk içinde rezervasyon yap',
    emoji: '⚡',
    color: '#3B82F6',
    unlocked: wasEarlyBird(reservations),
    progress: wasEarlyBird(reservations) ? 100 : 0,
  },
  {
    id: 'b5',
    name: 'Mahalle Kahramanı',
    description: 'En az 5 farklı yerel işletmeden kurtarma yap',
    emoji: '🏪',
    color: '#8B5CF6',
    unlocked: impact.businessCount >= 5,
    progress: ratio(impact.businessCount, 5),
  },
];
