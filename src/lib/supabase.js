import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The anon key is meant to be public; it grants nothing on its own because every table
// is behind row level security. The service_role key must never appear in this bundle.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

const VALID_ROLES = ['buyer', 'business', 'ngo', 'admin'];

// Reads identity from a server-verified user. getUser() calls the auth server, which
// checks the JWT signature; getSession() would just hand back whatever the browser has
// stored, which is exactly the tampering path this replaces.
export const loadVerifiedAccount = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const appMetadata = data.user.app_metadata || {};
  const role = VALID_ROLES.includes(appMetadata.role) ? appMetadata.role : 'buyer';

  // An organisation only counts for the roles that operate one, so a stale grant left on
  // a demoted account cannot keep acting as that business.
  const organisationId =
    role === 'business' || role === 'ngo' ? appMetadata.organisation_id || null : null;

  // Presentational only, and behind RLS that limits the row to its owner. A failure here
  // must not block sign-in, so the name simply falls back to the address.
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email,
    role,
    organisationId,
    displayName: profile?.display_name || data.user.email?.split('@')[0] || '',
    avatarUrl: profile?.avatar_url || null,
  };
};

export const sendOtp = (email) =>
  supabase.auth.signInWithOtp({
    email,
    // Signup is open; an account created this way is always a plain buyer. Privilege is
    // granted afterwards by an admin, never chosen at the login screen.
    options: { shouldCreateUser: true },
  });

export const verifyOtp = (email, token) =>
  supabase.auth.verifyOtp({ email, token, type: 'email' });

export const signOut = () => supabase.auth.signOut();
