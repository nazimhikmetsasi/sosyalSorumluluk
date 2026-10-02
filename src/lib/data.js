import { supabase } from './supabase';

// Postgres columns are snake_case and the UI has always spoken camelCase. Mapping in one
// place keeps the components unchanged and the SQL idiomatic.

const toOrganisation = (row) => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  status: row.status,
  type: row.type,
  avatar: row.avatar,
  cover: row.cover,
  address: row.address,
  lat: row.lat,
  lng: row.lng,
  trustScore: row.trust_score,
  totalDonatedKg: Number(row.total_donated_kg),
  rating: row.rating === null ? null : Number(row.rating),
  reviewCount: row.review_count,
  phone: row.phone,
});

const toReview = (row) => ({
  id: row.id,
  reservationId: row.reservation_id,
  organisationId: row.organisation_id,
  author: row.author_name,
  rating: row.rating,
  comment: row.comment || '',
  tags: row.tags || [],
  createdAt: row.created_at,
});

const toListing = (row) => ({
  id: row.id,
  businessId: row.organisation_id,
  businessName: row.organisations?.name || '',
  businessAvatar: row.organisations?.avatar || '',
  title: row.title,
  description: row.description || '',
  category: row.category,
  type: row.type,
  priceOriginal: Number(row.price_original),
  priceDiscounted: Number(row.price_discounted),
  discountPercentage: Number(row.price_original)
    ? Math.round((1 - Number(row.price_discounted) / Number(row.price_original)) * 100)
    : 100,
  portionsTotal: row.portions_total,
  portionsAvailable: row.portions_available,
  pickupStartTime: row.pickup_start_time,
  pickupEndTime: row.pickup_end_time,
  pickupDate: 'Bugün',
  image: row.image,
  allergens: row.allergens || [],
  lat: row.lat,
  lng: row.lng,
  distanceKm: 0, // filled in by the context once a location fix exists
  weightKg: Number(row.weight_kg),
  co2ReductionKg: Number(row.co2_reduction_kg),
  status: row.status,
  createdAt: row.created_at,
});

const toReservation = (row) => ({
  id: row.id,
  userId: row.user_id,
  listingId: row.listing_id,
  listingTitle: row.listing_title,
  businessId: row.organisation_id,
  businessName: row.organisations?.name || '',
  businessAddress: row.organisations?.address || '',
  businessPhone: row.organisations?.phone || '',
  image: row.image,
  portionCount: row.portion_count,
  paidAmount: Number(row.paid_amount),
  status: row.status,
  pickupStartTime: row.pickup_start_time,
  pickupEndTime: row.pickup_end_time,
  pickupDate: 'Bugün',
  pickupCode: row.pickup_code,
  qrToken: row.qr_token,
  createdAt: row.created_at,
  // Snapshotted when the order was placed, so editing the listing later cannot rewrite
  // what someone already rescued.
  savedKg: Number(row.saved_kg || 0),
  co2Kg: Number(row.co2_kg || 0),
  savedAmount: Number(row.saved_amount || 0),
  listingCreatedAt: row.listing_created_at,
});

// Row level security does the filtering, so these queries are deliberately unscoped:
// what comes back is already only what this session is allowed to see.
export const fetchOrganisations = async () => {
  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .order('name');
  return { data: (data || []).map(toOrganisation), error };
};

export const fetchListings = async () => {
  const { data, error } = await supabase
    .from('listings')
    .select('*, organisations(name, avatar)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return { data: (data || []).map(toListing), error };
};

export const fetchReservations = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, organisations(name, address, phone)')
    .order('created_at', { ascending: false });
  return { data: (data || []).map(toReservation), error };
};

export const fetchLeaderboard = async (rowLimit = 10) => {
  const { data, error } = await supabase.rpc('leaderboard', { row_limit: rowLimit });
  return {
    data: (data || []).map(row => ({
      rank: row.rank,
      name: row.name,
      avatar: row.avatar,
      kg: Number(row.kg),
      points: row.points,
      isCurrentUser: row.is_current_user,
    })),
    error,
  };
};

export const fetchReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  return { data: (data || []).map(toReview), error };
};

export const fetchPlatformStats = async () => {
  const { data, error } = await supabase.rpc('platform_stats');
  const row = data?.[0];
  return {
    data: row
      ? {
          totalFoodSavedKg: Number(row.total_food_saved_kg),
          totalCo2SavedKg: Number(row.total_co2_saved_kg),
          totalPortions: Number(row.total_portions),
          activeBusinesses: Number(row.active_businesses),
          activeNgos: Number(row.active_ngos),
          totalUsers: Number(row.total_users),
          todayActiveListings: Number(row.today_active_listings),
        }
      : null,
    error,
  };
};

// Pure fetch with no side effects, so the caller can decide whether a late response is
// still wanted before it touches any state.
export const fetchAll = async () => {
  // Lazy archiving of listings whose pickup time has passed. Awaited first so the reads
  // below do not return them; a failure (function not installed yet) must not block loading.
  await supabase.rpc('archive_expired_listings');

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

export const insertListing = async (organisationId, listing) => {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      organisation_id: organisationId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      type: listing.type,
      price_original: listing.priceOriginal,
      price_discounted: listing.priceDiscounted,
      portions_total: listing.portions,
      portions_available: listing.portions,
      pickup_start_time: listing.pickupStartTime,
      pickup_end_time: listing.pickupEndTime,
      image: listing.image,
      allergens: listing.allergens,
      lat: listing.lat,
      lng: listing.lng,
      weight_kg: listing.weightKg,
      co2_reduction_kg: listing.co2ReductionKg,
    })
    .select('*, organisations(name, avatar)')
    .single();
  return { data: data ? toListing(data) : null, error };
};

export const updateListingPortionCount = (listingId, portionsAvailable) =>
  supabase.from('listings').update({ portions_available: portionsAvailable }).eq('id', listingId);

export const archiveListing = (listingId) =>
  supabase.from('listings').update({ status: 'archived' }).eq('id', listingId);

export const insertReservation = async (reservation) => {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      // organisation_id, paid_amount, listing_title and image are overwritten by the
      // stock trigger from the listing itself, so the client cannot pick its own price
      // or file the order against another business.
      listing_id: reservation.listingId,
      organisation_id: reservation.businessId,
      listing_title: reservation.listingTitle,
      image: reservation.image,
      portion_count: reservation.portionCount,
      pickup_start_time: reservation.pickupStartTime,
      pickup_end_time: reservation.pickupEndTime,
      pickup_code: reservation.pickupCode,
      qr_token: reservation.qrToken,
    })
    .select('*, organisations(name, address, phone)')
    .single();
  return { data: data ? toReservation(data) : null, error };
};

// Completing an order needs the secret from the buyer's QR code; the function checks it
// belongs to the caller's organisation. A plain status UPDATE to `completed` is refused.
export const completeDeliveryWithQr = (qrToken) =>
  supabase.rpc('complete_delivery', { qr: qrToken });

// The status trigger decides whether these are allowed; the client just asks.
export const setReservationStatus = (reservationId, status) =>
  supabase.from('reservations').update({ status }).eq('id', reservationId);

export const setOrganisationStatus = (organisationId, status) =>
  supabase.from('organisations').update({ status }).eq('id', organisationId);

// The database checks the order is the caller's, completed, and not reviewed yet.
export const insertReview = (review) =>
  supabase.from('reviews').insert({
    reservation_id: review.reservationId,
    organisation_id: review.organisationId,
    rating: review.rating,
    comment: review.comment || null,
    tags: review.tags,
  });

// Writes app_metadata, which no client key can touch directly. The function re-checks that
// the caller is an admin before doing anything.
export const grantOrganisationAccess = (email, organisationId, role) =>
  supabase.rpc('grant_organisation_access', {
    target_email: email,
    target_organisation_id: organisationId,
    target_role: role,
  });

// Accounts currently bound to an organisation. Admin-only; the function refuses anyone else.
export const fetchOrganisationMembers = (organisationId) =>
  supabase.rpc('organisation_members', { target_organisation_id: organisationId });

// The admin-only write policy on organisations is what lets this through.
export const insertOrganisation = (organisation) =>
  supabase.from('organisations').insert({
    id: organisation.id,
    name: organisation.name,
    kind: organisation.kind,
    status: 'active',
    type: organisation.type,
    avatar: organisation.avatar,
    cover: organisation.cover,
    address: organisation.address,
    phone: organisation.phone,
    lat: organisation.lat,
    lng: organisation.lng,
  });
