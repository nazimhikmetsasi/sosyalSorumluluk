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
