using System.Security.Claims;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Reviews;

// Same field names as toReview() in src/lib/data.js.
public record ReviewDto(Guid Id, Guid ReservationId, string OrganisationId, string Author, int Rating,
    string Comment, List<string> Tags, DateTime CreatedAt)
{
    public static ReviewDto From(Review r) =>
        new(r.Id, r.ReservationId, r.OrganisationId, r.AuthorName, r.Rating, r.Comment ?? "", r.Tags, r.CreatedAt);
}

// The author name is not accepted: it is taken from the reviewer's profile on the server.
public record CreateReviewRequest(Guid ReservationId, string? OrganisationId, int Rating, string? Comment, List<string>? Tags);

public static class ReviewEndpoints
{
    public const string DefaultAuthor = "Gıda Kurtarıcısı";

    public static void MapReviewEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/reviews", async (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await db.Reviews.OrderByDescending(r => r.CreatedAt).Take(300).ToListAsync(ct);
            return rows.Select(ReviewDto.From);
        });

        app.MapPost("/reviews", async (CreateReviewRequest body, ClaimsPrincipal principal, AppDbContext db,
            TimeProvider clock, CancellationToken ct) =>
        {
            if (body.Rating is < 1 or > 5)
                throw AppException.BadRequest("Puan 1 ile 5 arasında olmalı.");
            if (body.Comment is { Length: > 500 })
                throw AppException.BadRequest("Yorum en fazla 500 karakter olabilir.");

            // Only someone who actually picked the food up may review, and only that organisation.
            var userId = principal.UserId();
            var reservation = await db.Reservations.AsNoTracking().FirstOrDefaultAsync(r => r.Id == body.ReservationId, ct);
            if (reservation is null
                || reservation.UserId != userId
                || reservation.Status != ReservationStatuses.Completed
                || reservation.OrganisationId != body.OrganisationId)
                throw AppException.Forbidden("Yalnızca teslim aldığınız siparişe yorum yazabilirsiniz.");
            if (await db.Reviews.AnyAsync(r => r.ReservationId == reservation.Id, ct))
                throw AppException.Conflict("Bu siparişe zaten yorum yazdınız.");

            var author = await db.Users.Where(u => u.Id == userId).Select(u => u.DisplayName).SingleOrDefaultAsync(ct);
            var review = new Review
            {
                ReservationId = reservation.Id,
                UserId = userId,
                OrganisationId = reservation.OrganisationId,
                AuthorName = string.IsNullOrWhiteSpace(author) ? DefaultAuthor : author,
                Rating = body.Rating,
                Comment = string.IsNullOrWhiteSpace(body.Comment) ? null : body.Comment.Trim(),
                Tags = body.Tags ?? [],
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };

            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            db.Reviews.Add(review);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (DbErrors.IsUniqueViolation(ex))
            {
                // Two submissions at once: the unique index on reservation_id lets only one in.
                throw AppException.Conflict("Bu siparişe zaten yorum yazdınız.");
            }
            await TrustScore.RecomputeAsync(db, reservation.OrganisationId, ct);
            await transaction.CommitAsync(ct);

            return Results.Created($"/reviews/{review.Id}", ReviewDto.From(review));
        }).RequireAuthorization();
    }
}
