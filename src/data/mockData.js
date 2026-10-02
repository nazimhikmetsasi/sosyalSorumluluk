// The shape of a signed-out profile. Everything real now comes from Supabase: identity
// from the session, listings, organisations and reservations from their tables, and the
// impact figures from src/utils/impact.js. The seeded organisations and listings that used
// to live here were moved into supabase/seed-data.sql.
//
// The counters are zero on purpose. They are placeholders until a session loads, and a
// number invented here would be rendered as though it were someone's real impact.
export const INITIAL_USER = {
  id: null,
  name: '',
  email: '',
  phone: '',
  role: 'buyer',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gidakoprusu',
  city: '',
  district: '',
  savedKg: 0,
  co2SavedKg: 0,
  moneySavedTl: 0,
  portionsCount: 0,
  points: 0,
  level: 1,
};
