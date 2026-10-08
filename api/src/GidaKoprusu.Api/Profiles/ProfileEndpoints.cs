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
