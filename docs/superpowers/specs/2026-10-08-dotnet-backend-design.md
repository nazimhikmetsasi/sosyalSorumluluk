# sosyalSorumluluk — .NET Backend Tasarımı

Tarih: 2026-10-08 · Durum: onaylandı · Branch: `backend-dotnet`

## Amaç ve kapsam

Gıda Köprüsü (sosyalSorumluluk) şu an backend olarak Supabase kullanıyor (Postgres + RLS + trigger + RPC + Auth + Storage). Bu çalışma Supabase'in yaptığı her şeyi **sıfırdan bir ASP.NET Core API** ile yeniden yazar ve React frontend'i bu API'ye bağlar.

- Ders projesi. Hedef 2-3 gün, sade kapsam. Bitince bırakılacak, sonradan geliştirilmeyecek.
- Davranış Supabase sürümüyle **aynı** kalır. Yeni özellik yok. Tek istisna: teslim kodu ve QR token'ı artık sunucu üretir.
- **Kapsam dışı:** Redis, mesaj kuyruğu/outbox, SignalR, OpenTelemetry, yük testi, bulut deploy.

## 1. Yer ve teknoloji

- Kod `sosyalSorumluluk/api/` altında, frontend ile aynı repoda durur.
- .NET 9 Minimal API ile iki proje kurulur:
  - `api/src/GidaKoprusu.Api`
  - `api/tests/GidaKoprusu.Api.Tests`
- PostgreSQL 16 (Docker Compose), EF Core + Npgsql, migration'lar.
- Klasörler özelliklere göre ayrılır: `Auth/`, `Profiles/`, `Organisations/`, `Listings/`, `Reservations/`, `Reviews/`, `Stats/`. Her klasörde endpoint eşlemesi bulunur, gerekiyorsa küçük bir servis sınıfı da olur. `Data/` altında `AppDbContext` ve entity'ler durur.
- CORS ayarı frontend'in geliştirme adresine (`http://localhost:3000`) izin verir.
- Yüklenen görseller yerel diske (`uploads/`) yazılır ve statik dosya olarak sunulur. Kurallar:
  - Yalnızca JPG, PNG ve WebP kabul edilir, en fazla 2 MB.
  - Avatarlar `uploads/avatars/<userId>.<ext>` yoluna yazılır.
  - Kurum görselleri `uploads/organisations/<orgId>/<avatar|cover>.<ext>` yoluna yazılır.
  - Dönen URL'nin sonuna `?v=<timestamp>` eklenir (cache-bust).
- Bağımlılıklar şunlarla sınırlı: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.Authentication.JwtBearer`. Testlerde ek olarak `xunit` ve `Testcontainers.PostgreSql`. E-posta için `System.Net.Mail.SmtpClient` kullanılır.
- Kod içi tanımlayıcılar ve yorumlar İngilizce yazılır (mevcut frontend koduyla aynı). Kullanıcıya dönen mesajlar Türkçedir.

## 2. Veri modeli

Supabase'deki sütun adları ve kısıtlar korunur, böylece `supabase/seed-bursa.sql` az değişiklikle taşınabilir.

- **users**: `id uuid`, `email` (unique, küçük harf), `role` (buyer|business|ngo|admin, varsayılan buyer), `organisation_id` (null olabilir, FK), `display_name`, `avatar_url`, `city`, `district`, `phone`, `bio`, `created_at`. Bu tablo Supabase'deki `auth.users` ile `profiles` tablolarının birleşimidir.
- **otp_codes**: `email` (PK), `code_hash` (SHA-256), `expires_at`, `attempts`.
- **organisations**: `id text`, `name`, `kind` (business|ngo), `status` (pending|active|suspended), `type`, `avatar`, `cover`, `address`, `lat`, `lng`, `trust_score` (0–100, varsayılan 50), `total_donated_kg`, `rating`, `review_count`, `phone`, `created_at`.
- **listings**: `id uuid`, `organisation_id`, `title`, `description`, `category`, `type` (free|discounted|bulk), `price_original`, `price_discounted`, `portions_total` (>0), `portions_available` (>=0), `pickup_start_time`, `pickup_end_time` (`HH:mm`), `image`, `allergens text[]`, `lat`, `lng`, `weight_kg`, `co2_reduction_kg`, `status` (active|archived), `created_at`.
- **reservations**: `id uuid`, `user_id`, `listing_id` (null olabilir, ilan silinirse set null), `organisation_id`, `listing_title`, `image`, `portion_count` (>0), `paid_amount`, `status` (confirmed|completed|cancelled), `pickup_start_time`, `pickup_end_time`, `pickup_code`, `qr_token`, `saved_kg`, `co2_kg`, `saved_amount`, `listing_created_at`, `created_at`.
  - Unique: `(organisation_id, pickup_code)` ve `qr_token`.
- **reviews**: `id uuid`, `reservation_id` (unique), `user_id`, `organisation_id`, `author_name`, `rating` (1–5), `comment` (≤500), `tags text[]`, `created_at`.

## 3. Giriş ve yetki

- `POST /auth/otp {email}`:
  - 8 haneli rastgele kod üretilir (`RandomNumberGenerator`) ve hash'i saklanır. Aynı e-posta için yeni kod eskisinin yerine geçer. Frontend (`AuthView.jsx`, `OTP_LENGTH = 8`) 8 hane bekliyor.
  - Kod 10 dakika geçerlidir.
  - `Smtp:Host` ayarı boşsa kod loga yazılır (geliştirme ortamı), doluysa SMTP ile gönderilir.
- `POST /auth/verify {email, code}`:
  - En fazla 5 deneme hakkı vardır. 5. yanlış denemeden ya da süre dolduktan sonra kod geçersiz olur.
  - Doğru kod girilirse kod silinir. Kullanıcı yoksa `buyer` rolüyle oluşturulur.
  - Cevap `{ token, account }` biçimindedir.
- **JWT içeriği:** `sub` (user id), `email`, `role`, `org` (yalnızca business ve ngo rolünde). İmza HS256, secret yapılandırmadan okunur. Token 12 saat geçerlidir.
  - Bilinen sınır: bir rol değişikliği kullanıcı yeniden giriş yapınca etkili olur. Ders projesi için kabul edildi.
- **Yetki:** Her endpoint rolü ve kurumu yalnızca token'dan okur, istemcinin gönderdiği `organisationId` gibi değerlere güvenmez. Kurallar Supabase RLS politikalarının birebir karşılığıdır (bkz. bölüm 4).
- **İlk yönetici:** `Seed:AdminEmail` ayarındaki e-posta için açılışta `admin` rolünde bir kullanıcı oluşturulur (yoksa).

## 4. Endpoint'ler

Her endpoint `src/lib/data.js` ve `src/lib/supabase.js` içindeki bir fonksiyonun karşılığıdır. JSON alanları camelCase'tir ve frontend'in beklediği biçimde döner, yani `toListing` / `toReservation` / `toOrganisation` / `toReview` eşlemeleri sunucuya taşınır.

| Endpoint | Kim | Not |
|---|---|---|
| `GET /me` | giriş yapmış | `loadVerifiedAccount` karşılığı |
| `PUT /me` | giriş yapmış | Yalnızca displayName, city, district, phone, bio değiştirilebilir. Rol ve kurum değiştirilemez. |
| `POST /me/avatar` | giriş yapmış | multipart, `{ publicUrl }` döner |
| `GET /organisations` | herkes | Aktif kurumlar listelenir, yönetici hepsini görür. İsme göre sıralanır. |
| `POST /organisations` | admin | status `active` olarak açılır. Skor, puan ve sayaç alanları kabul edilmez. |
| `PATCH /organisations/{id}/status` | admin | pending, active veya suspended |
| `POST /organisations/{id}/images/{kind}` | o kurumun business/ngo hesabı veya admin | kind avatar ya da cover olabilir |
| `GET /organisations/{id}/members` | admin | `[{ email, role }]` |
| `POST /admin/grants {email, organisationId, role}` | admin | Rol buyer ise kurum bağı kaldırılır. Kullanıcı ya da kurum yoksa 404 döner. |
| `GET /listings` | herkes | Önce süresi dolan ilanlar arşivlenir. Sonra aktif kurumların aktif ilanları ile kendi kurumunun tüm ilanları döner (admin hepsini görür). Yeniden eskiye sıralanır. |
| `POST /listings` | business | `organisation_id` token'dan alınır |
| `PATCH /listings/{id}/portions` | ilanın sahibi olan business | |
| `POST /listings/{id}/archive` | ilanın sahibi olan business | |
| `GET /reservations` | giriş yapmış | Alıcı kendi siparişlerini, kurum kendi kuyruğunu görür |
| `POST /reservations {listingId, portionCount}` | buyer, ngo | bkz. bölüm 5 |
| `POST /reservations/{id}/cancel` | siparişi veren | bkz. bölüm 5 |
| `POST /deliveries/complete {qrToken}` | business, ngo | bkz. bölüm 5 |
| `GET /reviews` | herkes | Son 300 yorum, yeniden eskiye |
| `POST /reviews {reservationId, rating, comment, tags}` | siparişi teslim almış alıcı | Yazar adı sunucuda kullanıcının display_name'inden alınır |
| `GET /stats/platform` | herkes | `platform_stats` ile aynı alanlar |
| `GET /stats/leaderboard?limit=10` | herkes | `leaderboard` ile aynı. Giriş yapılmışsa `isCurrentUser` doldurulur. |

## 5. İş kuralları

- **Rezervasyon (son porsiyon yarışı):** Tek transaction içinde şu adımlar çalışır:
  1. İlan okunur. İlan yoksa 404 döner. İlan arşivliyse veya teslim bitiş saati geçtiyse 409 döner: "Bu ilanın teslim süresi doldu."
  2. Stok tek bir koşullu sorguyla düşürülür: `UPDATE listings SET portions_available = portions_available - @n WHERE id = @id AND status = 'active' AND portions_available >= @n`. Sorgu 0 satır etkilerse 409 döner: "Yeterli porsiyon kalmadı." Kilit görevini bu WHERE koşulu görür.
  3. Rezervasyonun alanları ilandan hesaplanır:
     - `organisation_id`, `listing_title`, `image`, `listing_created_at` ve teslim saatleri ilandan kopyalanır.
     - `paid_amount = price_discounted × n`
     - porsiyon başı kg: `kgPerPortion = weight_kg / max(portions_total, 1)`
     - `saved_kg = round(kgPerPortion × n, 2)`
     - `co2_kg = round(kgPerPortion × n × 2.5, 2)`
     - `saved_amount = max(price_original − price_discounted, 0) × n`
  4. Sunucu teslim kodlarını üretir: `pickup_code` = `GK-` + 6 hane (arayüzün kullandığı biçim), `qr_token` = 24 byte rastgele değerin hex hali (48 karakter). Frontend QR token'ını 60 karaktere kırptığı için daha uzun olamaz. Teslim kodu aynı kurumda çakışırsa yeniden üretilir.
- **İptal:**
  - Yalnızca siparişi veren kullanıcı iptal edebilir ve sipariş `confirmed` durumunda olmalıdır.
  - Teslim saatine 30 dakikadan az kaldıysa 409 döner: "Teslim saatine 30 dakikadan az kaldığı için iptal edilemez." Teslim anı, `created_at` tarihi ile `pickup_start_time` birleştirilip Europe/Istanbul saatiyle hesaplanır.
  - Durum güncellemesi `WHERE status = 'confirmed'` koşuluyla yapılır. Porsiyonlar aynı transaction içinde stoğa geri eklenir.
- **QR ile teslim:**
  - Rol business veya ngo olmalıdır.
  - `qr_token` ile token'daki kurum eşleşmelidir. Eşleşme yoksa 404 döner: "Geçersiz QR kod."
  - Sipariş daha önce teslim edildiyse 409 döner: "Bu teslimat daha önce zaten onaylanmış." Sipariş iptal edildiyse 409 döner: "Bu sipariş artık teslim edilemez."
  - Güncelleme `WHERE status = 'confirmed'` koşuluyla yapılır. Ardından güven skoru aynı transaction içinde yeniden hesaplanır.
- **Yorum:**
  - Sipariş istek yapan kullanıcıya ait olmalı, `completed` durumunda olmalı ve yorumdaki kurum siparişin kurumuyla eşleşmelidir. Aksi halde 403 döner.
  - Aynı siparişe ikinci yorum yazılırsa 409 döner (DB'deki unique kısıt yakalanır).
  - Ardından güven skoru aynı transaction içinde yeniden hesaplanır.
- **Güven skoru** (Supabase'deki `recompute_organisation_trust` ile aynı formül):
  - `trust_score = round(100 × (0.8 × ((Σrating + 12) / (n + 3) / 5) + 0.2 × min(completedCount, 20) / 20))`
  - `rating = n == 0 ? null : round(Σrating / n, 1)`
  - `review_count = n`
  - Bu üç alan hiçbir endpoint'in istek gövdesinde yer almaz.
- **Arşivleme:** `GET /listings` çağrıldığında, teslim bitiş saati geçmiş aktif ilanlar `archived` durumuna çekilir. Bitiş anı `created_at` tarihi ile `pickup_end_time` birleştirilerek Europe/Istanbul saatiyle hesaplanır.
- **İstatistikler:**
  - `platform_stats`: tamamlanan siparişlerden toplam kg ve CO₂ (1 ondalık) ile toplam porsiyon; aktif işletme ve aktif STK sayısı; toplam kullanıcı sayısı; porsiyonu kalmış aktif ilan sayısı.
  - `leaderboard`: tamamlanan siparişler kullanıcıya göre gruplanır. Puan `Σporsiyon × 50`, kg ise `round(Σsaved_kg, 1)` olarak hesaplanır. Sıralama önce puana, sonra kg'a göre (azalan) yapılır.
- **Hatalar:** Hepsi ProblemDetails biçiminde döner. 400 doğrulama, 401 giriş yok, 403 yetki yok, 404 bulunamadı, 409 iş kuralı veya çakışma için kullanılır. `detail` alanı yukarıdaki Türkçe mesajı taşır.

## 6. Test ve çalıştırma

- Testler Testcontainers ile gerçek bir PostgreSQL üzerinde, `WebApplicationFactory` aracılığıyla HTTP seviyesinde çalışır. Docker gerekir.
- Testlerin kapsamı:
  - Son porsiyon yarışı: 1 porsiyonlu bir ilana aynı anda 20 `POST /reservations` isteği gönderilir. Tam olarak 1 istek 201, geri kalan 19 istek 409 döner ve stok 0 olur.
  - İptal: stok geri gelir. 30 dakikadan az kalan siparişte istek 409 döner. Başkasının siparişini iptal etmek 403/404 döner.
  - QR teslim: başka kurumun token'ı 404 döner. İkinci okutma 409 döner. Teslimden sonra güven skoru güncellenir.
  - Yetki: buyer `POST /listings` isteğinde 403 alır. business `POST /reservations` isteğinde 403 alır. Bir kurum başka kurumun siparişlerini göremez. `PUT /me` ile rol değiştirilemez.
  - OTP: 5. yanlış denemeden sonra doğru kod da reddedilir. Süresi dolmuş kod reddedilir. İlk girişte buyer rolüyle hesap açılır.
  - Yorum: teslim alınmamış siparişe yorum 403 döner, ikinci yorum 409 döner.
  - Güven skoru formülü için saf birim testi yazılır.
- `docker compose up` komutu `db` ve `api` servislerini birlikte kaldırır. Development ortamında migration'lar açılışta uygulanır ve Bursa seed verisi yüklenir.
- `api/README.md` dosyası kurulumu, ortam değişkenlerini (`ConnectionStrings__Default`, `Jwt__Secret`, `Smtp__*`, `Seed__AdminEmail`) ve endpoint listesini anlatır.

## 7. Frontend bağlantısı

- `src/lib/data.js` ve `src/lib/supabase.js` içindeki fonksiyonların imzası ve `{ data, error }` dönüş biçimi korunur. Fonksiyonların içi `fetch` ile `VITE_API_URL` adresini çağıracak şekilde değişir.
- Token `localStorage`'da tutulur ve `Authorization: Bearer` başlığıyla gönderilir. Sunucu 401 dönerse oturum kapatılır.
- `isSupabaseConfigured` adı korunur ama artık `VITE_API_URL` tanımlı mı diye bakar. Böylece `AuthView.jsx` dosyası değişmeden çalışır. `@supabase/supabase-js` bağımlılığı kaldırılır.
- `insertReservation` artık yalnızca `listingId` ve `portionCount` gönderir. Teslim kodu ve QR token'ı sunucudan gelen cevaptan okunur.
- Bileşenlerde değişiklik yapılmaz. Supabase istemcisine doğrudan dokunan tek yer `AppContext.jsx:253` satırındaki `supabase.auth.onAuthStateChange` çağrısıdır. Onun yerine `supabase.js` küçük bir `onAuthChange(callback)` fonksiyonu dışa aktarır. Bu fonksiyon giriş, çıkış ve 401 durumlarında çağrılır. `AppContext` içinde değişen tek şey bu satırdır.

## Bölümler

Her bölüm ayrı bir oturumda yapılır. Kullanıcı her bölümün sonunda commit atar, sonra yeni oturuma geçilir. Ayrıntılı adımlar plan dosyasındadır.

| # | Bölüm |
|---|---|
| 0 | Spec + plan |
| 1 | İskelet: solution, Compose (db), DbContext + entity'ler + ilk migration, ProblemDetails, `/health`, test projesi + Testcontainers fixture |
| 2 | Giriş ve profil: OTP, JWT, `/me`, avatar, admin seed + testler |
| 3 | Kurumlar ve ilanlar: CRUD, görseller, grants/members, arşivleme + yetki testleri |
| 4 | Rezervasyon, iptal, QR teslim, güven skoru + yarış testi |
| 5 | Yorumlar, istatistikler, Bursa seed |
| 6 | Frontend bağlantısı, Compose'a api servisi, README |
