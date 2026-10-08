import { api, getToken } from './api';

// The API already returns the camelCase shapes the components use. Only the purely
// presentational fields are added here.
const withListingDefaults = (row) => ({ ...row, pickupDate: 'Bugün', distanceKm: 0 });
const withReservationDefaults = (row) => ({ ...row, pickupDate: 'Bugün' });

const list = async (path, map = (row) => row) => {
  const { data, error } = await api(path);
  return { data: (data || []).map(map), error };
};

export const fetchOrganisations = () => list('/organisations');

// The server archives listings whose pickup time has passed before answering.
export const fetchListings = () => list('/listings', withListingDefaults);

// Orders need a session; signed out there are simply none, not an error.
export const fetchReservations = () =>
  getToken() ? list('/reservations', withReservationDefaults) : Promise.resolve({ data: [], error: null });

export const fetchLeaderboard = (rowLimit = 10) => list(`/stats/leaderboard?limit=${rowLimit}`);

export const fetchReviews = () => list('/reviews');

export const fetchPlatformStats = () => api('/stats/platform');

// Pure fetch with no side effects, so the caller can decide whether a late response is
// still wanted before it touches any state.
export const fetchAll = async () => {
  const [organisations, listings, reservations, leaderboard, stats, reviews] = await Promise.all([
    fetchOrganisations(),
    fetchListings(),
    fetchReservations(),
    fetchLeaderboard(),
    fetchPlatformStats(),
    fetchReviews(),
  ]);

  return {
    organisations: organisations.data,
    listings: listings.data,
    reservations: reservations.data,
    leaderboard: leaderboard.data,
    stats: stats.data,
    reviews: reviews.data,
    error: organisations.error || listings.error || reservations.error
      || leaderboard.error || stats.error || reviews.error,
  };
};

// The organisation comes from the caller's token on the server, so the first argument is unused.
export const insertListing = async (_organisationId, listing) => {
  const { data, error } = await api('/listings', {
    method: 'POST',
    body: {
      title: listing.title,
      description: listing.description,
      category: listing.category,
      type: listing.type,
      priceOriginal: listing.priceOriginal,
      priceDiscounted: listing.priceDiscounted,
      portions: listing.portions,
      pickupStartTime: listing.pickupStartTime,
      pickupEndTime: listing.pickupEndTime,
      image: listing.image,
      allergens: listing.allergens,
      lat: listing.lat,
      lng: listing.lng,
      weightKg: listing.weightKg,
      co2ReductionKg: listing.co2ReductionKg,
    },
  });
  return { data: data ? withListingDefaults(data) : null, error };
};

export const updateListingPortionCount = (listingId, portionsAvailable) =>
  api(`/listings/${listingId}/portions`, { method: 'PATCH', body: { portionsAvailable } });

export const archiveListing = (listingId) => api(`/listings/${listingId}/archive`, { method: 'POST' });

// Price, owner, title and image are read from the listing on the server, and the pickup code
// and QR token are issued there too, so only the listing and the quantity are sent.
export const insertReservation = async (reservation) => {
  const { data, error } = await api('/reservations', {
    method: 'POST',
    body: { listingId: reservation.listingId, portionCount: reservation.portionCount },
  });
  return { data: data ? withReservationDefaults(data) : null, error };
};

// Completing an order needs the secret from the buyer's QR code; the server checks it belongs
// to the caller's organisation.
export const completeDeliveryWithQr = async (qrToken) => {
  const { data, error } = await api('/deliveries/complete', { method: 'POST', body: { qrToken } });
  return { data: data?.id ?? null, error };
};

// Cancelling is the only status change a client may ask for; completion goes through the QR
// endpoint above.
export const setReservationStatus = (reservationId, status) =>
  status === 'cancelled'
    ? api(`/reservations/${reservationId}/cancel`, { method: 'POST' })
    : Promise.resolve({ data: null, error: { message: 'Bu durum değişikliği desteklenmiyor.' } });

export const setOrganisationStatus = (organisationId, status) =>
  api(`/organisations/${encodeURIComponent(organisationId)}/status`, { method: 'PATCH', body: { status } });

// The server checks the order is the caller's, delivered, and not reviewed yet.
export const insertReview = (review) =>
  api('/reviews', {
    method: 'POST',
    body: {
      reservationId: review.reservationId,
      organisationId: review.organisationId,
      rating: review.rating,
      comment: review.comment || null,
      tags: review.tags,
    },
  });

export const grantOrganisationAccess = (email, organisationId, role) =>
  api('/admin/grants', { method: 'POST', body: { email, organisationId, role } });

export const fetchOrganisationMembers = (organisationId) =>
  api(`/organisations/${encodeURIComponent(organisationId)}/members`);

export const insertOrganisation = (organisation) =>
  api('/organisations', {
    method: 'POST',
    body: {
      id: organisation.id,
      name: organisation.name,
      kind: organisation.kind,
      type: organisation.type,
      avatar: organisation.avatar,
      cover: organisation.cover,
      address: organisation.address,
      phone: organisation.phone,
      lat: organisation.lat,
      lng: organisation.lng,
    },
  });
