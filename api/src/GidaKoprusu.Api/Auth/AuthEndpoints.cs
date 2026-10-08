using GidaKoprusu.Api.Profiles;

namespace GidaKoprusu.Api.Auth;

public record OtpRequest(string? Email);
public record VerifyRequest(string? Email, string? Code);

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/otp", async (OtpRequest body, OtpService otp, CancellationToken ct) =>
        {
            await otp.SendAsync(body.Email, ct);
            return Results.NoContent();
        });

        group.MapPost("/verify", async (VerifyRequest body, OtpService otp, TokenService tokens, CancellationToken ct) =>
        {
            var user = await otp.VerifyAsync(body.Email, body.Code, ct);
            return Results.Ok(new
            {
                token = tokens.Create(user),
                account = AccountDto.From(user, user.Role, user.OrganisationId),
            });
        });
    }
}
