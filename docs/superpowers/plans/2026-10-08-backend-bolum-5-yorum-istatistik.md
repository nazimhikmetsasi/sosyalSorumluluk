# Bölüm 5: Yorumlar, İstatistikler ve Bursa Seed Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma.**

**Hedef:**
- Yorum yazma ve listeleme. Yorumdan sonra güven skoru yeniden hesaplanır.
- Platform istatistikleri ve liderlik tablosu.
- Geliştirme ortamında Bursa demo verisinin otomatik yüklenmesi.

**Mimari:**
- `Reviews/` ve `Stats/` klasörlerinde birer endpoint dosyası.
- `Seed/BursaSeeder.cs`, `supabase/seed-bursa.sql` dosyasından türetilen SQL'i ham ADO komutuyla çalıştırır. Şemadaki tablo ve sütun adları aynı olduğu için SQL neredeyse değişmeden çalışır.

**Teknoloji:** EF Core GroupBy/Sum, Npgsql ham komut.

## Global Kısıtlar

Bölüm 1 planındaki "Global Kısıtlar" bölümü aynen geçerli: `net9.0`, paket ekleme yok, komutlar `api/` içinde çalışır, mesajlar birebir Türkçe, saat `TimeProvider`'dan alınır, commit yok.

## Başlamadan önce

- [ ] `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api" && dotnet test` → 60 test geçmeli.

## Dosya haritası

```
src/GidaKoprusu.Api/
  Reviews/ReviewEndpoints.cs       ReviewDto, CreateReviewRequest, GET/POST /reviews
  Stats/StatsEndpoints.cs          PlatformStatsDto, LeaderboardRowDto, GET /stats/*
  Seed/seed-bursa.sql              supabase/seed-bursa.sql'den kopya (son satırı çıkarılmış)
  Seed/BursaSeeder.cs
  GidaKoprusu.Api.csproj           (SQL dosyası çıktıya kopyalanır)
  Program.cs                       (iki Map çağrısı + seed)
  appsettings.Development.json     (Seed:Bursa = true)
tests/GidaKoprusu.Api.Tests/
  TestData.cs                      (CompletedOrderAsync + CompletedOrder kaydı eklenir)
  ReviewTests.cs
  StatsTests.cs
  BursaSeederTests.cs
```

---

### Task 1: Yorumlar (TDD)

**Dosyalar:**
- Oluştur: `Reviews/ReviewEndpoints.cs`, `tests/.../ReviewTests.cs`
- Değiştir: `tests/.../TestData.cs`, `Program.cs`

**Arayüzler:**
- Tüketir:
  - `TrustScore.RecomputeAsync`, `TrustScore.Compute` (Bölüm 4)
  - `DbErrors.IsUniqueViolation`
  - `TestData.ReserveAsync`, `TestAuth.SignInAsync`
- Üretir:
  - `ReviewDto.From(Review)`
  - `MapReviewEndpoints()`
  - Test yardımcısı: `TestData.CompletedOrderAsync(this ApiFactory, int portions = 1, decimal weightKg = 2, string? buyerName = null) : Task<CompletedOrder>`
  - `CompletedOrder(HttpClient Buyer, User BuyerUser, HttpClient Business, Organisation Organisation, Guid ReservationId)`

- [ ] **Adım 1: `TestData.cs` dosyasına yardımcı ekle**

`TestData` sınıfının içine, `ReserveAsync` metodundan sonra:

```csharp
    // A buyer's order that the organisation has already scanned as delivered.
    public static async Task<CompletedOrder> CompletedOrderAsync(
        this ApiFactory factory, int portions = 1, decimal weightKg = 2m, string? buyerName = null)
    {
        var organisation = await factory.CreateOrganisationAsync();
        var listing = await factory.CreateListingAsync(organisation.Id, portions: portions, weightKg: weightKg);
        var (buyer, buyerUser) = await factory.SignInAsync(displayName: buyerName);
        var reserved = await buyer.ReserveAsync(listing.Id, portions);
        reserved.EnsureSuccessStatusCode();
        var order = await reserved.Content.ReadFromJsonAsync<JsonElement>();

        var (business, _) = await factory.SignInAsync(Roles.Business, organisation.Id);
        var delivered = await business.PostAsJsonAsync("/deliveries/complete", new { qrToken = order.GetProperty("qrToken").GetString() });
        delivered.EnsureSuccessStatusCode();

        return new CompletedOrder(buyer, buyerUser, business, organisation, order.GetProperty("id").GetGuid());
    }
```

`TestData` sınıfının **dışına**, dosyanın sonuna:

```csharp
public record CompletedOrder(HttpClient Buyer, User BuyerUser, HttpClient Business, Organisation Organisation, Guid ReservationId);
```

Dosyanın en üstündeki `using` satırlarına (zaten yoksa) şunu ekle:

```csharp
using System.Text.Json;
```

- [ ] **Adım 2: Failing test: `tests/GidaKoprusu.Api.Tests/ReviewTests.cs`**

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ReviewTests
{
    private readonly ApiFactory _factory;

    public ReviewTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static object Review(CompletedOrder order, int rating = 5) => new
    {
        reservationId = order.ReservationId,
        organisationId = order.Organisation.Id,
        rating,
        comment = "Çok taze geldi",
        tags = new[] { "Taze" },
    };

    [Fact]
    public async Task A_review_after_delivery_updates_the_organisation_score()
    {
        var order = await _factory.CompletedOrderAsync(buyerName: "Ayşe K.");

        var response = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 5));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var review = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ayşe K.", review.GetProperty("author").GetString());
        Assert.Equal("Çok taze geldi", review.GetProperty("comment").GetString());
        Assert.Equal("Taze", review.GetProperty("tags")[0].GetString());

        var organisation = await _factory.DbAsync(db => db.Organisations.SingleAsync(o => o.Id == order.Organisation.Id));
        Assert.Equal(TrustScore.Compute(1, 5, 1), organisation.TrustScore);
        Assert.Equal(5.0m, organisation.Rating);
        Assert.Equal(1, organisation.ReviewCount);

        var all = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/reviews");
        Assert.Contains(all.EnumerateArray(), r => r.GetProperty("id").GetString() == review.GetProperty("id").GetString());
    }

    [Fact]
    public async Task A_second_review_for_the_same_order_conflicts()
    {
        var order = await _factory.CompletedOrderAsync();
        await order.Buyer.PostAsJsonAsync("/reviews", Review(order));

        var second = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 1));

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal("Bu siparişe zaten yorum yazdınız.", await second.DetailAsync());
    }

    [Fact]
    public async Task Only_the_buyer_of_a_delivered_order_may_review()
    {
        var order = await _factory.CompletedOrderAsync();
        var (stranger, _) = await _factory.SignInAsync();
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var pending = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        var byStranger = await stranger.PostAsJsonAsync("/reviews", Review(order));
        var beforeDelivery = await buyer.PostAsJsonAsync("/reviews",
            new { reservationId = pending.GetProperty("id").GetGuid(), organisationId = organisation.Id, rating = 4 });

        const string message = "Yalnızca teslim aldığınız siparişe yorum yazabilirsiniz.";
        Assert.Equal(HttpStatusCode.Forbidden, byStranger.StatusCode);
        Assert.Equal(message, await byStranger.DetailAsync());
        Assert.Equal(HttpStatusCode.Forbidden, beforeDelivery.StatusCode);
        Assert.Equal(message, await beforeDelivery.DetailAsync());
    }

    [Fact]
    public async Task Rating_must_be_between_one_and_five()
    {
        var order = await _factory.CompletedOrderAsync();

        var response = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 6));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Puan 1 ile 5 arasında olmalı.", await response.DetailAsync());
    }
}
```

- [ ] **Adım 3: Başarısız olduğunu doğrula**

Çalıştır: `dotnet test --filter "FullyQualifiedName~ReviewTests"`
Beklenen: FAIL, çünkü `/reviews` 404 döner.

- [ ] **Adım 4: `Reviews/ReviewEndpoints.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Reviews;

// Same field names as toReview() in src/lib/data.js.
public record ReviewDto(Guid Id, Guid ReservationId, string OrganisationId, string Author, int Rating,
    string Comment, List<string> Tags, DateTime CreatedAt)
{
    public static ReviewDto From(Review r) =>
        new(r.Id, r.ReservationId, r.OrganisationId, r.AuthorName, r.Rating, r.Comment ?? "", r.Tags, r.CreatedAt);
}

// The author name is not accepted: it is taken from the reviewer's profile on the server.
public record CreateReviewRequest(Guid ReservationId, string? OrganisationId, int Rating, string? Comment, List<string>? Tags);

public static class ReviewEndpoints
{
    public const string DefaultAuthor = "Gıda Kurtarıcısı";

    public static void MapReviewEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/reviews", async (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await db.Reviews.OrderByDescending(r => r.CreatedAt).Take(300).ToListAsync(ct);
            return rows.Select(ReviewDto.From);
        });

        app.MapPost("/reviews", async (CreateReviewRequest body, ClaimsPrincipal principal, AppDbContext db,
            TimeProvider clock, CancellationToken ct) =>
        {
            if (body.Rating is < 1 or > 5)
                throw AppException.BadRequest("Puan 1 ile 5 arasında olmalı.");
            if (body.Comment is { Length: > 500 })
                throw AppException.BadRequest("Yorum en fazla 500 karakter olabilir.");

            // Only someone who actually picked the food up may review, and only that organisation.
            var userId = principal.UserId();
            var reservation = await db.Reservations.AsNoTracking().FirstOrDefaultAsync(r => r.Id == body.ReservationId, ct);
            if (reservation is null
                || reservation.UserId != userId
                || reservation.Status != ReservationStatuses.Completed
                || reservation.OrganisationId != body.OrganisationId)
                throw AppException.Forbidden("Yalnızca teslim aldığınız siparişe yorum yazabilirsiniz.");
            if (await db.Reviews.AnyAsync(r => r.ReservationId == reservation.Id, ct))
                throw AppException.Conflict("Bu siparişe zaten yorum yazdınız.");

            var author = await db.Users.Where(u => u.Id == userId).Select(u => u.DisplayName).SingleOrDefaultAsync(ct);
            var review = new Review
            {
                ReservationId = reservation.Id,
                UserId = userId,
                OrganisationId = reservation.OrganisationId,
                AuthorName = string.IsNullOrWhiteSpace(author) ? DefaultAuthor : author,
                Rating = body.Rating,
                Comment = string.IsNullOrWhiteSpace(body.Comment) ? null : body.Comment.Trim(),
                Tags = body.Tags ?? [],
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };

            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            db.Reviews.Add(review);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (DbErrors.IsUniqueViolation(ex))
            {
                // Two submissions at once: the unique index on reservation_id lets only one in.
                throw AppException.Conflict("Bu siparişe zaten yorum yazdınız.");
            }
            await TrustScore.RecomputeAsync(db, reservation.OrganisationId, ct);
            await transaction.CommitAsync(ct);

            return Results.Created($"/reviews/{review.Id}", ReviewDto.From(review));
        }).RequireAuthorization();
    }
}
```

- [ ] **Adım 5: `Program.cs` dosyasına bağla**

`using GidaKoprusu.Api.Reservations;` satırının altına:

```csharp
using GidaKoprusu.Api.Reviews;
```

`app.MapReservationEndpoints();` satırının altına:

```csharp
app.MapReviewEndpoints();
```

- [ ] **Adım 6: Testleri koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~ReviewTests"`
Beklenen: `Passed: 4`.

---

### Task 2: İstatistikler ve liderlik tablosu (TDD)

**Dosyalar:**
- Oluştur: `Stats/StatsEndpoints.cs`, `tests/.../StatsTests.cs`
- Değiştir: `Program.cs`

**Arayüzler:**
- Üretir: `MapStatsEndpoints()`. Alan adları `src/lib/data.js` içindeki `fetchPlatformStats` ve `fetchLeaderboard` ile aynı.

- [ ] **Adım 1: Failing test: `tests/GidaKoprusu.Api.Tests/StatsTests.cs`**

```csharp
using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class StatsTests
{
    private readonly ApiFactory _factory;

    public StatsTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private Task<JsonElement> PlatformAsync() =>
        _factory.CreateClient().GetFromJsonAsync<JsonElement>("/stats/platform");

    [Fact]
    public async Task Platform_stats_count_only_delivered_orders()
    {
        var before = await PlatformAsync();

        await _factory.CompletedOrderAsync(portions: 2, weightKg: 2); // 2 of 2 portions, 2 kg rescued
        var after = await PlatformAsync();

        Assert.Equal(2, after.GetProperty("totalPortions").GetInt32() - before.GetProperty("totalPortions").GetInt32());
        var kg = after.GetProperty("totalFoodSavedKg").GetDecimal() - before.GetProperty("totalFoodSavedKg").GetDecimal();
        Assert.InRange(kg, 1.9m, 2.1m); // both totals are rounded to one decimal
        Assert.True(after.GetProperty("activeBusinesses").GetInt32() >= 1);
        Assert.True(after.GetProperty("totalUsers").GetInt32() >= 2);
    }

    [Fact]
    public async Task Leaderboard_ranks_by_points_and_flags_the_caller()
    {
        var order = await _factory.CompletedOrderAsync(portions: 30, weightKg: 3, buyerName: "Lider Test");

        var rows = await order.Buyer.GetFromJsonAsync<JsonElement>("/stats/leaderboard?limit=100");

        var me = Assert.Single(rows.EnumerateArray(), r => r.GetProperty("isCurrentUser").GetBoolean());
        Assert.Equal("Lider Test", me.GetProperty("name").GetString());
        Assert.Equal(1500, me.GetProperty("points").GetInt32());
        Assert.Equal(3.0m, me.GetProperty("kg").GetDecimal());
        var ranks = rows.EnumerateArray().Select(r => r.GetProperty("rank").GetInt32()).ToList();
        Assert.Equal(Enumerable.Range(1, ranks.Count), ranks);
    }
}
```

- [ ] **Adım 2: Başarısız olduğunu doğrula**

Çalıştır: `dotnet test --filter "FullyQualifiedName~StatsTests"`
Beklenen: FAIL (404).

- [ ] **Adım 3: `Stats/StatsEndpoints.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Reviews;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Stats;

public record PlatformStatsDto(
    decimal TotalFoodSavedKg, decimal TotalCo2SavedKg, int TotalPortions, int ActiveBusinesses,
    int ActiveNgos, int TotalUsers, int TodayActiveListings);

public record LeaderboardRowDto(int Rank, string Name, string? Avatar, decimal Kg, int Points, bool IsCurrentUser);

// Every figure is derived from delivered orders, so a cancelled or unscanned order never counts.
public static class StatsEndpoints
{
    public const int PointsPerPortion = 50;

    public static void MapStatsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/stats/platform", async (AppDbContext db, CancellationToken ct) =>
        {
            var completed = db.Reservations.Where(r => r.Status == ReservationStatuses.Completed);
            return new PlatformStatsDto(
                Round1(await completed.SumAsync(r => r.SavedKg, ct)),
                Round1(await completed.SumAsync(r => r.Co2Kg, ct)),
                await completed.SumAsync(r => r.PortionCount, ct),
                await db.Organisations.CountAsync(o => o.Kind == OrganisationKinds.Business && o.Status == OrganisationStatuses.Active, ct),
                await db.Organisations.CountAsync(o => o.Kind == OrganisationKinds.Ngo && o.Status == OrganisationStatuses.Active, ct),
                await db.Users.CountAsync(ct),
                await db.Listings.CountAsync(l => l.Status == ListingStatuses.Active && l.PortionsAvailable > 0, ct));
        });

        app.MapGet("/stats/leaderboard", async (int? limit, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var take = Math.Clamp(limit ?? 10, 1, 100);

            // Ordering by portions is ordering by points (points = portions x 50).
            var totals = await db.Reservations
                .Where(r => r.Status == ReservationStatuses.Completed)
                .GroupBy(r => r.UserId)
                .Select(g => new { UserId = g.Key, Kg = g.Sum(r => r.SavedKg), Portions = g.Sum(r => r.PortionCount) })
                .Where(t => t.Portions > 0)
                .OrderByDescending(t => t.Portions)
                .ThenByDescending(t => t.Kg)
                .Take(take)
                .ToListAsync(ct);

            var ids = totals.Select(t => t.UserId).ToList();
            var users = await db.Users.Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct);
            var me = principal.UserIdOrNull();

            return totals.Select((t, index) =>
            {
                var user = users.GetValueOrDefault(t.UserId);
                return new LeaderboardRowDto(
                    index + 1,
                    string.IsNullOrWhiteSpace(user?.DisplayName) ? ReviewEndpoints.DefaultAuthor : user.DisplayName,
                    user?.AvatarUrl,
                    Round1(t.Kg),
                    t.Portions * PointsPerPortion,
                    t.UserId == me);
            });
        });
    }

    private static decimal Round1(decimal value) => Math.Round(value, 1, MidpointRounding.AwayFromZero);
}
```

- [ ] **Adım 4: `Program.cs` dosyasına bağla**

`using GidaKoprusu.Api.Reviews;` satırının altına:

```csharp
using GidaKoprusu.Api.Stats;
```

`app.MapReviewEndpoints();` satırının altına:

```csharp
app.MapStatsEndpoints();
```

- [ ] **Adım 5: Testleri koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~StatsTests"`
Beklenen: `Passed: 2`.

---

### Task 3: Bursa demo verisi (TDD)

**Dosyalar:**
- Oluştur: `Seed/seed-bursa.sql`, `Seed/BursaSeeder.cs`, `tests/.../BursaSeederTests.cs`
- Değiştir: `GidaKoprusu.Api.csproj`, `Program.cs`, `appsettings.Development.json`

**Arayüzler:**
- Tüketir: `TrustScore.RecomputeAsync`.
- Üretir: `BursaSeeder.SeedAsync(AppDbContext db, CancellationToken ct = default) : Task`

- [ ] **Adım 1: SQL dosyasını kopyala ve uyarla**

```bash
mkdir -p src/GidaKoprusu.Api/Seed
cp ../supabase/seed-bursa.sql src/GidaKoprusu.Api/Seed/seed-bursa.sql
```

`src/GidaKoprusu.Api/Seed/seed-bursa.sql` dosyasında iki değişiklik yap:

1. Son satırı **sil**. Silinecek satır:

```sql
select public.recompute_organisation_trust(id) from public.organisations where id like 'bursa\_%';
```

2. Dosyanın başındaki yorum bloğunu (`-- Demo organisations ...` ile başlayıp ilk `insert` satırından önce biten satırlar) şununla **değiştir**:

```sql
-- Demo organisations and listings in Bursa, loaded by BursaSeeder at startup when
-- Seed:Bursa is true (Development). Copied from supabase/seed-bursa.sql; the trust score
-- recompute at the end is done in C# by the seeder instead.
--
-- Safe to re-run: it keeps existing organisations and replaces its own listings. Listings
-- are for the day they are created, so a restart refreshes them for today.
```

Kontrol: `grep -c "recompute_organisation_trust" src/GidaKoprusu.Api/Seed/seed-bursa.sql` komutu `0` basmalı.

- [ ] **Adım 2: csproj'a dosya kopyalamayı ekle**

`GidaKoprusu.Api.csproj` dosyasında son `</ItemGroup>` satırından sonra, `</Project>` satırından önce şunu ekle:

```xml
  <ItemGroup>
    <None Update="Seed\seed-bursa.sql">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      <CopyToPublishDirectory>PreserveNewest</CopyToPublishDirectory>
    </None>
  </ItemGroup>
```

- [ ] **Adım 3: Failing test: `tests/GidaKoprusu.Api.Tests/BursaSeederTests.cs`**

```csharp
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Seed;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class BursaSeederTests
{
    private readonly ApiFactory _factory;

    public BursaSeederTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    [Fact]
    public async Task Seed_loads_four_organisations_and_seven_listings_and_is_repeatable()
    {
        await _factory.DbAsync(db => BursaSeeder.SeedAsync(db));
        await _factory.DbAsync(db => BursaSeeder.SeedAsync(db));

        var (organisations, listings, scores) = await _factory.DbAsync(async db => (
            await db.Organisations.CountAsync(o => o.Id.StartsWith("bursa_") && o.Status == OrganisationStatuses.Active),
            await db.Listings.CountAsync(l => l.OrganisationId.StartsWith("bursa_") && l.Status == ListingStatuses.Active),
            await db.Organisations.Where(o => o.Id.StartsWith("bursa_")).Select(o => o.TrustScore).Distinct().ToListAsync()));

        Assert.Equal(4, organisations);
        Assert.Equal(7, listings);
        Assert.Equal(new[] { 64 }, scores); // recomputed: no reviews, no deliveries
    }
}
```

- [ ] **Adım 4: Derlenmediğini doğrula**

Çalıştır: `dotnet build tests/GidaKoprusu.Api.Tests`
Beklenen: `GidaKoprusu.Api.Seed` bulunamaz.

- [ ] **Adım 5: `Seed/BursaSeeder.cs`**

```csharp
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Seed;

public static class BursaSeeder
{
    // Runs the SQL through a plain command rather than ExecuteSqlRaw, which would treat the
    // braces in array literals as format placeholders.
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        var sql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Seed", "seed-bursa.sql"), ct);

        await db.Database.OpenConnectionAsync(ct);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = sql;
            await command.ExecuteNonQueryAsync(ct);
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        var ids = await db.Organisations.Where(o => o.Id.StartsWith("bursa_")).Select(o => o.Id).ToListAsync(ct);
        foreach (var id in ids)
            await TrustScore.RecomputeAsync(db, id, ct);
    }
}
```

- [ ] **Adım 6: `Program.cs` dosyasında seed'i bağla**

`using GidaKoprusu.Api.Reviews;` satırının üstüne:

```csharp
using GidaKoprusu.Api.Seed;
```

Açılış bloğundaki şu satırı:

```csharp
    await AdminSeeder.SeedAsync(db, services.GetRequiredService<IConfiguration>(), services.GetRequiredService<TimeProvider>());
```

şu iki satırla değiştir:

```csharp
    var config = services.GetRequiredService<IConfiguration>();
    await AdminSeeder.SeedAsync(db, config, services.GetRequiredService<TimeProvider>());
    if (config.GetValue<bool>("Seed:Bursa"))
        await BursaSeeder.SeedAsync(db);
```

- [ ] **Adım 7: `appsettings.Development.json` içindeki `Seed` bölümünü güncelle**

```json
  "Seed": {
    "AdminEmail": "admin@gidakoprusu.local",
    "Bursa": true
  },
```

Dosyanın geri kalanına dokunma.

- [ ] **Adım 8: Tüm testleri koş**

Çalıştır: `dotnet test`
Beklenen: `Passed!  - Failed: 0, Passed: 67` (60 + 4 Review + 2 Stats + 1 Seeder).

Hata ayıklama ipuçları:
- `Could not find file ... seed-bursa.sql`: csproj'daki `None Update` yolu `Seed\seed-bursa.sql` olmalı. Sonra `dotnet build` ile yeniden derle.
- `column ... does not exist`: SQL'deki sütun adı ile `AppDbContext` snake_case adı uyuşmuyor. Migration'daki adla karşılaştır.

- [ ] **Adım 9: Elle duman testi**

`docker compose up -d db` komutunun çalıştığından emin ol. `dotnet run --project src/GidaKoprusu.Api` komutunu arka planda başlat ve şunu çalıştır:

```bash
curl -s --retry 20 --retry-connrefused --retry-delay 1 http://localhost:5080/listings | python -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:5080/stats/platform
```

Beklenen: İlk komut `7` basar. Saat 23:30'dan sonra çalıştırılırsa ilanlar süresi dolduğu için daha az olabilir. İkinci komut alanları camelCase olan bir JSON basar. Sonra süreci durdur.

---

## Bölüm sonu

- [ ] `dotnet test` → 67 test geçmeli.
- [ ] `DURUM.md` içinde 5. satırı `✅ Tamam` yap. "Sıradaki tek iş": `Bölüm 6: docs/superpowers/plans/2026-10-08-backend-bolum-6-frontend.md`.
- [ ] Commit mesajı öner: `feat(api): reviews, platform stats, leaderboard and Bursa demo seed`
- [ ] **Mülakat soruları:**
  1. Güven skoru formülündeki `+12` ve `+3` ne anlama geliyor? [Bayesian ortalama: her kurum 3 tane hayali 4 yıldızlık yorumla başlar. Böylece ilk tek yorum skoru aşırı oynatamaz.]
  2. Aynı siparişe ikinci yorumu hem `AnyAsync` ile hem de unique index ile engelliyoruz. Neden ikisi birden? [`AnyAsync` olağan durumda temiz bir 409 verir. Index ise aynı anda gelen iki isteği yakalar. Tek başına `AnyAsync` yarış durumunda yetmez.]
  3. Liderlik sorgusu SQL'e nasıl çevrilir? [`GROUP BY user_id`, `SUM(...)`, `HAVING SUM(portion_count) > 0`, `ORDER BY ... LIMIT`. Kullanıcı adları ikinci sorguyla toplu çekilir, N+1 yok.]
  4. Seed SQL'i neden `ExecuteSqlRaw` ile değil de ham ADO komutuyla çalıştırıyoruz? [`ExecuteSqlRaw` süslü parantezleri format parametresi sanabilir. SQL'de `'{...}'` dizi değerleri ve `::text[]` var.]
  5. Güven skoru neden yorumla aynı transaction içinde hesaplanıyor? [İkisinden biri başarısız olursa diğeri de geri alınır. Skor, dayandığı yorum ve teslim verisiyle hiçbir an çelişmez.]
