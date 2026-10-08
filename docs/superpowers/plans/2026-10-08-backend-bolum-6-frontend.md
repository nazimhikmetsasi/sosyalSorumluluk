# Bölüm 6: Frontend Bağlantısı, Docker ve README Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma.**

**Hedef:**
- React frontend'i Supabase yerine `.NET API`'ye bağlamak.
- API'yi veritabanıyla birlikte tek `docker compose up` komutuyla ayağa kaldırmak.
- Kurulumu README'de belgelemek.

**Mimari:**
- Yeni `src/lib/api.js` dosyası `fetch` ile istek atar, token'ı yönetir ve oturum değişikliğini dinleyicilere bildirir.
- `src/lib/supabase.js` ve `src/lib/data.js` dosyaları **aynı dışa aktarılan adları ve aynı `{ data, error }` dönüş biçimini** koruyarak yeniden yazılır. Böylece bileşenler değişmez.
- `AppContext.jsx` dosyasında yalnızca `supabase` istemcisine doğrudan dokunan 5 satır değişir.

**Teknoloji:** React 19, Vite, vitest; .NET 9 Docker imajları.

## Global Kısıtlar

- Bölüm 1 planındaki "Global Kısıtlar" bölümü backend için geçerli. Commit yok.
- Frontend komutları **repo kökünde** çalışır: `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk"`.
- Bileşen (`src/components/**`) dosyalarında yalnızca Task 1 Adım 7'deki tek metin değişir.
- `.env` dosyası gizli anahtarlar içerir. **İçeriğini okuma ya da yazdırma.** Yalnızca Adım 8'deki ekleme komutunu çalıştır.

## Başlamadan önce

- [ ] `cd api && dotnet test` → 67 test geçmeli.
- [ ] `npm test` (repo kökünde) → mevcut vitest testleri geçmeli. Kaç test geçtiğini not et.

## Dosya haritası

```
src/lib/api.js              YENİ: fetch istemcisi, token, onAuthChange
src/lib/api.test.js         YENİ: vitest
src/lib/supabase.js         (tamamı değişir, dışa aktarılan adlar aynı)
src/lib/data.js             (tamamı değişir, dışa aktarılan adlar aynı)
src/context/AppContext.jsx  5 satır değişir
src/components/views/AuthView.jsx  1 hata metni değişir
.env.example                API adresi eklenir
vite.config.js              supabase chunk kuralı silinir
package.json                @supabase/supabase-js kaldırılır
README.md                   tek not satırı eklenir
api/Dockerfile              YENİ
api/.dockerignore           YENİ
api/docker-compose.yml      (tamamı değişir: api servisi eklenir)
api/README.md               YENİ
```

---

### Task 1: Frontend'i API'ye bağla

**Dosyalar:** Yukarıdaki listedeki `src/`, `.env.example`, `vite.config.js`, `package.json`, `README.md`.

**Arayüzler:**
- Tüketir: Bölüm 2-5'teki uçlar. Yol ve gövde alanları bu planda birebir yazılı.
- Üretir:
  - `api.js`: `isApiConfigured`, `getToken()`, `setToken(token)`, `onAuthChange(listener) → unsubscribe`, `api(path, { method, body, form }) → { data, error }`
  - `supabase.js`: adlar korunur: `isSupabaseConfigured`, `loadVerifiedAccount`, `saveProfile`, `MAX_AVATAR_BYTES`, `uploadAvatar`, `uploadOrganisationImage`, `sendOtp`, `verifyOtp`, `signOut`. Yeni ad: `onAuthChange` (yeniden dışa aktarım). `supabase` adı **kaldırılır**.
  - `data.js`: tüm eski dışa aktarılan adlar korunur.

- [ ] **Adım 1: Failing test: `src/lib/api.test.js`**

```js
import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from './api';

const respond = (status, body) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the parsed body as data on success', async () => {
    vi.stubGlobal('fetch', respond(200, { id: 1 }));
    expect(await api('/x')).toEqual({ data: { id: 1 }, error: null });
  });

  it('turns a ProblemDetails body into error.message', async () => {
    vi.stubGlobal('fetch', respond(409, { title: 'Conflict', detail: 'Yeterli porsiyon kalmadı.' }));
    expect(await api('/x', { method: 'POST', body: {} }))
      .toEqual({ data: null, error: { message: 'Yeterli porsiyon kalmadı.' } });
  });

  it('treats an empty 204 as success without data', async () => {
    vi.stubGlobal('fetch', respond(204));
    expect(await api('/x')).toEqual({ data: null, error: null });
  });

  it('reports a network failure instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await api('/x')).toEqual({ data: null, error: { message: 'Sunucuya bağlanılamadı.' } });
  });

  it('sends JSON bodies with a content type', async () => {
    const fetch = respond(200, {});
    vi.stubGlobal('fetch', fetch);
    await api('/x', { method: 'PUT', body: { a: 1 } });
    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });
});
```

Çalıştır: `npx vitest run src/lib/api.test.js`
Beklenen: FAIL, `Failed to resolve import "./api"`.

- [ ] **Adım 2: `src/lib/api.js`**

```js
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
  let payload = null;
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
```

Çalıştır: `npx vitest run src/lib/api.test.js`
Beklenen: `5 passed`.

- [ ] **Adım 3: `src/lib/supabase.js` dosyasının tamamını değiştir**

```js
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
```

- [ ] **Adım 4: `src/lib/data.js` dosyasının tamamını değiştir**

```js
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
```

- [ ] **Adım 5: `src/context/AppContext.jsx` dosyasında 5 değişiklik yap**

1. İçe aktarma satırı. Eski:

```js
import { supabase, loadVerifiedAccount, signOut, saveProfile, uploadAvatar, uploadOrganisationImage } from '../lib/supabase';
```

Yeni:

```js
import { isSupabaseConfigured, onAuthChange, loadVerifiedAccount, signOut, saveProfile, uploadAvatar, uploadOrganisationImage } from '../lib/supabase';
```

2. Eski: `useState(Boolean(supabase))`. Yeni: `useState(isSupabaseConfigured)`.

3. Dosyadaki **üç** `!supabase` ifadesinin her birini `!isSupabaseConfigured` yap. Bunlar şu satırlarda:
   - `if (!supabase) return undefined;`
   - `if (!supabase || !account) return;`
   - `if (!supabase || !account) return undefined;`

4. Eski:

```js
    const { data } = supabase.auth.onAuthStateChange(() => sync());
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
```

Yeni:

```js
    const unsubscribe = onAuthChange(() => sync());
    return () => {
      cancelled = true;
      unsubscribe();
    };
```

Kontrol: Aşağıdaki iki komut **hiçbir çıktı vermemeli**:

```bash
grep -nE "[!(]supabase\b" src/context/AppContext.jsx
grep -n "supabase\." src/context/AppContext.jsx
```

- [ ] **Adım 6: `.env.example`**

Dosyadaki Supabase bölümünü sil: ilk satırdan `VITE_SUPABASE_ANON_KEY=` satırı dahil olmak üzere o satıra kadar olan her şey. Yerine şunu yaz (sonraki boş satır ve `VITE_ADMIN_*` bölümü olduğu gibi kalsın):

```
# Address of the .NET API in api/ (docker compose up in api/, or dotnet run on port 5080).
VITE_API_URL=http://localhost:5080
```

- [ ] **Adım 7: `src/components/views/AuthView.jsx` içindeki hata metni**

Eski:

```js
      showToast('Supabase yapılandırılmamış: .env dosyasındaki VITE_SUPABASE_* değerlerini doldurun.', 'error');
```

Yeni:

```js
      showToast('API adresi yapılandırılmamış: .env dosyasına VITE_API_URL ekleyin.', 'error');
```

- [ ] **Adım 8: `.env` dosyasına API adresini ekle (içeriğini okumadan)**

```bash
grep -q '^VITE_API_URL=' .env || printf '\nVITE_API_URL=http://localhost:5080\n' >> .env
```

- [ ] **Adım 9: Supabase bağımlılığını kaldır**

```bash
npm uninstall @supabase/supabase-js
```

`vite.config.js` dosyasında şu satırı sil:

```js
          if (/node_modules[\\/]@supabase[\\/]/.test(id)) return 'supabase';
```

Kontrol: `grep -rn "@supabase" src package.json vite.config.js` komutu hiçbir çıktı vermemeli.

- [ ] **Adım 10: Kök README'ye not ekle**

`README.md` dosyasında `## 📌 Amaç` satırının **hemen üstüne** şunu ekle (altında bir boş satır kalsın):

```markdown
> **Not:** Backend artık Supabase değil, `api/` klasöründeki .NET 9 API. Kurulum ve uç listesi için [api/README.md](api/README.md). Aşağıdaki Supabase bölümleri projenin ilk sürümünü anlatır.

```

- [ ] **Adım 11: Frontend doğrulaması**

```bash
npm run lint
npm test
npm run build
```

Beklenen:
- `lint` sırasında **yeni** dosyalarda hata ya da uyarı çıkmamalı. `.claude/worktrees` altındaki eski uyarılar bu işin kapsamında değil, onları raporla ama düzeltme.
- `npm test` çıktısı, başlangıçta not ettiğin sayının 5 fazlasını (`api.test.js`) göstermeli.
- `build` başarıyla bitmeli.

---

### Task 2: Docker ile tam yığın ve README

**Dosyalar:** `api/Dockerfile`, `api/.dockerignore`, `api/docker-compose.yml`, `api/README.md`

- [ ] **Adım 1: `api/Dockerfile`**

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY src/GidaKoprusu.Api/GidaKoprusu.Api.csproj src/GidaKoprusu.Api/
RUN dotnet restore src/GidaKoprusu.Api/GidaKoprusu.Api.csproj
COPY src/ src/
RUN dotnet publish src/GidaKoprusu.Api/GidaKoprusu.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "GidaKoprusu.Api.dll"]
```

- [ ] **Adım 2: `api/.dockerignore`**

```
**/bin
**/obj
tests
uploads
```

- [ ] **Adım 3: `api/docker-compose.yml` dosyasının tamamını değiştir**

```yaml
# Local development stack: Postgres plus the API. Passwords and the JWT secret here are for
# this machine only; set JWT_SECRET and real SMTP settings anywhere else.
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gidakoprusu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - gk_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d gidakoprusu"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      # Development: OTP codes go to the log and the Bursa demo data is loaded.
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Default: Host=db;Port=5432;Database=gidakoprusu;Username=postgres;Password=postgres
      Jwt__Secret: ${JWT_SECRET:-dev-only-secret-change-me-0123456789abcdef}
      Seed__AdminEmail: ${ADMIN_EMAIL:-admin@gidakoprusu.local}
      Uploads__Root: /app/uploads
    ports:
      - "5080:8080"
    volumes:
      - gk_uploads:/app/uploads

volumes:
  gk_pgdata:
  gk_uploads:
```

- [ ] **Adım 4: Yığını kaldır ve duman testi yap**

Önce 5080 portunda çalışan bir `dotnet run` süreci kalmadığından emin ol. Sonra:

```bash
cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api"
docker compose up -d --build
curl -s --retry 30 --retry-connrefused --retry-delay 2 http://localhost:5080/health
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5080/auth/otp -H "Content-Type: application/json" -d '{"email":"admin@gidakoprusu.local"}'
CODE=$(docker compose logs api | grep -o "OTP for admin@gidakoprusu.local: [0-9]\{8\}" | tail -1 | grep -o "[0-9]\{8\}$")
TOKEN=$(curl -s -X POST http://localhost:5080/auth/verify -H "Content-Type: application/json" -d "{\"email\":\"admin@gidakoprusu.local\",\"code\":\"$CODE\"}" | python -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s http://localhost:5080/me -H "Authorization: Bearer $TOKEN"
echo
curl -s http://localhost:5080/listings | python -c "import sys,json; print(len(json.load(sys.stdin)))"
```

Beklenen:
- `{"status":"ok"}`
- `204`
- `/me` çıktısı `"role":"admin"` içeren bir JSON.
- İlan sayısı `7`. Saat 23:30'dan sonra çalıştırılırsa daha az olabilir.

Container'lar **çalışır durumda kalsın**. Nazım tarayıcıdan deneyecek.

- [ ] **Adım 5: `api/README.md`**

````markdown
# Gıda Köprüsü API

Gıda Köprüsü'nün (sosyalSorumluluk) backend'i: .NET 9 Minimal API + PostgreSQL 16 + EF Core.
Supabase sürümündeki kuralların (RLS, trigger, RPC) hepsi burada C# ve veritabanı
kısıtları olarak yeniden yazıldı. Tasarım: `docs/superpowers/specs/2026-10-08-dotnet-backend-design.md`.

## Çalıştırma

Docker ile (API + veritabanı):

```bash
cd api
docker compose up -d --build
```

API `http://localhost:5080` adresinde açılır. Development modunda:
- giriş kodları e-posta yerine loga yazılır: `docker compose logs api | grep OTP`
- Bursa demo verisi (4 kurum, 7 ilan) her açılışta bugünün tarihiyle yenilenir
- `admin@gidakoprusu.local` yönetici olarak oluşturulur (`ADMIN_EMAIL` ile değiştirilebilir)

Frontend için repo kökündeki `.env` dosyasına `VITE_API_URL=http://localhost:5080` ekleyip
`npm run dev` (http://localhost:3000).

Docker olmadan: `docker compose up -d db` sonra `dotnet run --project src/GidaKoprusu.Api`.

## Ayarlar

| Anahtar | Ortam değişkeni | Açıklama |
|---|---|---|
| `ConnectionStrings:Default` | `ConnectionStrings__Default` | PostgreSQL bağlantısı |
| `Jwt:Secret` | `Jwt__Secret` | En az 32 bayt. Development dışında mutlaka değiştir |
| `Seed:AdminEmail` | `Seed__AdminEmail` | Açılışta yönetici olarak oluşturulan e-posta |
| `Seed:Bursa` | `Seed__Bursa` | `true` ise Bursa demo verisi yüklenir |
| `Smtp:Host` ... `Smtp:From` | `Smtp__Host` ... | Boşsa kodlar loga yazılır |
| `Uploads:Root` | `Uploads__Root` | Yüklenen görsellerin klasörü |
| `Cors:Origins` | `Cors__Origins__0` | Frontend adresi |

## Uçlar

| Uç | Kim |
|---|---|
| `POST /auth/otp`, `POST /auth/verify` | herkes |
| `GET /me`, `PUT /me`, `POST /me/avatar` | giriş yapmış |
| `GET /organisations` | herkes (yönetici bekleyenleri de görür) |
| `POST /organisations`, `PATCH /organisations/{id}/status`, `GET /organisations/{id}/members`, `POST /admin/grants` | yönetici |
| `POST /organisations/{id}/images/{avatar\|cover}` | kurumun kendisi veya yönetici |
| `GET /listings` | herkes |
| `POST /listings`, `PATCH /listings/{id}/portions`, `POST /listings/{id}/archive` | ilanın sahibi işletme |
| `GET /reservations` | alıcı kendi siparişlerini, kurum kendi kuyruğunu |
| `POST /reservations`, `POST /reservations/{id}/cancel` | alıcı / STK |
| `POST /deliveries/complete` | işletme / STK |
| `GET /reviews`, `POST /reviews` | okuma herkese, yazma teslim almış alıcıya |
| `GET /stats/platform`, `GET /stats/leaderboard` | herkes |
| `GET /health` | herkes |

Hatalar ProblemDetails biçiminde döner; `detail` alanı Türkçe kullanıcı mesajıdır.

## Testler

```bash
cd api
dotnet test
```

Testler Testcontainers ile gerçek bir PostgreSQL'e karşı koşar, Docker açık olmalı.
Son porsiyona aynı anda 20 rezervasyon isteği gelen yarış testi de bunların arasında.
````

---

## Bölüm sonu

- [ ] `cd api && dotnet test` → 67 test geçmeli. Repo kökünde `npm test` ve `npm run build` başarılı olmalı.
- [ ] `DURUM.md` içinde 6. satırı `✅ Tamam` yap. "Sıradaki tek iş" bölümüne şunu yaz: `Backend bitti. Nazım tarayıcıda dener, commit atar ve pushlar. Sonra büyük proje seçimi.`
- [ ] Commit mesajı öner: `feat: wire the frontend to the .NET API and add the docker stack`
- [ ] **Mülakat soruları:**
  1. Token'ı `localStorage`'da tutmanın riski ne, alternatifi ne? [XSS ile token çalınabilir. Alternatif: httpOnly + Secure cookie. Ama o zaman CSRF koruması gerekir.]
  2. API 401 döndüğünde ne oluyor, bu neden sonsuz döngüye girmiyor? [Token silinir ve dinleyiciler `sync`'i tetikler. `loadVerifiedAccount` token olmadığı için istek atmaz. Silme işlemi de yalnızca token hâlâ aynıyken yapılır.]
  3. CORS neden gerekli, hangi adrese izin verdik? [Frontend (localhost:3000) ile API (localhost:5080) farklı origin'ler. Tarayıcı izin olmadan cevabı okumaz. Yalnızca frontend adresine izin verildi.]
  4. Docker'da hem `appsettings.Development.json` hem ortam değişkeni bağlantı dizesi veriyorsa hangisi kazanır? [Ortam değişkeni. ASP.NET'te sonradan eklenen kaynak öncekini ezer.]
  5. Supabase RLS ile bizim endpoint yetkilerimiz arasındaki fark ne? Hangisi daha güvenli? [RLS kuralı veritabanında, her sorguya uygulanır. Biz kuralı uygulama katmanında koyuyoruz. Yeni bir uç eklenirken kontrol unutulursa açık oluşur. Bunun bedelini testlerle ve kontrolleri tek yerde toplayarak ödüyoruz.]
