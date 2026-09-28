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
    .select('display_name, avatar_url, city, district, phone, bio')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email,
    role,
    organisationId,
    displayName: profile?.display_name || data.user.email?.split('@')[0] || '',
    avatarUrl: profile?.avatar_url || null,
    city: profile?.city || '',
    district: profile?.district || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  };
};

// Presentation fields only. Role and organisation are not accepted here by design:
// they live in app_metadata, which this key cannot write even if asked.
export const saveProfile = (userId, fields) =>
  supabase.from('profiles').upsert({
    id: userId,
    display_name: fields.displayName,
    city: fields.city,
    district: fields.district,
    phone: fields.phone,
    bio: fields.bio,
  });

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Uploads into avatars/<uid>/, the only folder the storage policy lets this user write.
export const uploadAvatar = async (userId, file) => {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: { message: 'Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.' } };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: { message: 'Görsel 2 MB sınırını aşıyor.' } };
  }

  const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust: the path is stable across replacements, so browsers would keep the old one.
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: saveError } = await supabase
    .from('profiles')
    .upsert({ id: userId, avatar_url: publicUrl });

  return saveError ? { error: saveError } : { publicUrl };
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
