using GidaKoprusu.Api.Auth;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using GidaKoprusu.Api.Listings;
using GidaKoprusu.Api.Reservations;
using GidaKoprusu.Api.Seed;
using GidaKoprusu.Api.Reviews;
using GidaKoprusu.Api.Stats;
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
builder.Services.AddScoped<ReservationService>();
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
app.MapOrganisationEndpoints();
app.MapListingEndpoints();
app.MapReservationEndpoints();
app.MapReviewEndpoints();
app.MapStatsEndpoints();

await using (var scope = app.Services.CreateAsyncScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    var config = services.GetRequiredService<IConfiguration>();
    await AdminSeeder.SeedAsync(db, config, services.GetRequiredService<TimeProvider>());
    if (config.GetValue<bool>("Seed:Bursa"))
        await BursaSeeder.SeedAsync(db);
}

app.Run();

// Exposes the entry point to WebApplicationFactory in the test project.
public partial class Program;
