# Bölüm 2: Giriş ve Profil Uygulama Planı

> **Ajanlar için:** Bu planı `superpowers:executing-plans` ile adım adım uygula (Sonnet). Adımlar `- [ ]` kutularıyla izlenir. **Commit atma.**

**Hedef:** E-posta kodu (OTP) ile giriş, JWT, `/me` profil uçları, avatar yükleme ve ilk yönetici hesabının otomatik oluşturulması.

**Mimari:**
- `OtpService` kodu üretir, hash'ler ve doğrular.
- `TokenService` HS256 ile JWT imzalar. Token'ın claim'leri: `sub`, `email`, `role`, `org`.
- JwtBearer claim adlarını eşlemeden (`MapInboundClaims = false`) okur.
- `ClaimsExtensions` rol ve kurumu yalnızca token'dan okur.
- `Uploads` görselleri diske yazar ve `/uploads` altında statik olarak sunar.

**Teknoloji:** ASP.NET Core JwtBearer, `Microsoft.IdentityModel.JsonWebTokens`, `System.Net.Mail`.

## Global Kısıtlar

Bölüm 1 planındaki "Global Kısıtlar" bölümü aynen geçerli. Kısaca:
- `net9.0`, paket ekleme yok (JwtBearer zaten csproj'da).
- Komutlar `api/` içinde çalışır.
- Kullanıcı mesajları birebir Türkçe.
- Saat `TimeProvider`'dan alınır. Tek istisna `TokenService`.
- Commit yok.

## Başlamadan önce

- [ ] `DURUM.md`, spec ve Bölüm 1 planını oku. Bölüm 1'in dosyaları `api/` altında olmalı.
- [ ] `cd "/c/Users/pc/OneDrive/Masaüstü/projeler/sosyalSorumluluk/api" && dotnet test` → 16 test geçmeli. Geçmiyorsa dur ve raporla.

## Dosya haritası

```
src/GidaKoprusu.Api/
  Auth/TokenService.cs        JWT üretimi + imza anahtarı
  Auth/EmailSender.cs         IEmailSender, LogEmailSender, SmtpEmailSender
  Auth/OtpService.cs          kod üret/doğrula, ilk girişte buyer oluştur
  Auth/AuthEndpoints.cs       POST /auth/otp, POST /auth/verify
  Auth/AdminSeeder.cs         Seed:AdminEmail için admin oluştur
  Common/ClaimsExtensions.cs  UserId(), UserIdOrNull(), Role(), OrganisationId()
  Common/Uploads.cs           görsel doğrulama + kaydetme
  Profiles/ProfileEndpoints.cs  AccountDto, GET/PUT /me, POST /me/avatar
  Program.cs                  (tamamı değişir)
  appsettings.Development.json (tamamı değişir)
tests/GidaKoprusu.Api.Tests/
  ApiFactory.cs               (tamamı değişir: e-posta yakalayıcı, JWT secret, uploads, admin e-postası)
  CapturingEmailSender.cs
  TestAuth.cs                 SignInAsync
  TestHttp.cs                 DetailAsync
  AuthTests.cs
  ProfileTests.cs
```

---

### Task 1: Test altyapısını genişlet

**Dosyalar:**
- Oluştur: `tests/.../CapturingEmailSender.cs`, `TestAuth.cs`, `TestHttp.cs`
- Değiştir: `tests/.../ApiFactory.cs` (tamamı)

**Arayüzler:**
- Tüketir: Bölüm 1'deki `TestClock`, `AppDbContext`, `User`, `Roles`.
- Üretir:
  - `ApiFactory.Emails : CapturingEmailSender`
  - `ApiFactory.AdminEmail` sabiti `"admin@test.local"`
  - `ApiFactory.UploadsRoot : string`
  - `CapturingEmailSender.LastCodeFor(string email) : string`
  - `TestAuth.SignInAsync(this ApiFactory, string role = Roles.Buyer, string? organisationId = null, string? displayName = null) : Task<(HttpClient Client, User User)>`
  - `TestHttp.DetailAsync(this HttpResponseMessage) : Task<string?>`
- Bu Task, Task 2'deki `IEmailSender` ve `TokenService` tiplerine bağlı. Bu yüzden Task 1 ile Task 2 birlikte derlenir. Önce Task 1'in dosyalarını yaz, derleme hatasını gör, sonra Task 2'ye geç.

- [ ] **Adım 1: `ApiFactory.cs` dosyasının tamamını değiştir**

```csharp
using GidaKoprusu.Api.Auth;
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
    public const string AdminEmail = "admin@test.local";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public TestClock Clock { get; } = new();

    public CapturingEmailSender Emails { get; } = new();

    public string UploadsRoot { get; } = Path.Combine(Path.GetTempPath(), "gk-uploads-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
            ["Jwt:Secret"] = "test-secret-0123456789-0123456789-abcdef",
            ["Uploads:Root"] = UploadsRoot,
            ["Seed:AdminEmail"] = AdminEmail,
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Clock);
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(Emails);
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
        if (Directory.Exists(UploadsRoot))
            Directory.Delete(UploadsRoot, recursive: true);
    }
}
```

- [ ] **Adım 2: `CapturingEmailSender.cs`**

```csharp
using System.Collections.Concurrent;
using GidaKoprusu.Api.Auth;

namespace GidaKoprusu.Api.Tests;

// Stands in for the real sender so a test can read the code that would have been mailed.
public sealed class CapturingEmailSender : IEmailSender
{
    private readonly ConcurrentDictionary<string, string> _codes = new();

    public Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        _codes[email] = code;
        return Task.CompletedTask;
    }

    public string LastCodeFor(string email) => _codes[email];
}
```

- [ ] **Adım 3: `TestAuth.cs`**

```csharp
using System.Net.Http.Headers;
using GidaKoprusu.Api.Auth;
using GidaKoprusu.Api.Data;
using Microsoft.Extensions.DependencyInjection;

namespace GidaKoprusu.Api.Tests;

public static class TestAuth
{
    // Skips the OTP round trip: writes the user straight to the database and signs a token
    // with the API's own TokenService. AuthTests cover the real OTP flow.
    public static async Task<(HttpClient Client, User User)> SignInAsync(
        this ApiFactory factory, string role = Roles.Buyer, string? organisationId = null, string? displayName = null)
    {
        var user = new User
        {
            Email = $"{Guid.NewGuid():N}@test.local",
            Role = role,
            OrganisationId = organisationId,
            DisplayName = displayName ?? "Test Kullanıcı",
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var token = factory.Services.GetRequiredService<TokenService>().Create(user);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (client, user);
    }
}
```

- [ ] **Adım 4: `TestHttp.cs`**

```csharp
using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

public static class TestHttp
{
    // The Turkish message the frontend shows, from a ProblemDetails body.
    public static async Task<string?> DetailAsync(this HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString();
}
```

---

### Task 2: Token, e-posta, OTP ve giriş uçları (TDD)

**Dosyalar:**
- Oluştur: `Auth/TokenService.cs`, `Auth/EmailSender.cs`, `Auth/OtpService.cs`, `Auth/AuthEndpoints.cs`, `Auth/AdminSeeder.cs`, `Common/ClaimsExtensions.cs`, `Common/Uploads.cs`, `Profiles/ProfileEndpoints.cs`
- Değiştir: `Program.cs` (tamamı), `appsettings.Development.json` (tamamı)
- Test: `tests/.../AuthTests.cs`, `tests/.../ProfileTests.cs`

**Arayüzler:**
- Üretir:
  - `TokenService.Create(User) : string`
  - `TokenService.SigningKey(IConfiguration) : SymmetricSecurityKey`
  - `IEmailSender.SendOtpAsync(string email, string code, CancellationToken)`
  - `OtpService.Normalize(string?) : string` (statik; geçersiz e-postada 400 fırlatır)
  - `OtpService.SendAsync(string, CancellationToken)`
  - `OtpService.VerifyAsync(string, string?, CancellationToken) : Task<User>`
  - `ClaimsExtensions`: `UserId()`, `UserIdOrNull()`, `Role()`, `OrganisationId()` (`ClaimsPrincipal` üzerinde)
  - `Uploads.Root`, `Uploads.MaxBytes`, `Uploads.SaveImageAsync(IFormFile file, string folder, string name, HttpRequest request, CancellationToken ct) : Task<string>`
  - `AccountDto.From(User user, string role, string? organisationId)`
  - Endpoint map fonksiyonları: `MapAuthEndpoints()`, `MapProfileEndpoints()`

- [ ] **Adım 1: Failing testleri yaz**

`tests/GidaKoprusu.Api.Tests/AuthTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class AuthTests
{
    private const string WrongOrExpired = "Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.";

    private readonly ApiFactory _factory;

    public AuthTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.local";

    [Fact]
    public async Task First_login_creates_a_buyer_and_returns_a_working_token()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();

        var sent = await client.PostAsJsonAsync("/auth/otp", new { email = email.ToUpperInvariant() });
        Assert.Equal(HttpStatusCode.NoContent, sent.StatusCode);

        var code = _factory.Emails.LastCodeFor(email);
        Assert.Matches("^[0-9]{8}$", code);

        var verified = await client.PostAsJsonAsync("/auth/verify", new { email, code });
        Assert.Equal(HttpStatusCode.OK, verified.StatusCode);
        var body = await verified.Content.ReadFromJsonAsync<JsonElement>();
        var account = body.GetProperty("account");
        Assert.Equal(email, account.GetProperty("email").GetString());
        Assert.Equal("buyer", account.GetProperty("role").GetString());
        Assert.Equal(JsonValueKind.Null, account.GetProperty("organisationId").ValueKind);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        var me = await client.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal(account.GetProperty("id").GetString(), me.GetProperty("id").GetString());
    }

    [Fact]
    public async Task Invalid_email_is_rejected_with_a_turkish_message()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/otp", new { email = "not-an-email" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Geçerli bir e-posta adresi girin.", await response.DetailAsync());
    }

    [Fact]
    public async Task Five_wrong_codes_lock_the_code_even_for_the_right_one()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/auth/otp", new { email });
        var code = _factory.Emails.LastCodeFor(email);
        var wrong = code == "00000000" ? "11111111" : "00000000";

        for (var attempt = 0; attempt < 5; attempt++)
        {
            var response = await client.PostAsJsonAsync("/auth/verify", new { email, code = wrong });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("Kod hatalı.", await response.DetailAsync());
        }

        var locked = await client.PostAsJsonAsync("/auth/verify", new { email, code });
        Assert.Equal(HttpStatusCode.BadRequest, locked.StatusCode);
        Assert.Equal(WrongOrExpired, await locked.DetailAsync());
    }

    [Fact]
    public async Task Code_expires_after_ten_minutes()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/auth/otp", new { email });
        var code = _factory.Emails.LastCodeFor(email);

        _factory.Clock.Now = TestClock.Noon.AddMinutes(11);
        var response = await client.PostAsJsonAsync("/auth/verify", new { email, code });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(WrongOrExpired, await response.DetailAsync());
    }

    [Fact]
    public async Task Me_requires_a_token()
    {
        var response = await _factory.CreateClient().GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Seeded_admin_email_signs_in_as_admin()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/auth/otp", new { email = ApiFactory.AdminEmail });

        var verified = await client.PostAsJsonAsync("/auth/verify",
            new { email = ApiFactory.AdminEmail, code = _factory.Emails.LastCodeFor(ApiFactory.AdminEmail) });

        var body = await verified.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("admin", body.GetProperty("account").GetProperty("role").GetString());
    }
}
```

`tests/GidaKoprusu.Api.Tests/ProfileTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ProfileTests
{
    private readonly ApiFactory _factory;

    public ProfileTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static MultipartFormDataContent ImageForm(byte[] bytes, string contentType)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", "image" } };
    }

    [Fact]
    public async Task Put_me_updates_profile_fields_but_never_the_role()
    {
        var (client, user) = await _factory.SignInAsync();

        var response = await client.PutAsJsonAsync("/me",
            new { displayName = "Ayşe", city = "Bursa", district = "Nilüfer", phone = "555", bio = "Merhaba", role = "admin" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var account = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ayşe", account.GetProperty("displayName").GetString());
        Assert.Equal("Bursa", account.GetProperty("city").GetString());
        Assert.Equal("buyer", account.GetProperty("role").GetString());
        var storedRole = await _factory.DbAsync(db => db.Users.Where(u => u.Id == user.Id).Select(u => u.Role).SingleAsync());
        Assert.Equal(Roles.Buyer, storedRole);
    }

    [Fact]
    public async Task Avatar_upload_stores_the_file_and_serves_it()
    {
        var (client, user) = await _factory.SignInAsync();
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

        var response = await client.PostAsync("/me/avatar", ImageForm(png, "image/png"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var publicUrl = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("publicUrl").GetString()!;
        Assert.Contains($"/uploads/avatars/{user.Id}.png?v=", publicUrl);

        var served = await client.GetAsync(new Uri(publicUrl).PathAndQuery);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal(png, await served.Content.ReadAsByteArrayAsync());

        var me = await client.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal(publicUrl, me.GetProperty("avatarUrl").GetString());
    }

    [Fact]
    public async Task Avatar_rejects_files_that_are_not_images()
    {
        var (client, _) = await _factory.SignInAsync();

        var response = await client.PostAsync("/me/avatar", ImageForm([1, 2, 3], "text/plain"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.", await response.DetailAsync());
    }

    [Fact]
    public async Task Avatar_rejects_files_over_two_megabytes()
    {
        var (client, _) = await _factory.SignInAsync();

        var response = await client.PostAsync("/me/avatar", ImageForm(new byte[Uploads.MaxBytes + 1], "image/png"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Görsel 2 MB sınırını aşıyor.", await response.DetailAsync());
    }
}
```

- [ ] **Adım 2: Derlenmediğini doğrula**

Çalıştır: `dotnet build tests/GidaKoprusu.Api.Tests`
Beklenen: `GidaKoprusu.Api.Auth`, `IEmailSender`, `TokenService`, `Uploads` bulunamaz.

- [ ] **Adım 3: `Auth/TokenService.cs`**

```csharp
using System.Text;
using GidaKoprusu.Api.Data;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace GidaKoprusu.Api.Auth;

public sealed class TokenService(IConfiguration config)
{
    // ponytail: no refresh token, so a role change only takes effect at the next sign-in.
    // Add a token version column checked on each request if that delay matters.
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(12);

    public static SymmetricSecurityKey SigningKey(IConfiguration config)
    {
        var secret = config["Jwt:Secret"];
        if (string.IsNullOrEmpty(secret) || Encoding.UTF8.GetByteCount(secret) < 32)
            throw new InvalidOperationException("Jwt:Secret must be set and at least 32 bytes long.");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    // Uses the real clock on purpose: the JWT middleware checks expiry against the real clock
    // too, so a test clock here would mint tokens that are already expired.
    public string Create(User user)
    {
        var claims = new Dictionary<string, object>
        {
            ["sub"] = user.Id.ToString(),
            ["email"] = user.Email,
            ["role"] = user.Role,
        };
        // An organisation only counts for the roles that operate one, so a stale link left on
        // a demoted account cannot keep acting for that business.
        if (user.OrganisationId is not null && (user.Role is Roles.Business or Roles.Ngo))
            claims["org"] = user.OrganisationId;

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Claims = claims,
            Expires = DateTime.UtcNow.Add(Lifetime),
            SigningCredentials = new SigningCredentials(SigningKey(config), SecurityAlgorithms.HmacSha256),
        });
    }
}
```

- [ ] **Adım 4: `Auth/EmailSender.cs`**

```csharp
using System.Net;
using System.Net.Mail;

namespace GidaKoprusu.Api.Auth;

public interface IEmailSender
{
    Task SendOtpAsync(string email, string code, CancellationToken ct);
}

// Used when Smtp:Host is empty (local development): the code goes to the log, not an inbox.
public sealed class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        logger.LogWarning("OTP for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}

public sealed class SmtpEmailSender(IConfiguration config) : IEmailSender
{
    public async Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        var smtp = config.GetSection("Smtp");
        using var client = new SmtpClient(smtp["Host"], smtp.GetValue("Port", 587))
        {
            EnableSsl = smtp.GetValue("EnableSsl", true),
            Credentials = new NetworkCredential(smtp["Username"], smtp["Password"]),
        };
        using var message = new MailMessage(smtp["From"] ?? smtp["Username"]!, email)
        {
            Subject = "Gıda Köprüsü giriş kodunuz",
            Body = $"Giriş kodunuz: {code}\n\nKod 10 dakika geçerlidir.",
        };
        await client.SendMailAsync(message, ct);
    }
}
```

- [ ] **Adım 5: `Auth/OtpService.cs`**

```csharp
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Auth;

public sealed class OtpService(AppDbContext db, IEmailSender sender, TimeProvider clock)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    public const int MaxAttempts = 5;

    public static string Normalize(string? email)
    {
        var trimmed = (email ?? "").Trim().ToLowerInvariant();
        if (!MailAddress.TryCreate(trimmed, out var parsed) || parsed.Address != trimmed)
            throw AppException.BadRequest("Geçerli bir e-posta adresi girin.");
        return trimmed;
    }

    // A new request replaces any earlier code for the same address and resets the attempts.
    public async Task SendAsync(string? rawEmail, CancellationToken ct)
    {
        var email = Normalize(rawEmail);
        var code = RandomNumberGenerator.GetInt32(0, 100_000_000).ToString("D8");

        var otp = await db.OtpCodes.FindAsync([email], ct);
        if (otp is null)
        {
            otp = new OtpCode { Email = email, CodeHash = "" };
            db.OtpCodes.Add(otp);
        }
        otp.CodeHash = Hash(email, code);
        otp.ExpiresAt = clock.GetUtcNow().UtcDateTime.Add(Lifetime);
        otp.Attempts = 0;
        await db.SaveChangesAsync(ct);

        await sender.SendOtpAsync(email, code, ct);
    }

    // Returns the signed-in user. Signup is open, and a first login always creates a plain
    // buyer: privilege is granted later by an admin, never chosen at the login screen.
    public async Task<User> VerifyAsync(string? rawEmail, string? code, CancellationToken ct)
    {
        var email = Normalize(rawEmail);
        var otp = await db.OtpCodes.FindAsync([email], ct);
        if (otp is null || otp.Attempts >= MaxAttempts || otp.ExpiresAt <= clock.GetUtcNow().UtcDateTime)
            throw AppException.BadRequest("Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.");

        var expected = Encoding.ASCII.GetBytes(otp.CodeHash);
        var actual = Encoding.ASCII.GetBytes(Hash(email, code ?? ""));
        if (!CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            otp.Attempts++;
            await db.SaveChangesAsync(ct);
            throw AppException.BadRequest("Kod hatalı.");
        }

        db.OtpCodes.Remove(otp);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
        if (user is null)
        {
            user = new User
            {
                Email = email,
                DisplayName = email.Split('@')[0],
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };
            db.Users.Add(user);
        }
        await db.SaveChangesAsync(ct);
        return user;
    }

    // Stored hashed so a leaked table does not hand out live codes.
    private static string Hash(string email, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{email}:{code}")));
}
```

- [ ] **Adım 6: `Auth/AdminSeeder.cs`**

```csharp
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Auth;

// The first admin cannot be granted from the panel (only an admin can grant), so it is
// created at startup from configuration.
public static class AdminSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config, TimeProvider clock)
    {
        var raw = config["Seed:AdminEmail"];
        if (string.IsNullOrWhiteSpace(raw))
            return;

        var email = OtpService.Normalize(raw);
        if (await db.Users.AnyAsync(u => u.Email == email))
            return;

        db.Users.Add(new User
        {
            Email = email,
            Role = Roles.Admin,
            DisplayName = "Yönetici",
            CreatedAt = clock.GetUtcNow().UtcDateTime,
        });
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Adım 7: `Auth/AuthEndpoints.cs`**

```csharp
using GidaKoprusu.Api.Profiles;

namespace GidaKoprusu.Api.Auth;

public record OtpRequest(string? Email);
public record VerifyRequest(string? Email, string? Code);

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/otp", async (OtpRequest body, OtpService otp, CancellationToken ct) =>
        {
            await otp.SendAsync(body.Email, ct);
            return Results.NoContent();
        });

        group.MapPost("/verify", async (VerifyRequest body, OtpService otp, TokenService tokens, CancellationToken ct) =>
        {
            var user = await otp.VerifyAsync(body.Email, body.Code, ct);
            return Results.Ok(new
            {
                token = tokens.Create(user),
                account = AccountDto.From(user, user.Role, user.OrganisationId),
            });
        });
    }
}
```

- [ ] **Adım 8: `Common/ClaimsExtensions.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Data;

namespace GidaKoprusu.Api.Common;

// Role and organisation come only from the signed token, never from a request body, which is
// what stops a client from claiming to act for a business it does not belong to.
public static class ClaimsExtensions
{
    public static Guid UserId(this ClaimsPrincipal user) =>
        user.UserIdOrNull() ?? throw new InvalidOperationException("Endpoint requires an authenticated user.");

    public static Guid? UserIdOrNull(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirst("sub")?.Value, out var id) ? id : null;

    public static string Role(this ClaimsPrincipal user) => user.FindFirst("role")?.Value ?? Roles.Buyer;

    public static string? OrganisationId(this ClaimsPrincipal user) => user.FindFirst("org")?.Value;
}
```

- [ ] **Adım 9: `Common/Uploads.cs`**

```csharp
namespace GidaKoprusu.Api.Common;

public sealed class Uploads(IConfiguration config, IWebHostEnvironment env, TimeProvider clock)
{
    public const long MaxBytes = 2 * 1024 * 1024;

    private static readonly Dictionary<string, string> Extensions = new()
    {
        ["image/jpeg"] = "jpg",
        ["image/png"] = "png",
        ["image/webp"] = "webp",
    };

    public string Root => Path.GetFullPath(config["Uploads:Root"] ?? "uploads", env.ContentRootPath);

    // Writes <root>/<folder>/<name>.<ext> and returns an absolute URL. The path stays the same
    // when an image is replaced, so a version query string makes browsers fetch the new one.
    public async Task<string> SaveImageAsync(IFormFile file, string folder, string name, HttpRequest request, CancellationToken ct)
    {
        if (!Extensions.TryGetValue(file.ContentType, out var extension))
            throw AppException.BadRequest("Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.");
        if (file.Length > MaxBytes)
            throw AppException.BadRequest("Görsel 2 MB sınırını aşıyor.");

        var directory = Path.Combine(Root, folder);
        Directory.CreateDirectory(directory);
        var fileName = $"{name}.{extension}";
        await using (var stream = File.Create(Path.Combine(directory, fileName)))
            await file.CopyToAsync(stream, ct);

        return $"{request.Scheme}://{request.Host}/uploads/{folder}/{fileName}?v={clock.GetUtcNow().ToUnixTimeMilliseconds()}";
    }
}
```

- [ ] **Adım 10: `Profiles/ProfileEndpoints.cs`**

```csharp
using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;

namespace GidaKoprusu.Api.Profiles;

// Field names match what src/lib/supabase.js loadVerifiedAccount() used to return, so the
// frontend reads it unchanged.
public record AccountDto(
    Guid Id, string Email, string Role, string? OrganisationId, string DisplayName,
    string? AvatarUrl, string City, string District, string Phone, string Bio)
{
    // Role and organisation are passed in rather than read from `user`, so /me reports exactly
    // what the caller's token grants, not a newer grant they have not signed in with yet.
    public static AccountDto From(User user, string role, string? organisationId) => new(
        user.Id,
        user.Email,
        role,
        role is Roles.Business or Roles.Ngo ? organisationId : null,
        user.DisplayName ?? user.Email.Split('@')[0],
        user.AvatarUrl,
        user.City ?? "",
        user.District ?? "",
        user.Phone ?? "",
        user.Bio ?? "");
}

// Presentation fields only. Role and organisation are deliberately absent, so sending them
// does nothing.
public record ProfileUpdate(string? DisplayName, string? City, string? District, string? Phone, string? Bio);

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/me").RequireAuthorization();

        group.MapGet("", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
            AccountDto.From(await LoadAsync(db, principal, ct), principal.Role(), principal.OrganisationId()));

        group.MapPut("", async (ProfileUpdate body, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var user = await LoadAsync(db, principal, ct);
            user.DisplayName = body.DisplayName;
            user.City = body.City;
            user.District = body.District;
            user.Phone = body.Phone;
            user.Bio = body.Bio;
            await db.SaveChangesAsync(ct);
            return AccountDto.From(user, principal.Role(), principal.OrganisationId());
        });

        // Bearer tokens are not sent automatically by the browser, so there is no CSRF to
        // guard against and the form-upload antiforgery check is switched off.
        group.MapPost("/avatar", async (IFormFile file, HttpRequest request, ClaimsPrincipal principal,
            AppDbContext db, Uploads uploads, CancellationToken ct) =>
        {
            var user = await LoadAsync(db, principal, ct);
            user.AvatarUrl = await uploads.SaveImageAsync(file, "avatars", user.Id.ToString(), request, ct);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { publicUrl = user.AvatarUrl });
        }).DisableAntiforgery();
    }

    private static async Task<User> LoadAsync(AppDbContext db, ClaimsPrincipal principal, CancellationToken ct) =>
        await db.Users.FindAsync([principal.UserId()], ct) ?? throw AppException.NotFound("Hesap bulunamadı.");
}
```

- [ ] **Adım 11: `Program.cs` dosyasının tamamını değiştir**

```csharp
using GidaKoprusu.Api.Auth;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Profiles;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

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

builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<Uploads>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddSingleton<IEmailSender>(services =>
    string.IsNullOrEmpty(services.GetRequiredService<IConfiguration>()["Smtp:Host"])
        ? ActivatorUtilities.CreateInstance<LogEmailSender>(services)
        : ActivatorUtilities.CreateInstance<SmtpEmailSender>(services));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IConfiguration>((options, config) =>
    {
        // Keep claim names as issued ("sub", "role", "org") instead of mapping them to long
        // WS-Federation URIs, so ClaimsExtensions can read them directly.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            IssuerSigningKey = TokenService.SigningKey(config),
            NameClaimType = "sub",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();

var uploads = app.Services.GetRequiredService<Uploads>();
Directory.CreateDirectory(uploads.Root);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploads.Root),
    RequestPath = "/uploads",
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new { status = "ok" })
        : Results.Problem("Veritabanına bağlanılamadı.", statusCode: StatusCodes.Status503ServiceUnavailable));
app.MapAuthEndpoints();
app.MapProfileEndpoints();

await using (var scope = app.Services.CreateAsyncScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await AdminSeeder.SeedAsync(db, services.GetRequiredService<IConfiguration>(), services.GetRequiredService<TimeProvider>());
}

app.Run();

// Exposes the entry point to WebApplicationFactory in the test project.
public partial class Program;
```

- [ ] **Adım 12: `appsettings.Development.json` dosyasının tamamını değiştir**

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5433;Database=gidakoprusu;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "dev-only-secret-change-me-0123456789abcdef"
  },
  "Seed": {
    "AdminEmail": "admin@gidakoprusu.local"
  },
  "Smtp": {
    "Host": "",
    "Port": 587,
    "EnableSsl": true,
    "Username": "",
    "Password": "",
    "From": ""
  }
}
```

- [ ] **Adım 13: Tüm testleri koş**

Çalıştır: `dotnet test`
Beklenen: `Passed!  - Failed: 0, Passed: 26` (16 eski + 6 Auth + 4 Profile).

Hata ayıklama ipuçları:
- `/me` 401 dönüyorsa: Program.cs'te `UseAuthentication()` komutunun `UseAuthorization()` komutundan önce olduğunu ve `MapInboundClaims = false` ayarını kontrol et.
- Avatar isteği `anti-forgery` hatasıyla 500 dönüyorsa: `.DisableAntiforgery()` eksik.
- Bu bölümde DB şeması değişmedi, yeni migration **gerekmez**.

- [ ] **Adım 14: Elle duman testi**

`docker compose up -d db` komutunun çalışır durumda olduğundan emin ol. Sonra `dotnet run --project src/GidaKoprusu.Api` komutunu arka planda başlat ve şunu çalıştır:

```bash
curl -s --retry 20 --retry-connrefused --retry-delay 1 -X POST http://localhost:5080/auth/otp -H "Content-Type: application/json" -d '{"email":"admin@gidakoprusu.local"}' -o /dev/null -w "%{http_code}\n"
```

Beklenen: `204`. `dotnet run` çıktısında `OTP for admin@gidakoprusu.local: ` ile başlayan ve 8 haneli kodu gösteren bir log satırı görünmeli. Sonra süreci durdur.

---

## Bölüm sonu

- [ ] `dotnet test` → 26 test geçmeli.
- [ ] `DURUM.md` içinde 2. satırı `✅ Tamam` yap. "Sıradaki tek iş" bölümünü şöyle yaz: `Bölüm 3: docs/superpowers/plans/2026-10-08-backend-bolum-3-kurum-ilan.md`.
- [ ] Commit mesajı öner: `feat(api): email OTP sign-in, JWT auth and profile endpoints`
- [ ] **Mülakat soruları** (tek tek sor, köşeli parantez içindekiler cevap anahtarı):
  1. OTP kodunu neden düz metin değil de hash olarak saklıyoruz? 8 hane ve 5 deneme hakkı ne kadar güvenli? [DB sızarsa canlı kodlar okunmasın diye. Tahminle bilme şansı 5 / 10^8.]
  2. `CryptographicOperations.FixedTimeEquals` neden kullanılıyor? [Karşılaştırma süresinden, kodun kaç karakterinin doğru olduğu sızmasın diye (timing attack).]
  3. `MapInboundClaims = false` olmasaydı ne bozulurdu? [`sub` ve `role` claim'leri uzun URI'lere çevrilir, `FindFirst("role")` null döner ve herkes buyer görünürdü.]
  4. Yönetici birinin rolünü değiştirince bu neden hemen etkili olmuyor, nasıl çözülür? [JWT durumsuzdur ve 12 saat geçerli kalır. Çözüm: kısa ömürlü access token + refresh token, ya da DB'de tutulan bir token sürümü.]
  5. `/me` rolü neden DB'den değil token'dan okuyor? [Arayüz, API'nin gerçekten uyguladığı yetkiyi göstersin diye. DB'de yeni rol olup token'da eski rol varsa arayüz yanlış butonları açardı.]
