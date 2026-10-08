# Bölüm 1: İskelet Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma**, commit'i bölüm sonunda Nazım atar.

**Hedef:** `api/` altında derlenen, PostgreSQL'e bağlanan, şemayı migration ile kuran ve gerçek DB'de koşan test altyapısı hazır bir .NET 9 Minimal API iskeleti.

**Mimari:** Tek web projesi (`GidaKoprusu.Api`) ve tek test projesi. EF Core + Npgsql kullanılır. Tablo ve sütun adları snake_case. Hatalar `AppException` ile fırlatılıp ProblemDetails'e çevrilir. Saat `TimeProvider` üzerinden alınır. Testler Testcontainers ile gerçek Postgres'e karşı `WebApplicationFactory` üzerinden HTTP seviyesinde koşar.

**Teknoloji:** .NET 9, ASP.NET Core Minimal API, EF Core 9, Npgsql, xUnit, Testcontainers, Docker Compose.

## Global Kısıtlar

- Hedef framework `net9.0`, kurulu SDK 9.0.316.
- Paket sürümleri sabit:
  - API: `Npgsql.EntityFrameworkCore.PostgreSQL` 9.0.4, `Microsoft.EntityFrameworkCore.Design` 9.0.20, `Microsoft.AspNetCore.Authentication.JwtBearer` 9.0.20.
  - Test: `Microsoft.AspNetCore.Mvc.Testing` 9.0.20, `Microsoft.NET.Test.Sdk` 17.14.1, `Testcontainers.PostgreSql` 4.15.0, `xunit` 2.9.3, `xunit.runner.visualstudio` 3.1.5.
  - Araç: `dotnet-ef` 9.0.20.
  - **Başka paket ekleme.**
- Repo kökü `C:\Users\pc\OneDrive\Masaüstü\projeler\sosyalSorumluluk`, branch `backend-dotnet`. Komutlar aksi yazılmadıkça `api/` klasöründe çalışır. Bash'te: `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api"`.
- Kod tanımlayıcıları ve yorumları İngilizce. Kullanıcıya dönen mesajlar Türkçe ve **plandaki metinle birebir aynı**.
- DB tablo ve sütun adları snake_case. Bunu `AppDbContext` içindeki dönüştürücü yapar.
- İş kuralı hataları `AppException` fırlatılarak döner. Endpoint içinde `Results.Problem` yalnızca `/health` için kullanılır.
- Uygulama kodunda `DateTime.UtcNow` kullanılmaz, saat `TimeProvider`'dan alınır. Tek istisna `TokenService` (Bölüm 2).
- Testler Docker ister. Docker Desktop açık olmalı.
- **Commit atma.** git'te yalnızca `status` ve `diff` çalıştır.
- Spec: `docs/superpowers/specs/2026-10-08-dotnet-backend-design.md`.

## Başlamadan önce

- [ ] `C:\Users\pc\OneDrive\Masaüstü\planlar\DURUM.md` dosyasını ve spec'i oku.
- [ ] Branch'i doğrula: `git -C "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk" branch --show-current` komutunun çıktısı `backend-dotnet` olmalı.
- [ ] Docker'ı doğrula: `docker info --format '{{.ServerVersion}}'` bir sürüm basmalı. Basmıyorsa Nazım'dan Docker Desktop'ı açmasını iste ve bekle.

## Dosya haritası

```
api/
  .gitignore
  docker-compose.yml                      db servisi
  GidaKoprusu.sln
  .config/dotnet-tools.json               dotnet-ef aracı
  src/GidaKoprusu.Api/
    GidaKoprusu.Api.csproj
    Program.cs                            servis kayıtları, middleware, /health, açılışta migration
    appsettings.json
    appsettings.Development.json
    Properties/launchSettings.json        http://localhost:5080
    Common/AppException.cs                AppException + AppExceptionHandler (ProblemDetails)
    Common/DbErrors.cs                    unique violation tespiti
    Common/IstanbulTime.cs                HH:mm teslim saatini UTC ana çevirir
    Data/Entities.cs                      entity'ler + rol/durum sabitleri
    Data/AppDbContext.cs                  model, kısıtlar, snake_case
    Data/DesignTimeFactory.cs             dotnet ef için
    Data/Migrations/*                     dotnet ef üretir
  tests/GidaKoprusu.Api.Tests/
    GidaKoprusu.Api.Tests.csproj
    TestClock.cs                          kontrol edilebilir saat
    ApiFactory.cs                         Testcontainers + WebApplicationFactory
    ApiCollection.cs                      tüm DB testleri tek koleksiyonda (sıralı)
    IstanbulTimeTests.cs
    HealthTests.cs
    SchemaTests.cs
```

---

### Task 1: Solution, projeler ve veritabanı container'ı

**Dosyalar:**
- Oluştur: `api/GidaKoprusu.sln`, `api/src/GidaKoprusu.Api/*`, `api/tests/GidaKoprusu.Api.Tests/*`, `api/.gitignore`, `api/docker-compose.yml`, `api/.config/dotnet-tools.json`

**Arayüzler:**
- Üretir: `GidaKoprusu.Api` (namespace kökü), `GidaKoprusu.Api.Tests`. DB `localhost:5433`, veritabanı adı `gidakoprusu`, kullanıcı ve parola `postgres`/`postgres`.

- [ ] **Adım 1: Projeleri template'ten üret**

```bash
cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk"
mkdir -p api && cd api
dotnet new sln --name GidaKoprusu
dotnet new web --name GidaKoprusu.Api --output src/GidaKoprusu.Api --framework net9.0
dotnet new xunit --name GidaKoprusu.Api.Tests --output tests/GidaKoprusu.Api.Tests --framework net9.0
dotnet sln GidaKoprusu.sln add src/GidaKoprusu.Api/GidaKoprusu.Api.csproj tests/GidaKoprusu.Api.Tests/GidaKoprusu.Api.Tests.csproj
rm tests/GidaKoprusu.Api.Tests/UnitTest1.cs
dotnet new tool-manifest
dotnet tool install dotnet-ef --version 9.0.20
```

Beklenen: Her komut hatasız biter. `api/.config/dotnet-tools.json` dosyası oluşur.

- [ ] **Adım 2: API csproj içeriğini değiştir**

`api/src/GidaKoprusu.Api/GidaKoprusu.Api.csproj` dosyasının tamamı şu olacak:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>GidaKoprusu.Api</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.20" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.20">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.4" />
  </ItemGroup>

</Project>
```

- [ ] **Adım 3: Test csproj içeriğini değiştir**

`api/tests/GidaKoprusu.Api.Tests/GidaKoprusu.Api.Tests.csproj` dosyasının tamamı:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.20" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="Testcontainers.PostgreSql" Version="4.15.0" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\GidaKoprusu.Api\GidaKoprusu.Api.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>

</Project>
```

- [ ] **Adım 4: `api/.gitignore`**

```gitignore
bin/
obj/
.vs/
*.user
uploads/
TestResults/
```

- [ ] **Adım 5: `api/src/GidaKoprusu.Api/Properties/launchSettings.json`**

Dosyanın tamamı:

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5080",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

- [ ] **Adım 6: `api/docker-compose.yml`**

```yaml
# Local development database. The password is for this machine only; never reuse it.
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

volumes:
  gk_pgdata:
```

- [ ] **Adım 7: DB'yi kaldır ve derle**

```bash
docker compose up -d db
docker compose ps
dotnet build
```

Beklenen:
- `docker compose ps` çıktısında `db` servisi `healthy` görünür. İlk açılışta 10-20 saniye sürebilir, `healthy` olana kadar `docker compose ps` komutunu tekrar çalıştır.
- `dotnet build` komutu `Build succeeded` ile biter. Template'in Program.cs dosyası henüz yerinde.

---

### Task 2: Ortak yardımcılar ve Istanbul saati (TDD)

**Dosyalar:**
- Oluştur: `api/src/GidaKoprusu.Api/Common/AppException.cs`, `Common/DbErrors.cs`, `Common/IstanbulTime.cs`
- Test: `api/tests/GidaKoprusu.Api.Tests/IstanbulTimeTests.cs`

**Arayüzler:**
- Üretir:
  - `AppException(int status, string detail)`, `.Status`, statik `BadRequest/Forbidden/NotFound/Conflict(string detail)`
  - `AppExceptionHandler : IExceptionHandler`
  - `DbErrors.IsUniqueViolation(DbUpdateException) : bool`
  - `IstanbulTime.Offset : TimeSpan`, `IstanbulTime.PickupInstant(DateTime createdAtUtc, string? hhmm) : DateTime?`, `IstanbulTime.IsClockTime(string? hhmm) : bool`

- [ ] **Adım 1: Failing test yaz**

`api/tests/GidaKoprusu.Api.Tests/IstanbulTimeTests.cs`:

```csharp
using GidaKoprusu.Api.Common;

namespace GidaKoprusu.Api.Tests;

public class IstanbulTimeTests
{
    [Fact]
    public void Pickup_instant_is_the_wall_clock_time_in_istanbul_as_utc()
    {
        var created = new DateTime(2026, 10, 8, 9, 0, 0, DateTimeKind.Utc); // 12:00 in Istanbul

        Assert.Equal(new DateTime(2026, 10, 8, 10, 0, 0, DateTimeKind.Utc), IstanbulTime.PickupInstant(created, "13:00"));
    }

    [Fact]
    public void Pickup_instant_uses_the_istanbul_calendar_day_not_the_utc_one()
    {
        var created = new DateTime(2026, 10, 8, 22, 30, 0, DateTimeKind.Utc); // 01:30 on 9 October in Istanbul

        Assert.Equal(new DateTime(2026, 10, 9, 6, 0, 0, DateTimeKind.Utc), IstanbulTime.PickupInstant(created, "09:00"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("25:00")]
    [InlineData("1300")]
    [InlineData("abc")]
    public void Pickup_instant_is_null_for_a_missing_or_malformed_time(string? hhmm)
    {
        Assert.Null(IstanbulTime.PickupInstant(new DateTime(2026, 10, 8, 9, 0, 0, DateTimeKind.Utc), hhmm));
    }

    [Theory]
    [InlineData("00:00", true)]
    [InlineData("23:59", true)]
    [InlineData("24:00", false)]
    [InlineData(null, false)]
    public void Is_clock_time_accepts_only_hh_mm(string? value, bool expected)
    {
        Assert.Equal(expected, IstanbulTime.IsClockTime(value));
    }
}
```

- [ ] **Adım 2: Testin derlenmediğini doğrula**

Çalıştır: `dotnet build tests/GidaKoprusu.Api.Tests`
Beklenen: Derleme hatası, `The name 'IstanbulTime' does not exist` veya `The type or namespace name 'Common' does not exist`.

- [ ] **Adım 3: `Common/IstanbulTime.cs` yaz**

```csharp
using System.Globalization;

namespace GidaKoprusu.Api.Common;

// ponytail: Turkey has used a fixed UTC+3 offset with no daylight saving since 2016, so a
// constant is exact. Switch to TimeZoneInfo if that ever changes.
public static class IstanbulTime
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(3);

    // Mirrors pickup_instant() in supabase/pickup-window.sql: the HH:mm wall-clock time on the
    // Istanbul calendar day of `createdAtUtc`, returned as a UTC instant. Null when the time is
    // missing or malformed, which callers treat as "no deadline".
    public static DateTime? PickupInstant(DateTime createdAtUtc, string? hhmm)
    {
        if (!TryParseClock(hhmm, out var time))
            return null;

        var localDay = DateOnly.FromDateTime(createdAtUtc + Offset);
        return DateTime.SpecifyKind(localDay.ToDateTime(time) - Offset, DateTimeKind.Utc);
    }

    public static bool IsClockTime(string? hhmm) => TryParseClock(hhmm, out _);

    private static bool TryParseClock(string? hhmm, out TimeOnly time) =>
        TimeOnly.TryParseExact(hhmm, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
}
```

- [ ] **Adım 4: `Common/AppException.cs` yaz**

```csharp
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GidaKoprusu.Api.Common;

// Thrown for every expected failure (validation, permission, business rule). The handler
// below turns it into a ProblemDetails response whose `detail` is the Turkish message the
// frontend shows as-is.
public sealed class AppException(int status, string detail) : Exception(detail)
{
    public int Status { get; } = status;

    public static AppException BadRequest(string detail) => new(StatusCodes.Status400BadRequest, detail);
    public static AppException Forbidden(string detail) => new(StatusCodes.Status403Forbidden, detail);
    public static AppException NotFound(string detail) => new(StatusCodes.Status404NotFound, detail);
    public static AppException Conflict(string detail) => new(StatusCodes.Status409Conflict, detail);
}

public sealed class AppExceptionHandler(IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not AppException app)
            return false;

        context.Response.StatusCode = app.Status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = app.Status, Detail = app.Message },
        });
    }
}
```

- [ ] **Adım 5: `Common/DbErrors.cs` yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GidaKoprusu.Api.Common;

public static class DbErrors
{
    public static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
```

- [ ] **Adım 6: Testleri koş**

Çalıştır: `dotnet test --filter "FullyQualifiedName~IstanbulTimeTests"`
Beklenen: `Passed!  - Failed: 0, Passed: 11` (2 fact + 5 + 4 theory satırı).

---

### Task 3: Veri modeli, Program.cs, migration ve test altyapısı (TDD)

**Dosyalar:**
- Oluştur: `Data/Entities.cs`, `Data/AppDbContext.cs`, `Data/DesignTimeFactory.cs`, `Data/Migrations/*` (araç üretir)
- Değiştir: `Program.cs`, `appsettings.json`, `appsettings.Development.json` (dosyaların tamamı değişir)
- Test: `TestClock.cs`, `ApiFactory.cs`, `ApiCollection.cs`, `HealthTests.cs`, `SchemaTests.cs`

**Arayüzler:**
- Tüketir: Task 2'deki `AppException`, `AppExceptionHandler`.
- Üretir:
  - Entity sınıfları: `User`, `OtpCode`, `Organisation`, `Listing`, `Reservation`, `Review`.
  - Sabitler: `Roles.{Buyer,Business,Ngo,Admin}`, `OrganisationKinds.{Business,Ngo}`, `OrganisationStatuses.{Pending,Active,Suspended}`, `ListingTypes.{Free,Discounted,Bulk}`, `ListingStatuses.{Active,Archived}`, `ReservationStatuses.{Confirmed,Completed,Cancelled}`.
  - `AppDbContext` ve DbSet'leri: `Users`, `OtpCodes`, `Organisations`, `Listings`, `Reservations`, `Reviews`.
  - Testler için: `ApiFactory` (`Clock`, `DbAsync(Func<AppDbContext, Task>)`, `DbAsync<T>(Func<AppDbContext, Task<T>>)`), `TestClock` (`Noon`, `Now`, `UtcNow`), `ApiCollection.Name`.

- [ ] **Adım 1: Test altyapısını yaz**

`api/tests/GidaKoprusu.Api.Tests/TestClock.cs`:

```csharp
namespace GidaKoprusu.Api.Tests;

// The API reads time only through TimeProvider, so tests can move the clock to check
// deadlines (OTP expiry, 30-minute cancellation cut-off, listing expiry).
public sealed class TestClock : TimeProvider
{
    // 12:00 in Istanbul. Every DB test class resets the clock to this in its constructor.
    public static readonly DateTimeOffset Noon = new(2026, 10, 8, 9, 0, 0, TimeSpan.Zero);

    public DateTimeOffset Now { get; set; } = Noon;

    public DateTime UtcNow => Now.UtcDateTime;

    public override DateTimeOffset GetUtcNow() => Now;
}
```

`api/tests/GidaKoprusu.Api.Tests/ApiFactory.cs`:

```csharp
using GidaKoprusu.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace GidaKoprusu.Api.Tests;

// One Postgres container and one API host for the whole run. Tests never clean up; each
// creates its own users and organisations with unique ids, so they cannot collide.
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public TestClock Clock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Clock);
        });
    }

    public async Task DbAsync(Func<AppDbContext, Task> work)
    {
        await using var scope = Services.CreateAsyncScope();
        await work(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public async Task<T> DbAsync<T>(Func<AppDbContext, Task<T>> work)
    {
        await using var scope = Services.CreateAsyncScope();
        return await work(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public Task InitializeAsync() => _postgres.StartAsync();

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}
```

`api/tests/GidaKoprusu.Api.Tests/ApiCollection.cs`:

```csharp
namespace GidaKoprusu.Api.Tests;

// Every test that touches the API or the database joins this collection, so they share one
// container and run one after another (they also share the mutable TestClock).
[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "api";
}
```

- [ ] **Adım 2: Failing testleri yaz**

`api/tests/GidaKoprusu.Api.Tests/HealthTests.cs`:

```csharp
using System.Net;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class HealthTests
{
    private readonly ApiFactory _factory;

    public HealthTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    [Fact]
    public async Task Health_reports_ok_when_the_database_is_reachable()
    {
        var response = await _factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("ok", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Unknown_routes_return_problem_details()
    {
        var response = await _factory.CreateClient().GetAsync("/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
```

`api/tests/GidaKoprusu.Api.Tests/SchemaTests.cs`:

```csharp
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class SchemaTests
{
    private readonly ApiFactory _factory;

    public SchemaTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static string NewOrganisationId() => "org_" + Guid.NewGuid().ToString("N")[..12];

    [Fact]
    public async Task Listing_round_trips_allergens_and_organisation_gets_database_defaults()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Şema Fırını", Kind = OrganisationKinds.Business });
            db.Listings.Add(new Listing
            {
                OrganisationId = organisationId,
                Title = "Poğaça",
                PortionsTotal = 3,
                PortionsAvailable = 3,
                Allergens = ["Gluten", "Susam"],
            });
            await db.SaveChangesAsync();
        });

        var (allergens, trustScore, status) = await _factory.DbAsync(async db =>
        {
            var listing = await db.Listings.SingleAsync(l => l.OrganisationId == organisationId);
            var organisation = await db.Organisations.SingleAsync(o => o.Id == organisationId);
            return (listing.Allergens, organisation.TrustScore, organisation.Status);
        });

        Assert.Equal(new[] { "Gluten", "Susam" }, allergens);
        Assert.Equal(50, trustScore);
        Assert.Equal(OrganisationStatuses.Pending, status);
    }

    [Fact]
    public async Task Tables_and_columns_use_snake_case_names()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Ad Testi", Kind = OrganisationKinds.Ngo });
            await db.SaveChangesAsync();
        });

        var count = await _factory.DbAsync(db => db.Database
            .SqlQuery<int>($"select count(*)::int as \"Value\" from organisations where id = {organisationId} and trust_score = 50")
            .SingleAsync());

        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Database_rejects_a_listing_with_zero_portions()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Kısıt Testi", Kind = OrganisationKinds.Business });
            await db.SaveChangesAsync();
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => _factory.DbAsync(async db =>
        {
            db.Listings.Add(new Listing { OrganisationId = organisationId, Title = "Boş", PortionsTotal = 0 });
            await db.SaveChangesAsync();
        }));
    }
}
```

- [ ] **Adım 3: Derlenmediğini doğrula**

Çalıştır: `dotnet build tests/GidaKoprusu.Api.Tests`
Beklenen: Derleme hatası. `Organisation`, `AppDbContext` gibi tipler bulunamaz.

- [ ] **Adım 4: `Data/Entities.cs` yaz**

```csharp
namespace GidaKoprusu.Api.Data;

// Statuses and roles are stored as the same lowercase strings Supabase used, so the seed SQL
// and the frontend keep working without a mapping layer.
public static class Roles
{
    public const string Buyer = "buyer";
    public const string Business = "business";
    public const string Ngo = "ngo";
    public const string Admin = "admin";
}

public static class OrganisationKinds
{
    public const string Business = "business";
    public const string Ngo = "ngo";
}

public static class OrganisationStatuses
{
    public const string Pending = "pending";
    public const string Active = "active";
    public const string Suspended = "suspended";
}

public static class ListingTypes
{
    public const string Free = "free";
    public const string Discounted = "discounted";
    public const string Bulk = "bulk";
}

public static class ListingStatuses
{
    public const string Active = "active";
    public const string Archived = "archived";
}

public static class ReservationStatuses
{
    public const string Confirmed = "confirmed";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
}

// Supabase kept identity (auth.users) and profile (public.profiles) apart; here one table
// holds both. Role and organisation are only ever changed by an admin endpoint.
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public string Role { get; set; } = Roles.Buyer;
    public string? OrganisationId { get; set; }
    public Organisation? Organisation { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OtpCode
{
    public required string Email { get; set; }
    public required string CodeHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }
}

public class Organisation
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Kind { get; set; }
    public string Status { get; set; } = OrganisationStatuses.Pending;
    public string? Type { get; set; }
    public string? Avatar { get; set; }
    public string? Cover { get; set; }
    public string? Address { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public int TrustScore { get; set; } = 50;
    public decimal TotalDonatedKg { get; set; }
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Listing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Type { get; set; } = ListingTypes.Discounted;
    public decimal PriceOriginal { get; set; }
    public decimal PriceDiscounted { get; set; }
    public int PortionsTotal { get; set; } = 1;
    public int PortionsAvailable { get; set; }
    public string? PickupStartTime { get; set; }
    public string? PickupEndTime { get; set; }
    public string? Image { get; set; }
    public List<string> Allergens { get; set; } = [];
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public decimal WeightKg { get; set; }
    public decimal Co2ReductionKg { get; set; }
    public string Status { get; set; } = ListingStatuses.Active;
    public DateTime CreatedAt { get; set; }
}

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? ListingId { get; set; }
    public Listing? Listing { get; set; }
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public required string ListingTitle { get; set; }
    public string? Image { get; set; }
    public int PortionCount { get; set; } = 1;
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = ReservationStatuses.Confirmed;
    public string? PickupStartTime { get; set; }
    public string? PickupEndTime { get; set; }
    public required string PickupCode { get; set; }
    public required string QrToken { get; set; }
    // Snapshotted when the order is placed, so editing the listing later cannot rewrite what
    // someone already rescued.
    public decimal SavedKg { get; set; }
    public decimal Co2Kg { get; set; }
    public decimal SavedAmount { get; set; }
    public DateTime? ListingCreatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public string AuthorName { get; set; } = "Gıda Kurtarıcısı";
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public List<string> Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Adım 5: `Data/AppDbContext.cs` yaz**

```csharp
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<Organisation> Organisations => Set<Organisation>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Check constraints are raw SQL, so they use the final snake_case column names.
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(u => u.Organisation).WithMany().HasForeignKey(u => u.OrganisationId).OnDelete(DeleteBehavior.SetNull);
            entity.ToTable(t => t.HasCheckConstraint("ck_users_role", "role in ('buyer', 'business', 'ngo', 'admin')"));
        });

        modelBuilder.Entity<OtpCode>(entity => entity.HasKey(o => o.Email));

        // The database defaults matter for the seed SQL, which inserts without these columns.
        modelBuilder.Entity<Organisation>(entity =>
        {
            entity.Property(o => o.Status).HasDefaultValue(OrganisationStatuses.Pending);
            entity.Property(o => o.TrustScore).HasDefaultValue(50);
            entity.Property(o => o.TotalDonatedKg).HasDefaultValue(0m);
            entity.Property(o => o.ReviewCount).HasDefaultValue(0);
            entity.Property(o => o.CreatedAt).HasDefaultValueSql("now()");
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_organisations_kind", "kind in ('business', 'ngo')");
                t.HasCheckConstraint("ck_organisations_status", "status in ('pending', 'active', 'suspended')");
                t.HasCheckConstraint("ck_organisations_trust_score", "trust_score between 0 and 100");
            });
        });

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.Property(l => l.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(l => l.Type).HasDefaultValue(ListingTypes.Discounted);
            entity.Property(l => l.Status).HasDefaultValue(ListingStatuses.Active);
            entity.Property(l => l.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(l => l.Organisation).WithMany().HasForeignKey(l => l.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(l => l.OrganisationId);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_listings_type", "type in ('free', 'discounted', 'bulk')");
                t.HasCheckConstraint("ck_listings_status", "status in ('active', 'archived')");
                t.HasCheckConstraint("ck_listings_portions_total", "portions_total > 0");
                // Last line of defence against overselling, behind the conditional UPDATE.
                t.HasCheckConstraint("ck_listings_portions_available", "portions_available >= 0");
            });
        });

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(r => r.Status).HasDefaultValue(ReservationStatuses.Confirmed);
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Listing).WithMany().HasForeignKey(r => r.ListingId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(r => r.Organisation).WithMany().HasForeignKey(r => r.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => r.UserId);
            // A code only has to be unique within the organisation that scans it.
            entity.HasIndex(r => new { r.OrganisationId, r.PickupCode }).IsUnique();
            entity.HasIndex(r => r.QrToken).IsUnique();
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_reservations_status", "status in ('confirmed', 'completed', 'cancelled')");
                t.HasCheckConstraint("ck_reservations_portion_count", "portion_count > 0");
            });
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(r => r.Reservation).WithMany().HasForeignKey(r => r.ReservationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Organisation).WithMany().HasForeignKey(r => r.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => r.ReservationId).IsUnique();
            entity.HasIndex(r => new { r.OrganisationId, r.CreatedAt });
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_reviews_rating", "rating between 1 and 5");
                t.HasCheckConstraint("ck_reviews_comment", "char_length(comment) <= 500");
            });
        });

        // Postgres convention and the Supabase schema both use snake_case. The table name is
        // renamed first because key and index names are derived from it.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            entityType.SetTableName(ToSnakeCase(entityType.GetTableName()!));
            foreach (var property in entityType.GetProperties())
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            foreach (var key in entityType.GetKeys())
                key.SetName(ToSnakeCase(key.GetName()!));
            foreach (var foreignKey in entityType.GetForeignKeys())
                foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()!));
            foreach (var index in entityType.GetIndexes())
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()!));
        }
    }

    private static string ToSnakeCase(string name) =>
        Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant();
}
```

- [ ] **Adım 6: `Data/DesignTimeFactory.cs` yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GidaKoprusu.Api.Data;

// Lets `dotnet ef` build the model without starting the web host. The connection string is
// only used by commands that talk to a database, such as `dotnet ef database update`.
public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Port=5433;Database=gidakoprusu;Username=postgres;Password=postgres")
            .Options);
}
```

- [ ] **Adım 7: `Program.cs` dosyasının tamamını yaz**

```csharp
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuration is read inside callbacks rather than here, so values a test host injects
// (connection string, secrets) are already in place when they are used.
builder.Services.AddDbContext<AppDbContext>((services, options) =>
    options.UseNpgsql(services.GetRequiredService<IConfiguration>().GetConnectionString("Default")));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:3000"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();

app.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new { status = "ok" })
        : Results.Problem("Veritabanına bağlanılamadı.", statusCode: StatusCodes.Status503ServiceUnavailable));

await using (var scope = app.Services.CreateAsyncScope())
{
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}

app.Run();

// Exposes the entry point to WebApplicationFactory in the test project.
public partial class Program;
```

- [ ] **Adım 8: appsettings dosyalarını yaz**

`api/src/GidaKoprusu.Api/appsettings.json` dosyasının tamamı. Bağlantı dizesi ve gizli değerler bilerek bu dosyada **yok**, testler kendi değerlerini enjekte ediyor:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "Origins": [ "http://localhost:3000" ]
  }
}
```

`api/src/GidaKoprusu.Api/appsettings.Development.json` dosyasının tamamı:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5433;Database=gidakoprusu;Username=postgres;Password=postgres"
  }
}
```

- [ ] **Adım 9: Derle ve migration üret**

```bash
dotnet build
dotnet ef migrations add InitialCreate --project src/GidaKoprusu.Api --output-dir Data/Migrations
```

Beklenen:
- `Build succeeded`.
- `src/GidaKoprusu.Api/Data/Migrations/` altında `*_InitialCreate.cs`, `*_InitialCreate.Designer.cs` ve `AppDbContextModelSnapshot.cs` oluşur.
- `*_InitialCreate.cs` içinde `name: "users"`, `name: "organisation_id"`, `"ck_listings_portions_available"` geçmeli. Kontrol için: `grep -c "organisation_id" src/GidaKoprusu.Api/Data/Migrations/*_InitialCreate.cs` sıfırdan büyük bir sayı basmalı.
- EF'in `HasDefaultValue` hakkında sentinel uyarıları basması normal.

- [ ] **Adım 10: Tüm testleri koş**

Çalıştır: `dotnet test`
Beklenen: `Passed!  - Failed: 0, Passed: 16`. İlk koşuda Postgres imajını indirdiği için 1-2 dakika sürebilir.

Hata ayıklama ipuçları:
- `Docker is either not running` hatası: Docker Desktop kapalı, Nazım'a söyle.
- `relation "organisations" does not exist`: migration üretilmemiş ya da Program.cs içinde `MigrateAsync` yok.

- [ ] **Adım 11: Elle duman testi**

`dotnet run --project src/GidaKoprusu.Api` komutunu **arka planda** başlat (Bash aracında `run_in_background: true`). Sonra:

```bash
curl -s --retry 20 --retry-connrefused --retry-delay 1 http://localhost:5080/health
```

Beklenen: `{"status":"ok"}`. Ardından arka plandaki `dotnet run` sürecini durdur.

---

## Bölüm sonu

- [ ] **Son kontrol:** `dotnet test` komutunu tekrar koş, 16 test geçmeli. `git status --short` çıktısında yalnızca `api/` altındaki dosyalar görünmeli.
- [ ] **DURUM.md güncelle** (`C:\Users\pc\OneDrive\Masaüstü\planlar\DURUM.md`):
  - Bölüm tablosunda 1. satırın durumunu `✅ Tamam` yap.
  - "Sıradaki tek iş" bölümünü şununla değiştir: `Bölüm 2: docs/superpowers/plans/2026-10-08-backend-bolum-2-giris.md planını uygula.` Altına önerilen commit mesajını yaz.
- [ ] **Commit mesajı öner.** Commit'i Nazım atacak:

```
feat(api): scaffold .NET 9 API with Postgres schema, migrations and test harness
```

- [ ] **Mülakat soruları:** Nazım'a aşağıdaki soruları **tek tek** sor. Cevabını değerlendir, eksik kalan yeri kısaca anlat. Cevap anahtarları köşeli parantez içinde ve yalnızca senin için.
  1. Bağlantı dizesini neden `AddDbContext` callback'i içinde okuyoruz da `builder.Configuration` ile hemen okumuyoruz? [Test host'u ayarlarını build sırasında uygular. Erken okusaydık testler geliştirme DB'sine bağlanırdı.]
  2. Testleri neden EF InMemory ya da SQLite yerine Testcontainers ile gerçek Postgres'e karşı koşuyoruz? [text[], check constraint, unique index, transaction ve satır kilidi davranışı yalnızca gerçek Postgres'te var. Bölüm 4'teki yarış testi InMemory'de anlamsız olurdu.]
  3. `TimeProvider` neden var, `DateTime.UtcNow` yetmez mi? [Testte saati ileri sarabilmek için: OTP süresi, 30 dakika iptal kuralı, ilan süresinin dolması.]
  4. snake_case dönüştürücüsü olmasa ne olurdu? [Tablolar "Users", sütunlar "OrganisationId" olurdu. Postgres'te tırnak gerekir ve Supabase seed SQL'i çalışmazdı. Alternatifi EFCore.NamingConventions paketi.]
  5. Türkiye saatini sabit +3 ile hesaplamanın riski ne? [Yaz saati geri gelirse hatalı olur. Kod içindeki `ponytail` notu bunu ve çözümü (TimeZoneInfo) belirtiyor.]
