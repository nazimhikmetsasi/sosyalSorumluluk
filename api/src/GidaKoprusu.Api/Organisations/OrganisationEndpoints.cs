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
