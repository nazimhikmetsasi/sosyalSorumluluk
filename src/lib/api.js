// Thin client for the .NET API in api/. Every call resolves to { data, error } the way
// supabase-js did, so data.js, supabase.js and their callers kept the same shape.

const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'GK_TOKEN';
const listeners = new Set();

export const isApiConfigured = Boolean(baseUrl);

// Storage can throw (private mode, blocked site data); no token simply means signed out.
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // The session then lasts only for this page load.
  }
  listeners.forEach(listener => listener());
};

// Fires on sign-in, sign-out and when the server rejects the stored token.
export const onAuthChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const api = async (path, { method = 'GET', body, form } = {}) => {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    return { data: null, error: { message: 'Sunucuya bağlanılamadı.' } };
  }

  // Expired or forged token: drop it once (parallel requests all see the same 401) so the
  // app falls back to signed out.
  if (response.status === 401 && token && getToken() === token) setToken(null);

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      data: null,
      error: { message: payload?.detail || payload?.title || `İstek başarısız (${response.status}).` },
    };
  }
  return { data: payload, error: null };
};
