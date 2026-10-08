# Bölüm 3: Kurumlar ve İlanlar Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma.**

**Hedef:** Kurum ve ilan uçları: listeleme, oluşturma, durum değiştirme, görsel yükleme, yetki verme, üye listesi, süresi dolan ilanların arşivlenmesi.

**Mimari:**
- `Organisations/` ve `Listings/` klasörlerinde birer endpoint dosyası.
- DTO'lar frontend'in beklediği camelCase alan adlarıyla döner. Bu adlar `src/lib/data.js` içindeki `toOrganisation` ve `toListing` ile aynıdır.
- Yönetici uçları `RequireRole("admin")` ile korunur. Sahiplik kontrolleri endpoint içinde yapılır ve ihlalde `AppException.Forbidden` fırlatılır.

**Teknoloji:** Minimal API route group'ları, EF Core `ExecuteUpdateAsync`.

## Global Kısıtlar

Bölüm 1 planındaki "Global Kısıtlar" bölümü aynen geçerli: `net9.0`, paket ekleme yok, komutlar `api/` içinde çalışır, mesajlar birebir Türkçe, saat `TimeProvider`'dan alınır, commit yok.

## Başlamadan önce

- [ ] `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api" && dotnet test` → 26 test geçmeli.

## Dosya haritası

```
src/GidaKoprusu.Api/
  Organisations/OrganisationEndpoints.cs   OrganisationDto + istek kayıtları + uçlar
  Listings/ListingEndpoints.cs             ListingDto, ListingRules, istek kayıtları, uçlar
  Program.cs                               (tamamı değişir: iki yeni Map çağrısı)
tests/GidaKoprusu.Api.Tests/
  TestData.cs                              CreateOrganisationAsync, CreateListingAsync
  OrganisationTests.cs
  ListingTests.cs
```

---

### Task 1: Kurum uçları (TDD)

**Dosyalar:**
- Oluştur: `Organisations/OrganisationEndpoints.cs`, `tests/.../TestData.cs`, `tests/.../OrganisationTests.cs`
- Değiştir: `Program.cs` (bu task'ta yalnızca `MapOrganisationEndpoints`, Task 2'de tamamı)

**Arayüzler:**
- Tüketir: `ClaimsExtensions`, `Uploads.SaveImageAsync`, `OtpService.Normalize`, `DbErrors.IsUniqueViolation`, `AppException`.
- Üretir:
  - `OrganisationDto.From(Organisation)`
  - `MapOrganisationEndpoints()`
  - Test yardımcıları: `TestData.CreateOrganisationAsync(this ApiFactory, string kind = "business", string status = "active") : Task<Organisation>` ve `TestData.CreateListingAsync(this ApiFactory, string organisationId, int portions = 5, string pickupStart = "13:00", string pickupEnd = "18:00", decimal priceOriginal = 100, decimal priceDiscounted = 40, decimal weightKg = 2) : Task<Listing>`

- [ ] **Adım 1: `tests/GidaKoprusu.Api.Tests/TestData.cs`**

```csharp
using GidaKoprusu.Api.Data;

namespace GidaKoprusu.Api.Tests;

public static class TestData
{
    public static async Task<Organisation> CreateOrganisationAsync(
        this ApiFactory factory, string kind = OrganisationKinds.Business, string status = OrganisationStatuses.Active)
    {
        var organisation = new Organisation
        {
            Id = "org_" + Guid.NewGuid().ToString("N")[..12],
            Name = "Test Kurum",
            Kind = kind,
            Status = status,
            Address = "Test Mah. No:1, Bursa",
            Phone = "+90 224 000 0000",
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Organisations.Add(organisation);
            await db.SaveChangesAsync();
        });
        return organisation;
    }

    // Defaults: created at the test clock's noon, picked up 13:00-18:00 Istanbul time, so it is
    // open for reservations and cancellable until 12:30.
    public static async Task<Listing> CreateListingAsync(
        this ApiFactory factory, string organisationId, int portions = 5, string pickupStart = "13:00",
        string pickupEnd = "18:00", decimal priceOriginal = 100m, decimal priceDiscounted = 40m, decimal weightKg = 2m)
    {
        var listing = new Listing
        {
            OrganisationId = organisationId,
            Title = "Test İlan",
            PriceOriginal = priceOriginal,
            PriceDiscounted = priceDiscounted,
            PortionsTotal = portions,
            PortionsAvailable = portions,
            PickupStartTime = pickupStart,
            PickupEndTime = pickupEnd,
            WeightKg = weightKg,
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Listings.Add(listing);
            await db.SaveChangesAsync();
        });
        return listing;
    }
}
```

- [ ] **Adım 2: Failing test: `tests/GidaKoprusu.Api.Tests/OrganisationTests.cs`**

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class OrganisationTests
{
    private readonly ApiFactory _factory;

    public OrganisationTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static async Task<List<string>> IdsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonElement>("/organisations"))
            .EnumerateArray().Select(o => o.GetProperty("id").GetString()!).ToList();

    [Fact]
    public async Task Pending_organisations_are_hidden_from_buyers_but_not_from_admins()
    {
        var active = await _factory.CreateOrganisationAsync();
        var pending = await _factory.CreateOrganisationAsync(status: OrganisationStatuses.Pending);
        var (buyer, _) = await _factory.SignInAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var buyerIds = await IdsAsync(buyer);
        Assert.Contains(active.Id, buyerIds);
        Assert.DoesNotContain(pending.Id, buyerIds);

        var adminIds = await IdsAsync(admin);
        Assert.Contains(pending.Id, adminIds);
    }

    [Fact]
    public async Task Admin_creates_an_active_organisation_and_cannot_set_its_score()
    {
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var id = "org_" + Guid.NewGuid().ToString("N")[..8];
        var request = new { id, name = "Yeni Fırın", kind = "business", type = "Fırın", trustScore = 99, rating = 5 };

        var created = await admin.PostAsJsonAsync("/organisations", request);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("active", body.GetProperty("status").GetString());
        Assert.Equal(50, body.GetProperty("trustScore").GetInt32());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("rating").ValueKind);

        var duplicate = await admin.PostAsJsonAsync("/organisations", request);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal("Bu kimlikte bir kurum zaten var.", await duplicate.DetailAsync());
    }

    [Fact]
    public async Task Organisation_id_must_be_a_safe_slug()
    {
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var response = await admin.PostAsJsonAsync("/organisations", new { id = "../etc", name = "Kötü", kind = "business" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Kurum kimliği yalnızca küçük harf, rakam, - ve _ içerebilir.", await response.DetailAsync());
    }

    [Fact]
    public async Task Only_admins_create_organisations_or_change_their_status()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (buyer, _) = await _factory.SignInAsync();

        var create = await buyer.PostAsJsonAsync("/organisations", new { id = "org_x", name = "X", kind = "business" });
        var status = await buyer.PatchAsJsonAsync($"/organisations/{organisation.Id}/status", new { status = "suspended" });
        var anonymous = await _factory.CreateClient().PostAsJsonAsync("/organisations", new { id = "org_y", name = "Y", kind = "business" });

        Assert.Equal(HttpStatusCode.Forbidden, create.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, status.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task Admin_suspends_an_organisation()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var response = await admin.PatchAsJsonAsync($"/organisations/{organisation.Id}/status", new { status = "suspended" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("suspended", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Grant_binds_a_user_to_an_organisation_and_members_lists_them()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var (_, target) = await _factory.SignInAsync();

        var grant = await admin.PostAsJsonAsync("/admin/grants",
            new { email = target.Email.ToUpperInvariant(), organisationId = organisation.Id, role = "business" });
        Assert.Equal(HttpStatusCode.NoContent, grant.StatusCode);

        var members = await admin.GetFromJsonAsync<JsonElement>($"/organisations/{organisation.Id}/members");
        var member = Assert.Single(members.EnumerateArray());
        Assert.Equal(target.Email, member.GetProperty("email").GetString());
        Assert.Equal("business", member.GetProperty("role").GetString());

        var revoke = await admin.PostAsJsonAsync("/admin/grants", new { email = target.Email, organisationId = (string?)null, role = "buyer" });
        Assert.Equal(HttpStatusCode.NoContent, revoke.StatusCode);
        var stored = await _factory.DbAsync(db => db.Users.SingleAsync(u => u.Id == target.Id));
        Assert.Equal(Roles.Buyer, stored.Role);
        Assert.Null(stored.OrganisationId);
    }

    [Fact]
    public async Task Grant_rejects_unknown_users_and_admin_role()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var (_, target) = await _factory.SignInAsync();

        var unknown = await admin.PostAsJsonAsync("/admin/grants", new { email = "nobody@test.local", organisationId = organisation.Id, role = "business" });
        var toAdmin = await admin.PostAsJsonAsync("/admin/grants", new { email = target.Email, organisationId = organisation.Id, role = "admin" });

        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal("Kullanıcı bulunamadı.", await unknown.DetailAsync());
        Assert.Equal(HttpStatusCode.BadRequest, toAdmin.StatusCode);
        Assert.Equal("Geçersiz rol.", await toAdmin.DetailAsync());
    }

    [Fact]
    public async Task A_business_may_change_only_its_own_organisation_images()
    {
        var own = await _factory.CreateOrganisationAsync();
        var other = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, own.Id);

        HttpContent Form()
        {
            var file = new ByteArrayContent([1, 2, 3]);
            file.Headers.ContentType = new MediaTypeHeaderValue("image/webp");
            return new MultipartFormDataContent { { file, "file", "logo" } };
        }

        var mine = await business.PostAsync($"/organisations/{own.Id}/images/avatar", Form());
        var theirs = await business.PostAsync($"/organisations/{other.Id}/images/avatar", Form());

        Assert.Equal(HttpStatusCode.OK, mine.StatusCode);
        Assert.Contains($"/uploads/organisations/{own.Id}/avatar.webp?v=",
            (await mine.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("publicUrl").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, theirs.StatusCode);
        Assert.Equal("Bu kurumun görselini değiştirme yetkiniz yok.", await theirs.DetailAsync());
    }
}
```

- [ ] **Adım 3: Derlenip başarısız olduğunu doğrula**

Çalıştır: `dotnet test --filter "FullyQualifiedName~OrganisationTests"`
Beklenen: Derlenir (yeni test yardımcıları var) ama testler FAIL olur. Örneğin `/organisations` henüz yok, 404 döner.

- [ ] **Adım 4: `Organisations/OrganisationEndpoints.cs`**

```csharp
using System.Security.Claims;
using System.Text.RegularExpressions;
using GidaKoprusu.Api.Auth;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Organisations;

// Same field names as toOrganisation() in src/lib/data.js.
public record OrganisationDto(
    string Id, string Name, string Kind, string Status, string? Type, string? Avatar, string? Cover,
    string? Address, double? Lat, double? Lng, int TrustScore, decimal TotalDonatedKg, decimal? Rating,
    int ReviewCount, string? Phone)
{
    public static OrganisationDto From(Organisation o) => new(
        o.Id, o.Name, o.Kind, o.Status, o.Type, o.Avatar, o.Cover, o.Address, o.Lat, o.Lng,
        o.TrustScore, o.TotalDonatedKg, o.Rating, o.ReviewCount, o.Phone);
}

// No trust score, rating or review count here: those are derived from orders and reviews and
// must not be settable by anyone, admins included.
public record CreateOrganisationRequest(
    string? Id, string? Name, string? Kind, string? Type, string? Avatar, string? Cover,
    string? Address, string? Phone, double? Lat, double? Lng);

public record OrganisationStatusRequest(string? Status);

public record GrantRequest(string? Email, string? OrganisationId, string? Role);

public static partial class OrganisationEndpoints
{
    // The id becomes a folder name under uploads/, so it is restricted to a safe slug.
    [GeneratedRegex("^[a-z0-9_-]{1,64}$")]
    private static partial Regex IdPattern();

    public static void MapOrganisationEndpoints(this IEndpointRouteBuilder app)
    {
        // Browsing sees active organisations; only admins see the pending and suspended ones.
        app.MapGet("/organisations", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var query = db.Organisations.AsQueryable();
            if (principal.Role() != Roles.Admin)
                query = query.Where(o => o.Status == OrganisationStatuses.Active);
            var rows = await query.OrderBy(o => o.Name).ToListAsync(ct);
            return rows.Select(OrganisationDto.From);
        });

        var admin = app.MapGroup("").RequireAuthorization(policy => policy.RequireRole(Roles.Admin));

        admin.MapPost("/organisations", async (CreateOrganisationRequest body, AppDbContext db, TimeProvider clock, CancellationToken ct) =>
        {
            if (body.Id is null || !IdPattern().IsMatch(body.Id))
                throw AppException.BadRequest("Kurum kimliği yalnızca küçük harf, rakam, - ve _ içerebilir.");
            if (string.IsNullOrWhiteSpace(body.Name))
                throw AppException.BadRequest("Kurum adı gerekli.");
            if (body.Kind is not (OrganisationKinds.Business or OrganisationKinds.Ngo))
                throw AppException.BadRequest("Kurum türü business veya ngo olmalı.");
            if (await db.Organisations.AnyAsync(o => o.Id == body.Id, ct))
                throw AppException.Conflict("Bu kimlikte bir kurum zaten var.");

            // An admin adds it by hand, so it starts active; the owner account is bound later
            // through /admin/grants.
            var organisation = new Organisation
            {
                Id = body.Id,
                Name = body.Name.Trim(),
                Kind = body.Kind!,
                Status = OrganisationStatuses.Active,
                Type = body.Type,
                Avatar = body.Avatar,
                Cover = body.Cover,
                Address = body.Address,
                Phone = body.Phone,
                Lat = body.Lat,
                Lng = body.Lng,
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };
            db.Organisations.Add(organisation);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (DbErrors.IsUniqueViolation(ex))
            {
                throw AppException.Conflict("Bu kimlikte bir kurum zaten var.");
            }
            return Results.Created($"/organisations/{organisation.Id}", OrganisationDto.From(organisation));
        });

        admin.MapPatch("/organisations/{id}/status", async (string id, OrganisationStatusRequest body, AppDbContext db, CancellationToken ct) =>
        {
            if (body.Status is not (OrganisationStatuses.Pending or OrganisationStatuses.Active or OrganisationStatuses.Suspended))
                throw AppException.BadRequest("Geçersiz kurum durumu.");
            var organisation = await db.Organisations.FindAsync([id], ct) ?? throw AppException.NotFound("Kurum bulunamadı.");
            organisation.Status = body.Status!;
            await db.SaveChangesAsync(ct);
            return OrganisationDto.From(organisation);
        });

        admin.MapGet("/organisations/{id}/members", async (string id, AppDbContext db, CancellationToken ct) =>
            await db.Users
                .Where(u => u.OrganisationId == id)
                .OrderBy(u => u.Email)
                .Select(u => new { email = u.Email, role = u.Role })
                .ToListAsync(ct));

        // Admin is deliberately not a grantable role: admins are created from configuration.
        admin.MapPost("/admin/grants", async (GrantRequest body, AppDbContext db, CancellationToken ct) =>
        {
            if (body.Role is not (Roles.Buyer or Roles.Business or Roles.Ngo))
                throw AppException.BadRequest("Geçersiz rol.");

            var email = OtpService.Normalize(body.Email);
            var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct)
                ?? throw AppException.NotFound("Kullanıcı bulunamadı.");

            if (body.Role == Roles.Buyer)
            {
                user.Role = Roles.Buyer;
                user.OrganisationId = null;
            }
            else
            {
                if (!await db.Organisations.AnyAsync(o => o.Id == body.OrganisationId, ct))
                    throw AppException.NotFound("Kurum bulunamadı.");
                user.Role = body.Role!;
                user.OrganisationId = body.OrganisationId;
            }
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // The admin may change any organisation's pictures, a business or NGO only its own.
        app.MapPost("/organisations/{id}/images/{kind}", async (string id, string kind, IFormFile file, HttpRequest request,
            ClaimsPrincipal principal, AppDbContext db, Uploads uploads, CancellationToken ct) =>
        {
            var role = principal.Role();
            var allowed = role == Roles.Admin
                || ((role is Roles.Business or Roles.Ngo) && principal.OrganisationId() == id);
            if (!allowed)
                throw AppException.Forbidden("Bu kurumun görselini değiştirme yetkiniz yok.");
            if (kind is not ("avatar" or "cover"))
                throw AppException.BadRequest("Geçersiz görsel türü.");

            var organisation = await db.Organisations.FindAsync([id], ct) ?? throw AppException.NotFound("Kurum bulunamadı.");
            var url = await uploads.SaveImageAsync(file, $"organisations/{id}", kind, request, ct);
            if (kind == "avatar")
                organisation.Avatar = url;
            else
                organisation.Cover = url;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { publicUrl = url });
        }).RequireAuthorization().DisableAntiforgery();
    }
}
```

- [ ] **Adım 5: `Program.cs` dosyasına kurum uçlarını bağla**

`Program.cs` dosyasında `using GidaKoprusu.Api.Data;` satırının altına şunu ekle:

```csharp
using GidaKoprusu.Api.Organisations;
```

`app.MapProfileEndpoints();` satırının altına şunu ekle:

```csharp
app.MapOrganisationEndpoints();
```

- [ ] **Adım 6: Testleri koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~OrganisationTests"`
Beklenen: `Passed: 8`.

---

### Task 2: İlan uçları ve arşivleme (TDD)

**Dosyalar:**
- Oluştur: `Listings/ListingEndpoints.cs`, `tests/.../ListingTests.cs`
- Değiştir: `Program.cs`

**Arayüzler:**
- Tüketir: `IstanbulTime.PickupInstant`, `IstanbulTime.IsClockTime`, `ClaimsExtensions`, `TestData`.
- Üretir:
  - `ListingDto.From(Listing)`. Listing'in `Organisation` alanı Include ile yüklenmiş olmalı.
  - `ListingRules.IsExpired(Listing, DateTime nowUtc) : bool`
  - `ListingRules.ArchiveExpiredAsync(AppDbContext, DateTime nowUtc, CancellationToken) : Task`
  - `MapListingEndpoints()`
  - Bölüm 4 `ListingRules.IsExpired` fonksiyonunu kullanacak.

- [ ] **Adım 1: Failing test: `tests/GidaKoprusu.Api.Tests/ListingTests.cs`**

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ListingTests
{
    private readonly ApiFactory _factory;

    public ListingTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static object NewListing(int portions = 4) => new
    {
        title = "Akşam Poğaçası",
        description = "Karışık paket",
        category = "Unlu Mamüller",
        type = "discounted",
        priceOriginal = 120,
        priceDiscounted = 30,
        portions,
        pickupStartTime = "18:00",
        pickupEndTime = "21:00",
        image = "https://example.com/p.jpg",
        allergens = new[] { "Gluten" },
        lat = 40.18,
        lng = 29.06,
        weightKg = 2,
        co2ReductionKg = 5,
    };

    private static async Task<List<string>> IdsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonElement>("/listings"))
            .EnumerateArray().Select(l => l.GetProperty("id").GetString()!).ToList();

    [Fact]
    public async Task A_business_creates_a_listing_for_its_own_organisation()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var response = await business.PostAsJsonAsync("/listings", NewListing(portions: 4));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var listing = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(organisation.Id, listing.GetProperty("businessId").GetString());
        Assert.Equal("Test Kurum", listing.GetProperty("businessName").GetString());
        Assert.Equal(4, listing.GetProperty("portionsTotal").GetInt32());
        Assert.Equal(4, listing.GetProperty("portionsAvailable").GetInt32());
        Assert.Equal(75, listing.GetProperty("discountPercentage").GetInt32());
        Assert.Equal("Gluten", listing.GetProperty("allergens")[0].GetString());
        Assert.Equal("active", listing.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Buyers_and_ngos_cannot_create_listings()
    {
        var ngo = await _factory.CreateOrganisationAsync(OrganisationKinds.Ngo);
        var (buyer, _) = await _factory.SignInAsync();
        var (ngoUser, _) = await _factory.SignInAsync(Roles.Ngo, ngo.Id);

        var byBuyer = await buyer.PostAsJsonAsync("/listings", NewListing());
        var byNgo = await ngoUser.PostAsJsonAsync("/listings", NewListing());

        Assert.Equal(HttpStatusCode.Forbidden, byBuyer.StatusCode);
        Assert.Equal("Yalnızca işletme hesapları ilan açabilir.", await byBuyer.DetailAsync());
        Assert.Equal(HttpStatusCode.Forbidden, byNgo.StatusCode);
    }

    [Fact]
    public async Task Listing_validation_rejects_bad_input()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var noPortions = await business.PostAsJsonAsync("/listings", new { title = "X", portions = 0 });
        var badTime = await business.PostAsJsonAsync("/listings", new { title = "X", portions = 1, pickupStartTime = "6pm" });

        Assert.Equal("Porsiyon sayısı en az 1 olmalı.", await noPortions.DetailAsync());
        Assert.Equal("Teslim saati SS:dd biçiminde olmalı.", await badTime.DetailAsync());
    }

    [Fact]
    public async Task Only_the_owning_business_edits_or_archives_a_listing()
    {
        var own = await _factory.CreateOrganisationAsync();
        var other = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(own.Id);
        var (owner, _) = await _factory.SignInAsync(Roles.Business, own.Id);
        var (stranger, _) = await _factory.SignInAsync(Roles.Business, other.Id);

        var strangerEdit = await stranger.PatchAsJsonAsync($"/listings/{listing.Id}/portions", new { portionsAvailable = 0 });
        Assert.Equal(HttpStatusCode.Forbidden, strangerEdit.StatusCode);
        Assert.Equal("Bu ilan üzerinde yetkiniz yok.", await strangerEdit.DetailAsync());

        var ownerEdit = await owner.PatchAsJsonAsync($"/listings/{listing.Id}/portions", new { portionsAvailable = 2 });
        Assert.Equal(HttpStatusCode.OK, ownerEdit.StatusCode);
        Assert.Equal(2, (await ownerEdit.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("portionsAvailable").GetInt32());

        var archive = await owner.PostAsync($"/listings/{listing.Id}/archive", null);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);
        Assert.DoesNotContain(listing.Id.ToString(), await IdsAsync(owner));
    }

    [Fact]
    public async Task Get_listings_archives_listings_whose_pickup_window_has_closed()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var open = await _factory.CreateListingAsync(organisation.Id, pickupStart: "13:00", pickupEnd: "18:00");
        var closed = await _factory.CreateListingAsync(organisation.Id, pickupStart: "09:00", pickupEnd: "11:00");
        var (buyer, _) = await _factory.SignInAsync();

        var ids = await IdsAsync(buyer);

        Assert.Contains(open.Id.ToString(), ids);
        Assert.DoesNotContain(closed.Id.ToString(), ids);
        var status = await _factory.DbAsync(db => db.Listings.Where(l => l.Id == closed.Id).Select(l => l.Status).SingleAsync());
        Assert.Equal(ListingStatuses.Archived, status);
    }

    [Fact]
    public async Task Listings_of_a_pending_organisation_are_visible_only_to_that_organisation()
    {
        var pending = await _factory.CreateOrganisationAsync(status: OrganisationStatuses.Pending);
        var listing = await _factory.CreateListingAsync(pending.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var (owner, _) = await _factory.SignInAsync(Roles.Business, pending.Id);

        Assert.DoesNotContain(listing.Id.ToString(), await IdsAsync(buyer));
        Assert.Contains(listing.Id.ToString(), await IdsAsync(owner));
    }
}
```

- [ ] **Adım 2: Başarısız olduğunu doğrula**

Çalıştır: `dotnet test --filter "FullyQualifiedName~ListingTests"`
Beklenen: FAIL, çünkü `/listings` 404 döner.

- [ ] **Adım 3: `Listings/ListingEndpoints.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Listings;

// Same field names as toListing() in src/lib/data.js. pickupDate and distanceKm are purely
// presentational and stay in the frontend.
public record ListingDto(
    Guid Id, string BusinessId, string BusinessName, string BusinessAvatar, string Title, string Description,
    string? Category, string Type, decimal PriceOriginal, decimal PriceDiscounted, int DiscountPercentage,
    int PortionsTotal, int PortionsAvailable, string? PickupStartTime, string? PickupEndTime, string? Image,
    List<string> Allergens, double? Lat, double? Lng, decimal WeightKg, decimal Co2ReductionKg, string Status,
    DateTime CreatedAt)
{
    public static ListingDto From(Listing l) => new(
        l.Id,
        l.OrganisationId,
        l.Organisation?.Name ?? "",
        l.Organisation?.Avatar ?? "",
        l.Title,
        l.Description ?? "",
        l.Category,
        l.Type,
        l.PriceOriginal,
        l.PriceDiscounted,
        l.PriceOriginal == 0 ? 100 : (int)Math.Round((1 - l.PriceDiscounted / l.PriceOriginal) * 100, MidpointRounding.AwayFromZero),
        l.PortionsTotal,
        l.PortionsAvailable,
        l.PickupStartTime,
        l.PickupEndTime,
        l.Image,
        l.Allergens,
        l.Lat,
        l.Lng,
        l.WeightKg,
        l.Co2ReductionKg,
        l.Status,
        l.CreatedAt);
}

public record CreateListingRequest(
    string? Title, string? Description, string? Category, string? Type, decimal PriceOriginal,
    decimal PriceDiscounted, int Portions, string? PickupStartTime, string? PickupEndTime, string? Image,
    List<string>? Allergens, double? Lat, double? Lng, decimal WeightKg, decimal Co2ReductionKg);

public record PortionsRequest(int PortionsAvailable);

public static class ListingRules
{
    // A listing is for the day it was created and closes at its pickup end time (Istanbul).
    public static bool IsExpired(Listing listing, DateTime nowUtc) =>
        IstanbulTime.PickupInstant(listing.CreatedAt, listing.PickupEndTime) < nowUtc;

    // ponytail: loads every active listing to compare pickup times in C#. Fine for a course-sized
    // table; move the comparison into SQL if active listings reach the thousands.
    public static async Task ArchiveExpiredAsync(AppDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var active = await db.Listings
            .Where(l => l.Status == ListingStatuses.Active)
            .Select(l => new { l.Id, l.CreatedAt, l.PickupEndTime })
            .ToListAsync(ct);
        var expired = active
            .Where(l => IstanbulTime.PickupInstant(l.CreatedAt, l.PickupEndTime) < nowUtc)
            .Select(l => l.Id)
            .ToList();
        if (expired.Count == 0)
            return;

        await db.Listings
            .Where(l => expired.Contains(l.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.Status, ListingStatuses.Archived), ct);
    }
}

public static class ListingEndpoints
{
    public static void MapListingEndpoints(this IEndpointRouteBuilder app)
    {
        // Active listings of active organisations, plus everything active of the caller's own
        // organisation (so a pending business still sees what it published).
        app.MapGet("/listings", async (ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct) =>
        {
            await ListingRules.ArchiveExpiredAsync(db, clock.GetUtcNow().UtcDateTime, ct);

            var organisationId = principal.OrganisationId();
            var query = db.Listings.Include(l => l.Organisation).Where(l => l.Status == ListingStatuses.Active);
            if (principal.Role() != Roles.Admin)
                query = query.Where(l => l.Organisation.Status == OrganisationStatuses.Active || l.OrganisationId == organisationId);

            var rows = await query.OrderByDescending(l => l.CreatedAt).ToListAsync(ct);
            return rows.Select(ListingDto.From);
        });

        var group = app.MapGroup("/listings").RequireAuthorization();

        group.MapPost("", async (CreateListingRequest body, ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct) =>
        {
            if (principal.Role() != Roles.Business || principal.OrganisationId() is not { } organisationId)
                throw AppException.Forbidden("Yalnızca işletme hesapları ilan açabilir.");
            if (string.IsNullOrWhiteSpace(body.Title))
                throw AppException.BadRequest("İlan başlığı gerekli.");
            if (body.Portions < 1)
                throw AppException.BadRequest("Porsiyon sayısı en az 1 olmalı.");
            var type = body.Type ?? ListingTypes.Discounted;
            if (type is not (ListingTypes.Free or ListingTypes.Discounted or ListingTypes.Bulk))
                throw AppException.BadRequest("Geçersiz ilan türü.");
            if ((body.PickupStartTime is not null && !IstanbulTime.IsClockTime(body.PickupStartTime))
                || (body.PickupEndTime is not null && !IstanbulTime.IsClockTime(body.PickupEndTime)))
                throw AppException.BadRequest("Teslim saati SS:dd biçiminde olmalı.");
            if (body.PriceOriginal < 0 || body.PriceDiscounted < 0 || body.WeightKg < 0)
                throw AppException.BadRequest("Fiyat ve ağırlık negatif olamaz.");

            var listing = new Listing
            {
                OrganisationId = organisationId,
                Title = body.Title.Trim(),
                Description = body.Description,
                Category = body.Category,
                Type = type,
                PriceOriginal = body.PriceOriginal,
                PriceDiscounted = body.PriceDiscounted,
                PortionsTotal = body.Portions,
                PortionsAvailable = body.Portions,
                PickupStartTime = body.PickupStartTime,
                PickupEndTime = body.PickupEndTime,
                Image = body.Image,
                Allergens = body.Allergens ?? [],
                Lat = body.Lat,
                Lng = body.Lng,
                WeightKg = body.WeightKg,
                Co2ReductionKg = body.Co2ReductionKg,
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };
            db.Listings.Add(listing);
            await db.SaveChangesAsync(ct);
            await db.Entry(listing).Reference(l => l.Organisation).LoadAsync(ct);
            return Results.Created($"/listings/{listing.Id}", ListingDto.From(listing));
        });

        group.MapPatch("/{id:guid}/portions", async (Guid id, PortionsRequest body, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            if (body.PortionsAvailable < 0)
                throw AppException.BadRequest("Porsiyon sayısı negatif olamaz.");
            var listing = await LoadOwnedAsync(db, principal, id, ct);
            listing.PortionsAvailable = body.PortionsAvailable;
            await db.SaveChangesAsync(ct);
            return ListingDto.From(listing);
        });

        group.MapPost("/{id:guid}/archive", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var listing = await LoadOwnedAsync(db, principal, id, ct);
            listing.Status = ListingStatuses.Archived;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
    }

    private static async Task<Listing> LoadOwnedAsync(AppDbContext db, ClaimsPrincipal principal, Guid id, CancellationToken ct)
    {
        var listing = await db.Listings.Include(l => l.Organisation).FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw AppException.NotFound("İlan bulunamadı.");
        if (principal.Role() != Roles.Business || principal.OrganisationId() != listing.OrganisationId)
            throw AppException.Forbidden("Bu ilan üzerinde yetkiniz yok.");
        return listing;
    }
}
```

- [ ] **Adım 4: `Program.cs` dosyasına ilan uçlarını bağla**

`using GidaKoprusu.Api.Organisations;` satırının altına:

```csharp
using GidaKoprusu.Api.Listings;
```

`app.MapOrganisationEndpoints();` satırının altına:

```csharp
app.MapListingEndpoints();
```

- [ ] **Adım 5: Tüm testleri koş**

Çalıştır: `dotnet test`
Beklenen: `Passed!  - Failed: 0, Passed: 40` (26 + 8 Organisation + 6 Listing).

Hata ayıklama ipuçları:
- `NewListing(portions: 4)`'da `discountPercentage` 75 değilse: `(1 - 30/120) * 100 = 75` olmalı. decimal bölmeyi kontrol et.
- Bu bölümde şema değişmedi, migration **gerekmez**.

---

## Bölüm sonu

- [ ] `dotnet test` → 40 test geçmeli.
- [ ] `DURUM.md` içinde 3. satırı `✅ Tamam` yap. "Sıradaki tek iş": `Bölüm 4: docs/superpowers/plans/2026-10-08-backend-bolum-4-rezervasyon.md`.
- [ ] Commit mesajı öner: `feat(api): organisation and listing endpoints with ownership checks and expiry archiving`
- [ ] **Mülakat soruları:**
  1. 401 ile 403 arasındaki fark ne? Testlerde ikisini de nerede görüyoruz? [401: kimlik yok (anonim istek). 403: kimlik var ama yetki yok (buyer'ın admin ucunu çağırması). `Only_admins_create_organisations...` testinde ikisi de var.]
  2. Giriş yapmamış biri `GET /listings` çağırdığında `l.OrganisationId == organisationId` ifadesi (organisationId null iken) hangi SQL'e çevrilir? [EF C# null anlamını korur: `organisation_id IS NULL` üretir, bu da hiçbir satırda doğru olmaz.]
  3. Arşivleme neden C# tarafında yapılıyor, tavanı ne? [Teslim saati `HH:mm` metni ve Istanbul gününe göre hesaplanıyor, C#'ta daha okunur. Tavanı: tüm aktif ilanlar belleğe çekiliyor. Binlerce ilanda bu hesap SQL'e taşınmalı.]
  4. Kurum id'sine neden regex koyduk? [Id, `uploads/organisations/{id}` klasör adı oluyor. `../` gibi değerler path traversal açığı yaratırdı.]
  5. Görsel yükleme uçlarında `DisableAntiforgery` neden güvenli? [Kimlik doğrulama Bearer token ile yapılıyor ve tarayıcı bunu otomatik göndermiyor. Cookie olmadığı için CSRF riski yok.]
