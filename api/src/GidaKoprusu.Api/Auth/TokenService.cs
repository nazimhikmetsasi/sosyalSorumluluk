using System.Text;
using GidaKoprusu.Api.Data;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace GidaKoprusu.Api.Auth;

public sealed class TokenService(IConfiguration config)
{
    // ponytail: no refresh token, so a role change only takes effect at the next sign-in.
    // Add a token version column checked on each request if that delay matters.
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(12);

    public static SymmetricSecurityKey SigningKey(IConfiguration config)
    {
        var secret = config["Jwt:Secret"];
        if (string.IsNullOrEmpty(secret) || Encoding.UTF8.GetByteCount(secret) < 32)
            throw new InvalidOperationException("Jwt:Secret must be set and at least 32 bytes long.");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    // Uses the real clock on purpose: the JWT middleware checks expiry against the real clock
    // too, so a test clock here would mint tokens that are already expired.
    public string Create(User user)
    {
        var claims = new Dictionary<string, object>
        {
            ["sub"] = user.Id.ToString(),
            ["email"] = user.Email,
            ["role"] = user.Role,
        };
        // An organisation only counts for the roles that operate one, so a stale link left on
        // a demoted account cannot keep acting for that business.
        if (user.OrganisationId is not null && (user.Role is Roles.Business or Roles.Ngo))
            claims["org"] = user.OrganisationId;

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Claims = claims,
            Expires = DateTime.UtcNow.Add(Lifetime),
            SigningCredentials = new SigningCredentials(SigningKey(config), SecurityAlgorithms.HmacSha256),
        });
    }
}
