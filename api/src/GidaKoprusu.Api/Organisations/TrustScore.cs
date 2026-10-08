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
