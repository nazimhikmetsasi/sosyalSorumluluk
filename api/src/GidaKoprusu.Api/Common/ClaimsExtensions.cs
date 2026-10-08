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
