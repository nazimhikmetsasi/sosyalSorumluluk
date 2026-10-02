// Notifications derived from the account's own reservations.
//
// There is no notification table and no push delivery, so inventing one would mean storing
// rows nobody writes. The events a user actually cares about — an order placed, handed over
// or cancelled — are already recorded on the reservation, so the feed is read from there.
// Read state lives in browser storage because it is a per-device convenience, not data
// anyone else needs.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const relativeTime = (iso, now = Date.now()) => {
  const elapsed = now - new Date(iso).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Az önce';
  if (elapsed < MINUTE) return 'Az önce';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} dk önce`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} saat önce`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

const forStatus = (reservation) => {
  switch (reservation.status) {
    case 'completed':
      return {
        title: 'Teslimat Tamamlandı',
        message: `${reservation.listingTitle} teslim alındı. ${reservation.savedKg || 0} kg gıda kurtardın!`,
        type: 'order',
      };
    case 'cancelled':
      return {
        title: 'Rezervasyon İptal Edildi',
        message: `${reservation.listingTitle} rezervasyonun iptal edildi, paket tekrar yayına alındı.`,
        type: 'system',
      };
    default:
      return {
        title: 'Rezervasyon Onaylandı',
        message: `${reservation.listingTitle} seni bekliyor. Teslimat kodun: ${reservation.pickupCode}`,
        type: 'order',
      };
  }
};

export const buildNotifications = (reservations = [], readIds = [], now = Date.now()) => {
  const read = new Set(readIds);

  return reservations
    .map(reservation => {
      const { title, message, type } = forStatus(reservation);
      // Stable id keyed on status, so a status change surfaces as a new unread entry
      // rather than silently reusing the one the user already dismissed.
      const id = `${reservation.id}:${reservation.status}`;

      return {
        id,
        title,
        message,
        type,
        time: relativeTime(reservation.createdAt, now),
        timestamp: new Date(reservation.createdAt).getTime(),
        read: read.has(id),
        businessName: reservation.businessName,
        image: reservation.image,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
};
