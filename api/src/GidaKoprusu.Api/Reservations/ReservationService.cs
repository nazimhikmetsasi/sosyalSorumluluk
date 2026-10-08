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
