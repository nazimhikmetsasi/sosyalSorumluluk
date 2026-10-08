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
