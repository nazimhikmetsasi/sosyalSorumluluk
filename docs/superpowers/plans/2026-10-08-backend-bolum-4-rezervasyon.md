# Bölüm 4: Rezervasyon, İptal, QR Teslim ve Güven Skoru Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma.**

**Hedef:** Rezervasyon oluşturma, iptal ve QR ile teslim onayı. Son porsiyon yarışı atomik bir koşullu UPDATE ile çözülür. Teslimden sonra güven skoru aynı transaction içinde yeniden hesaplanır.

**Mimari:**
- `ReservationService` (scoped) iş kurallarını tek yerde toplar. Endpoint'ler bu servisi çağıran ince katmandır.
- Stok düşürme `ExecuteUpdateAsync` ile tek sorguda yapılır. `WHERE portions_available >= n` koşulu kilit görevi görür.
- `TrustScore`, Supabase'deki formülü decimal aritmetikle aynen uygular.

**Teknoloji:** EF Core transaction'ları ve `ExecuteUpdateAsync`, `RandomNumberGenerator`.

## Global Kısıtlar

Bölüm 1 planındaki "Global Kısıtlar" bölümü aynen geçerli: `net9.0`, paket ekleme yok, komutlar `api/` içinde çalışır, mesajlar birebir Türkçe, saat `TimeProvider`'dan alınır, commit yok.

## Başlamadan önce

- [ ] `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api" && dotnet test` → 40 test geçmeli.

## Dosya haritası

```
src/GidaKoprusu.Api/
  Organisations/TrustScore.cs            Compute + RecomputeAsync
  Reservations/ReservationService.cs     CreateAsync, CancelAsync, CompleteDeliveryAsync
  Reservations/ReservationEndpoints.cs   ReservationDto, istek kayıtları, uçlar
  Program.cs                             (servis kaydı + Map çağrısı)
tests/GidaKoprusu.Api.Tests/
  TestData.cs                            (ReserveAsync eklenir)
  TrustScoreTests.cs
  ReservationTests.cs
  DeliveryTests.cs
```

---

### Task 1: Güven skoru formülü (TDD, birim testi)

**Dosyalar:**
- Oluştur: `Organisations/TrustScore.cs`, `tests/.../TrustScoreTests.cs`

**Arayüzler:**
- Üretir:
  - `TrustScore.Compute(int reviewCount, int ratingSum, int completedCount) : int`
  - `TrustScore.RecomputeAsync(AppDbContext db, string organisationId, CancellationToken ct) : Task`
  - Bölüm 5'teki yorum ucu da `RecomputeAsync` fonksiyonunu çağıracak.

- [ ] **Adım 1: Failing test: `tests/GidaKoprusu.Api.Tests/TrustScoreTests.cs`**

```csharp
using GidaKoprusu.Api.Organisations;

namespace GidaKoprusu.Api.Tests;

public class TrustScoreTests
{
    [Theory]
    [InlineData(0, 0, 0, 64)]
    [InlineData(0, 0, 1, 65)]
    [InlineData(1, 5, 1, 69)]
    [InlineData(2, 3, 0, 48)]
    [InlineData(10, 50, 25, 96)]
    [InlineData(29, 101, 0, 57)] // exactly 56.5: rounds away from zero, like Postgres round(numeric)
    public void Compute_matches_the_supabase_formula(int reviewCount, int ratingSum, int completedCount, int expected)
    {
        Assert.Equal(expected, TrustScore.Compute(reviewCount, ratingSum, completedCount));
    }
}
```

- [ ] **Adım 2: Derlenmediğini doğrula**

Çalıştır: `dotnet build tests/GidaKoprusu.Api.Tests`
Beklenen: `TrustScore` bulunamaz.

- [ ] **Adım 3: `Organisations/TrustScore.cs`**

```csharp
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Organisations;

public static class TrustScore
{
    // Same formula as recompute_organisation_trust() in supabase/trust-score-lock.sql. 80% is a
    // Bayesian average that starts every organisation at 4 stars from 3 imaginary reviews
    // (12 points over 3 reviews), so one early review cannot swing it; 20% grows with up to
    // 20 completed deliveries. Decimal arithmetic matches Postgres numeric exactly.
    public static int Compute(int reviewCount, int ratingSum, int completedCount)
    {
        var reviews = 0.8m * ((ratingSum + 12m) / (reviewCount + 3) / 5m);
        var deliveries = 0.2m * Math.Min(completedCount, 20) / 20m;
        return (int)Math.Round(100 * (reviews + deliveries), MidpointRounding.AwayFromZero);
    }

    // Call inside the same transaction as the change that triggered it, so the score can never
    // disagree with the orders and reviews it was computed from.
    public static async Task RecomputeAsync(AppDbContext db, string organisationId, CancellationToken ct)
    {
        var ratings = await db.Reviews
            .Where(r => r.OrganisationId == organisationId)
            .Select(r => r.Rating)
            .ToListAsync(ct);
        var completed = await db.Reservations
            .CountAsync(r => r.OrganisationId == organisationId && r.Status == ReservationStatuses.Completed, ct);

        var ratingSum = ratings.Sum();
        var score = Compute(ratings.Count, ratingSum, completed);
        decimal? average = ratings.Count == 0
            ? null
            : Math.Round((decimal)ratingSum / ratings.Count, 1, MidpointRounding.AwayFromZero);
        var reviewCount = ratings.Count;

        await db.Organisations
            .Where(o => o.Id == organisationId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.TrustScore, score)
                .SetProperty(o => o.Rating, average)
                .SetProperty(o => o.ReviewCount, reviewCount), ct);
    }
}
```

- [ ] **Adım 4: Testi koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~TrustScoreTests"`
Beklenen: `Passed: 6`.

---

### Task 2: Rezervasyon ve iptal (TDD)

**Dosyalar:**
- Oluştur: `Reservations/ReservationService.cs`, `Reservations/ReservationEndpoints.cs`, `tests/.../ReservationTests.cs`
- Değiştir: `tests/.../TestData.cs` (yeni metot eklenir), `Program.cs`

**Arayüzler:**
- Tüketir:
  - `ListingRules.IsExpired(Listing, DateTime)` (Bölüm 3)
  - `IstanbulTime.PickupInstant`
  - `TrustScore.RecomputeAsync` (Task 1)
  - `ClaimsExtensions`
- Üretir:
  - `ReservationService.CreateAsync(Guid userId, string role, Guid listingId, int portionCount, CancellationToken) : Task<Reservation>`
  - `ReservationService.CancelAsync(Guid userId, Guid reservationId, CancellationToken) : Task<Reservation>`
  - `ReservationService.CompleteDeliveryAsync(string role, string? organisationId, string qrToken, CancellationToken) : Task<Guid>`
  - `ReservationDto.From(Reservation)`. Reservation'ın `Organisation` alanı yüklenmiş olmalı.
  - `MapReservationEndpoints()`
  - Test yardımcısı: `TestData.ReserveAsync(this HttpClient client, Guid listingId, int portionCount = 1) : Task<HttpResponseMessage>`

- [ ] **Adım 1: `TestData.cs` dosyasına yardımcı ekle**

`TestData` sınıfının içine, `CreateListingAsync` metodundan sonra şu metodu ekle:

```csharp
    public static Task<HttpResponseMessage> ReserveAsync(this HttpClient client, Guid listingId, int portionCount = 1) =>
        client.PostAsJsonAsync("/reservations", new { listingId, portionCount });
```

Dosyanın en üstündeki `using` satırlarına şunu ekle:

```csharp
using System.Net.Http.Json;
```

- [ ] **Adım 2: Failing test: `tests/GidaKoprusu.Api.Tests/ReservationTests.cs`**

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ReservationTests
{
    private readonly ApiFactory _factory;

    public ReservationTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private Task<int> PortionsLeftAsync(Guid listingId) =>
        _factory.DbAsync(db => db.Listings.Where(l => l.Id == listingId).Select(l => l.PortionsAvailable).SingleAsync());

    [Fact]
    public async Task Price_impact_and_codes_are_computed_by_the_server()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5, priceOriginal: 100, priceDiscounted: 40, weightKg: 2);
        var (buyer, user) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id, portionCount: 2);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(user.Id.ToString(), order.GetProperty("userId").GetString());
        Assert.Equal(organisation.Id, order.GetProperty("businessId").GetString());
        Assert.Equal("Test Kurum", order.GetProperty("businessName").GetString());
        Assert.Equal("confirmed", order.GetProperty("status").GetString());
        Assert.Equal(80m, order.GetProperty("paidAmount").GetDecimal());
        Assert.Equal(0.8m, order.GetProperty("savedKg").GetDecimal());
        Assert.Equal(2m, order.GetProperty("co2Kg").GetDecimal());
        Assert.Equal(120m, order.GetProperty("savedAmount").GetDecimal());
        Assert.Matches("^GK-[0-9]{6}$", order.GetProperty("pickupCode").GetString());
        Assert.Matches("^[0-9a-f]{48}$", order.GetProperty("qrToken").GetString());
        Assert.Equal(3, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Twenty_buyers_racing_for_the_last_portion_produce_exactly_one_order()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 1);
        var buyers = new List<HttpClient>();
        for (var i = 0; i < 20; i++)
            buyers.Add((await _factory.SignInAsync()).Client);

        var responses = await Task.WhenAll(buyers.Select(buyer => buyer.ReserveAsync(listing.Id)));

        Assert.Equal(1, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.Equal(19, responses.Count(r => r.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(0, await PortionsLeftAsync(listing.Id));
        var orders = await _factory.DbAsync(db => db.Reservations.CountAsync(r => r.ListingId == listing.Id));
        Assert.Equal(1, orders);
    }

    [Fact]
    public async Task Asking_for_more_than_is_left_is_rejected()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5);
        var (buyer, _) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id, portionCount: 6);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Yeterli porsiyon kalmadı.", await response.DetailAsync());
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Businesses_cannot_reserve()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var response = await business.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("İşletme ve yönetici hesapları rezervasyon yapamaz.", await response.DetailAsync());
    }

    [Fact]
    public async Task An_ngo_can_reserve()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var ngo = await _factory.CreateOrganisationAsync(OrganisationKinds.Ngo);
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (ngoUser, _) = await _factory.SignInAsync(Roles.Ngo, ngo.Id);

        var response = await ngoUser.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task A_listing_past_its_pickup_window_cannot_be_reserved()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, pickupStart: "09:00", pickupEnd: "11:00");
        var (buyer, _) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Bu ilanın teslim süresi doldu.", await response.DetailAsync());
    }

    [Fact]
    public async Task Cancelling_returns_the_portions()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5);
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id, 2)).Content.ReadFromJsonAsync<JsonElement>();

        var response = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("cancelled", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));

        var again = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Cancelling_closes_thirty_minutes_before_pickup()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, pickupStart: "13:00", pickupEnd: "18:00");
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        _factory.Clock.Now = TestClock.Noon.AddMinutes(40); // 12:40 in Istanbul, pickup at 13:00
        var response = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Teslim saatine 30 dakikadan az kaldığı için iptal edilemez.", await response.DetailAsync());
    }

    [Fact]
    public async Task Nobody_else_can_cancel_an_order()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var (stranger, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        var response = await stranger.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("Sipariş bulunamadı.", await response.DetailAsync());
    }

    [Fact]
    public async Task Each_side_sees_only_its_own_orders()
    {
        var bakery = await _factory.CreateOrganisationAsync();
        var grocer = await _factory.CreateOrganisationAsync();
        var bread = await _factory.CreateListingAsync(bakery.Id);
        var apples = await _factory.CreateListingAsync(grocer.Id);
        var (alice, _) = await _factory.SignInAsync();
        var (bob, _) = await _factory.SignInAsync();
        var (bakeryUser, _) = await _factory.SignInAsync(Roles.Business, bakery.Id);
        var (grocerUser, _) = await _factory.SignInAsync(Roles.Business, grocer.Id);
        var aliceOrder = (await (await alice.ReserveAsync(bread.Id)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        var bobOrder = (await (await bob.ReserveAsync(apples.Id)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        async Task<List<string>> Ids(HttpClient client) =>
            (await client.GetFromJsonAsync<JsonElement>("/reservations")).EnumerateArray()
                .Select(r => r.GetProperty("id").GetString()!).ToList();

        Assert.Equal(new[] { aliceOrder! }, await Ids(alice));
        Assert.Equal(new[] { aliceOrder! }, await Ids(bakeryUser));
        Assert.Equal(new[] { bobOrder! }, await Ids(grocerUser));
    }
}
```

- [ ] **Adım 3: Başarısız olduğunu doğrula**

Çalıştır: `dotnet test --filter "FullyQualifiedName~ReservationTests"`
Beklenen: FAIL, çünkü `/reservations` 404 döner.

- [ ] **Adım 4: `Reservations/ReservationService.cs`**

```csharp
using System.Security.Cryptography;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Listings;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Reservations;

public sealed class ReservationService(AppDbContext db, TimeProvider clock)
{
    public static readonly TimeSpan CancelCutOff = TimeSpan.FromMinutes(30);

    public async Task<Reservation> CreateAsync(Guid userId, string role, Guid listingId, int portionCount, CancellationToken ct)
    {
        if (role is not (Roles.Buyer or Roles.Ngo))
            throw AppException.Forbidden("İşletme ve yönetici hesapları rezervasyon yapamaz.");
        if (portionCount < 1)
            throw AppException.BadRequest("En az 1 porsiyon seçmelisiniz.");

        var now = clock.GetUtcNow().UtcDateTime;
        var listing = await db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == listingId, ct)
            ?? throw AppException.NotFound("İlan bulunamadı.");
        if (listing.Status != ListingStatuses.Active || ListingRules.IsExpired(listing, now))
            throw AppException.Conflict("Bu ilanın teslim süresi doldu.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // The WHERE clause is the lock. When two buyers race for the last portion, Postgres makes
        // the second UPDATE wait for the first to commit, re-checks the condition, finds no row,
        // and we refuse instead of overselling.
        var taken = await db.Listings
            .Where(l => l.Id == listingId && l.Status == ListingStatuses.Active && l.PortionsAvailable >= portionCount)
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.PortionsAvailable, l => l.PortionsAvailable - portionCount), ct);
        if (taken == 0)
            throw AppException.Conflict("Yeterli porsiyon kalmadı.");

        // Never trust the client for the owner, the price or the impact: all come from the listing.
        var kgPerPortion = listing.WeightKg / Math.Max(listing.PortionsTotal, 1);
        var reservation = new Reservation
        {
            UserId = userId,
            ListingId = listing.Id,
            OrganisationId = listing.OrganisationId,
            ListingTitle = listing.Title,
            Image = listing.Image,
            PortionCount = portionCount,
            PaidAmount = listing.PriceDiscounted * portionCount,
            PickupStartTime = listing.PickupStartTime,
            PickupEndTime = listing.PickupEndTime,
            PickupCode = await NewPickupCodeAsync(listing.OrganisationId, ct),
            // 48 hex characters: the frontend trims scanned QR text to 60, so it must stay below that.
            QrToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            SavedKg = Math.Round(kgPerPortion * portionCount, 2, MidpointRounding.AwayFromZero),
            Co2Kg = Math.Round(kgPerPortion * portionCount * 2.5m, 2, MidpointRounding.AwayFromZero),
            SavedAmount = Math.Max(listing.PriceOriginal - listing.PriceDiscounted, 0) * portionCount,
            ListingCreatedAt = listing.CreatedAt,
            CreatedAt = now,
        };
        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        await db.Entry(reservation).Reference(r => r.Organisation).LoadAsync(ct);
        return reservation;
    }

    public async Task<Reservation> CancelAsync(Guid userId, Guid reservationId, CancellationToken ct)
    {
        // Someone else's order answers 404, not 403, so ids cannot be probed.
        var reservation = await db.Reservations.Include(r => r.Organisation)
            .FirstOrDefaultAsync(r => r.Id == reservationId && r.UserId == userId, ct)
            ?? throw AppException.NotFound("Sipariş bulunamadı.");
        if (reservation.Status != ReservationStatuses.Confirmed)
            throw AppException.Conflict("Bu sipariş artık iptal edilemez.");

        var deadline = IstanbulTime.PickupInstant(reservation.CreatedAt, reservation.PickupStartTime) - CancelCutOff;
        if (deadline is not null && clock.GetUtcNow().UtcDateTime > deadline)
            throw AppException.Conflict("Teslim saatine 30 dakikadan az kaldığı için iptal edilemez.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Conditional on the old status, so a double click returns the portions only once.
        var changed = await db.Reservations
            .Where(r => r.Id == reservationId && r.Status == ReservationStatuses.Confirmed)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Status, ReservationStatuses.Cancelled), ct);
        if (changed == 0)
            throw AppException.Conflict("Bu sipariş artık iptal edilemez.");

        if (reservation.ListingId is { } listingId)
        {
            var portions = reservation.PortionCount;
            await db.Listings
                .Where(l => l.Id == listingId)
                .ExecuteUpdateAsync(s => s.SetProperty(l => l.PortionsAvailable, l => l.PortionsAvailable + portions), ct);
        }
        await transaction.CommitAsync(ct);

        reservation.Status = ReservationStatuses.Cancelled;
        return reservation;
    }

    public async Task<Guid> CompleteDeliveryAsync(string role, string? organisationId, string qrToken, CancellationToken ct)
    {
        if (role is not (Roles.Business or Roles.Ngo) || organisationId is null)
            throw AppException.Forbidden("Teslimat yalnızca işletme veya STK hesabıyla onaylanır.");

        // The token must belong to an order of the scanning organisation.
        var reservation = await db.Reservations.AsNoTracking()
            .FirstOrDefaultAsync(r => r.QrToken == qrToken && r.OrganisationId == organisationId, ct)
            ?? throw AppException.NotFound("Geçersiz QR kod.");
        if (reservation.Status == ReservationStatuses.Completed)
            throw AppException.Conflict("Bu teslimat daha önce zaten onaylanmış.");
        if (reservation.Status != ReservationStatuses.Confirmed)
            throw AppException.Conflict("Bu sipariş artık teslim edilemez.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Two scans at the same moment both pass the check above; only one matches here.
        var changed = await db.Reservations
            .Where(r => r.Id == reservation.Id && r.Status == ReservationStatuses.Confirmed)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.Status, ReservationStatuses.Completed), ct);
        if (changed == 0)
            throw AppException.Conflict("Bu teslimat daha önce zaten onaylanmış.");

        await TrustScore.RecomputeAsync(db, organisationId, ct);
        await transaction.CommitAsync(ct);
        return reservation.Id;
    }

    // ponytail: check-then-insert. Two simultaneous orders at one organisation can still draw the
    // same code and one then fails on the unique index (a 500); about one in a million per pair.
    private async Task<string> NewPickupCodeAsync(string organisationId, CancellationToken ct)
    {
        while (true)
        {
            var code = $"GK-{RandomNumberGenerator.GetInt32(0, 1_000_000):D6}";
            if (!await db.Reservations.AnyAsync(r => r.OrganisationId == organisationId && r.PickupCode == code, ct))
                return code;
        }
    }
}
```

- [ ] **Adım 5: `Reservations/ReservationEndpoints.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Reservations;

// Same field names as toReservation() in src/lib/data.js; pickupDate stays in the frontend.
public record ReservationDto(
    Guid Id, Guid UserId, Guid? ListingId, string ListingTitle, string BusinessId, string BusinessName,
    string BusinessAddress, string BusinessPhone, string? Image, int PortionCount, decimal PaidAmount,
    string Status, string? PickupStartTime, string? PickupEndTime, string PickupCode, string QrToken,
    DateTime CreatedAt, decimal SavedKg, decimal Co2Kg, decimal SavedAmount, DateTime? ListingCreatedAt)
{
    public static ReservationDto From(Reservation r) => new(
        r.Id, r.UserId, r.ListingId, r.ListingTitle, r.OrganisationId,
        r.Organisation?.Name ?? "", r.Organisation?.Address ?? "", r.Organisation?.Phone ?? "",
        r.Image, r.PortionCount, r.PaidAmount, r.Status, r.PickupStartTime, r.PickupEndTime,
        r.PickupCode, r.QrToken, r.CreatedAt, r.SavedKg, r.Co2Kg, r.SavedAmount, r.ListingCreatedAt);
}

// Only the choice of listing and quantity is accepted; everything else is derived server-side.
public record CreateReservationRequest(Guid ListingId, int PortionCount);

public record CompleteDeliveryRequest(string? QrToken);

public static class ReservationEndpoints
{
    public static void MapReservationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("").RequireAuthorization();

        // Two parties can see an order: the buyer who placed it and the organisation fulfilling it.
        group.MapGet("/reservations", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.UserId();
            var organisationId = principal.OrganisationId();
            var rows = await db.Reservations
                .Include(r => r.Organisation)
                .Where(r => r.UserId == userId || (organisationId != null && r.OrganisationId == organisationId))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);
            return rows.Select(ReservationDto.From);
        });

        group.MapPost("/reservations", async (CreateReservationRequest body, ClaimsPrincipal principal,
            ReservationService reservations, CancellationToken ct) =>
        {
            var reservation = await reservations.CreateAsync(principal.UserId(), principal.Role(), body.ListingId, body.PortionCount, ct);
            return Results.Created($"/reservations/{reservation.Id}", ReservationDto.From(reservation));
        });

        group.MapPost("/reservations/{id:guid}/cancel", async (Guid id, ClaimsPrincipal principal,
            ReservationService reservations, CancellationToken ct) =>
            ReservationDto.From(await reservations.CancelAsync(principal.UserId(), id, ct)));

        group.MapPost("/deliveries/complete", async (CompleteDeliveryRequest body, ClaimsPrincipal principal,
            ReservationService reservations, CancellationToken ct) =>
        {
            var id = await reservations.CompleteDeliveryAsync(principal.Role(), principal.OrganisationId(), body.QrToken ?? "", ct);
            return Results.Ok(new { id });
        });
    }
}
```

- [ ] **Adım 6: `Program.cs` dosyasına servis kaydını ve uçları ekle**

`using GidaKoprusu.Api.Listings;` satırının altına:

```csharp
using GidaKoprusu.Api.Reservations;
```

`builder.Services.AddScoped<OtpService>();` satırının altına:

```csharp
builder.Services.AddScoped<ReservationService>();
```

`app.MapListingEndpoints();` satırının altına:

```csharp
app.MapReservationEndpoints();
```

- [ ] **Adım 7: Testleri koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~ReservationTests"`
Beklenen: `Passed: 10`. Yarış testi tutarlı biçimde geçmeli. Emin olmak için bu filtreyi **3 kez** koştur, üçünde de geçmeli.

Hata ayıklama ipuçları:
- Yarış testinde birden fazla 201 dönüyorsa: UPDATE'in `WHERE` koşulunda `PortionsAvailable >= portionCount` eksik, ya da stok düşürme ile kayıt ekleme aynı transaction içinde değil.
- 500 alınıyorsa ve hata `No coercion operator` ise: `ExecuteUpdateAsync` lambda'sında decimal/int karışmış olabilir. Önce yerel değişkene atayıp öyle kullan.

---

### Task 3: QR ile teslim (TDD)

**Dosyalar:**
- Test: `tests/.../DeliveryTests.cs`

**Arayüzler:**
- Tüketir: Task 2'deki `/deliveries/complete` ucu ve `TrustScore.Compute`.

- [ ] **Adım 1: Test yaz: `tests/GidaKoprusu.Api.Tests/DeliveryTests.cs`**

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class DeliveryTests
{
    private readonly ApiFactory _factory;

    public DeliveryTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private async Task<(Organisation Organisation, HttpClient Buyer, JsonElement Order)> OrderAsync()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();
        return (organisation, buyer, order);
    }

    private static Task<HttpResponseMessage> ScanAsync(HttpClient client, JsonElement order) =>
        client.PostAsJsonAsync("/deliveries/complete", new { qrToken = order.GetProperty("qrToken").GetString() });

    [Fact]
    public async Task Scanning_completes_the_order_once_and_updates_the_trust_score()
    {
        var (organisation, buyer, order) = await OrderAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var first = await ScanAsync(business, order);
        var second = await ScanAsync(business, order);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(order.GetProperty("id").GetString(), (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal("Bu teslimat daha önce zaten onaylanmış.", await second.DetailAsync());

        var mine = await buyer.GetFromJsonAsync<JsonElement>("/reservations");
        Assert.Equal("completed", mine[0].GetProperty("status").GetString());
        var score = await _factory.DbAsync(db => db.Organisations.Where(o => o.Id == organisation.Id).Select(o => o.TrustScore).SingleAsync());
        Assert.Equal(TrustScore.Compute(0, 0, 1), score);
    }

    [Fact]
    public async Task Another_organisation_cannot_complete_the_order()
    {
        var (_, _, order) = await OrderAsync();
        var other = await _factory.CreateOrganisationAsync();
        var (stranger, _) = await _factory.SignInAsync(Roles.Business, other.Id);

        var response = await ScanAsync(stranger, order);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("Geçersiz QR kod.", await response.DetailAsync());
    }

    [Fact]
    public async Task A_buyer_cannot_complete_an_order()
    {
        var (_, buyer, order) = await OrderAsync();

        var response = await ScanAsync(buyer, order);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("Teslimat yalnızca işletme veya STK hesabıyla onaylanır.", await response.DetailAsync());
    }

    [Fact]
    public async Task A_cancelled_order_cannot_be_delivered()
    {
        var (organisation, buyer, order) = await OrderAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);
        await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        var response = await ScanAsync(business, order);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Bu sipariş artık teslim edilemez.", await response.DetailAsync());
    }
}
```

- [ ] **Adım 2: Tüm testleri koş**

Çalıştır: `dotnet test`
Beklenen: `Passed!  - Failed: 0, Passed: 60` (40 + 6 TrustScore + 10 Reservation + 4 Delivery).

Bu task'ta uygulama kodu Task 2'de yazıldı. Testler hemen geçmezse `ReservationService.CompleteDeliveryAsync` fonksiyonunu bu planla karşılaştırarak düzelt. Şema değişmedi, migration **gerekmez**.

---

## Bölüm sonu

- [ ] `dotnet test` → 60 test geçmeli.
- [ ] `DURUM.md` içinde 4. satırı `✅ Tamam` yap. "Sıradaki tek iş": `Bölüm 5: docs/superpowers/plans/2026-10-08-backend-bolum-5-yorum-istatistik.md`.
- [ ] Commit mesajı öner: `feat(api): reservations with atomic stock, cancellation window, QR delivery and trust score`
- [ ] **Mülakat soruları:**
  1. Son porsiyon yarışını tam olarak hangi satır çözüyor? Neden `SELECT ... FOR UPDATE` ya da RowVersion kullanmadık? [Koşullu UPDATE (`WHERE portions_available >= n`). Kilidi tek sorguda alıp koşulu da kontrol ediyor. FOR UPDATE iki sorgu gerektirir. RowVersion çakışmada yeniden deneme mantığı ister.]
  2. READ COMMITTED seviyesinde ikinci transaction'ın UPDATE'i ne görür? [Satır kilidi açılana kadar bekler, sonra satırın commit edilmiş yeni halini görür. Koşulu yeniden değerlendirir, 0 porsiyon kaldığı için 0 satır günceller.]
  3. Fiyatı ve kurum bilgisini neden istemciden almıyoruz? [İstemci istediği fiyatı ya da başka bir kurumu yazabilirdi. Sunucu bunları ilandan okuyor.]
  4. QR teslimde önceden durum kontrolü yaptığımız halde UPDATE'te neden yine `WHERE status = 'confirmed'` var? [Aynı anda iki okutma ikisi de ön kontrolü geçebilir. Koşullu UPDATE bunlardan yalnızca birinin başarılı olmasını garanti ediyor.]
  5. Teslim kodu üretimindeki "önce kontrol et, sonra ekle" yaklaşımının zayıflığı ne? [İki eşzamanlı sipariş aynı kodu çekebilir. Unique index ikincisini 500 ile reddeder. Çözüm: unique violation yakalayıp yeniden denemek.]
