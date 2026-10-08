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
