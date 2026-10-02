// Pickup times are stored as 'HH:MM' text with no date: a listing is for the day it was
// posted. These helpers turn that into real instants. The database applies the same rules
// (supabase/pickup-window.sql, pickup_instant), so keep the two in step.

// Turkey has no daylight saving since 2016, so a fixed +03:00 offset is exact.
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
const CANCEL_CUTOFF_MS = 30 * 60 * 1000;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// The Turkish calendar day the record was created on, plus the given clock time.
export const pickupInstant = (createdAt, hhmm) => {
  if (!createdAt || !HHMM.test(hhmm || '')) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const day = new Date(created + TURKEY_OFFSET_MS).toISOString().slice(0, 10);
  return new Date(`${day}T${hhmm}:00+03:00`).getTime();
};

// A listing with no readable end time never expires rather than vanishing by mistake.
export const isListingExpired = (listing, now = Date.now()) => {
  const end = pickupInstant(listing.createdAt, listing.pickupEndTime);
  return end !== null && now > end;
};

// A buyer may cancel until 30 minutes before the pickup window opens.
export const canCancelReservation = (reservation, now = Date.now()) => {
  const start = pickupInstant(reservation.createdAt, reservation.pickupStartTime);
  return start === null || now <= start - CANCEL_CUTOFF_MS;
};
