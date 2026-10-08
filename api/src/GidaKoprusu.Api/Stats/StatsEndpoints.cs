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
