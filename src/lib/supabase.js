import { api, getToken, setToken, onAuthChange, isApiConfigured } from './api';

// The file keeps its old name so the components that import it did not have to change;
// everything now goes to the .NET API in api/.
export { onAuthChange };
export const isSupabaseConfigured = isApiConfigured;

// The stored token is only a claim until the server accepts it. /me checks the signature and
// expiry, and a 401 there clears the token (see api.js), so a hand-edited one just signs out.
export const loadVerifiedAccount = async () => {
  if (!isApiConfigured || !getToken()) return null;
  const { data, error } = await api('/me');
  return error ? null : data;
};

// Presentation fields only. Role and organisation are not sent: the server ignores them anyway.
export const saveProfile = (_userId, fields) =>
  api('/me', {
    method: 'PUT',
    body: {
      displayName: fields.displayName,
      city: fields.city,
      district: fields.district,
      phone: fields.phone,
      bio: fields.bio,
    },
  });

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Same limits the server enforces; checking here just saves the round trip.
const uploadImage = async (path, file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: { message: 'Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.' } };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: { message: 'Görsel 2 MB sınırını aşıyor.' } };
  }
  const form = new FormData();
  form.append('file', file);
  const { data, error } = await api(path, { method: 'POST', form });
  return error ? { error } : { publicUrl: data.publicUrl };
};

export const uploadAvatar = (_userId, file) => uploadImage('/me/avatar', file);

export const uploadOrganisationImage = (organisationId, kind, file) =>
  uploadImage(`/organisations/${encodeURIComponent(organisationId)}/images/${kind}`, file);

// Signup is open; a first sign-in always creates a plain buyer on the server.
export const sendOtp = (email) => api('/auth/otp', { method: 'POST', body: { email } });

export const verifyOtp = async (email, token) => {
  const { data, error } = await api('/auth/verify', { method: 'POST', body: { email, code: token } });
  if (!error) setToken(data.token);
  return { data, error };
};

export const signOut = async () => {
  setToken(null);
  return { error: null };
};
