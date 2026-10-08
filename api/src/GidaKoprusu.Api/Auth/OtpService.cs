using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Auth;

public sealed class OtpService(AppDbContext db, IEmailSender sender, TimeProvider clock)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    public const int MaxAttempts = 5;

    public static string Normalize(string? email)
    {
        var trimmed = (email ?? "").Trim().ToLowerInvariant();
        if (!MailAddress.TryCreate(trimmed, out var parsed) || parsed.Address != trimmed)
            throw AppException.BadRequest("Geçerli bir e-posta adresi girin.");
        return trimmed;
    }

    // A new request replaces any earlier code for the same address and resets the attempts.
    public async Task SendAsync(string? rawEmail, CancellationToken ct)
    {
        var email = Normalize(rawEmail);
        var code = RandomNumberGenerator.GetInt32(0, 100_000_000).ToString("D8");

        var otp = await db.OtpCodes.FindAsync([email], ct);
        if (otp is null)
        {
            otp = new OtpCode { Email = email, CodeHash = "" };
            db.OtpCodes.Add(otp);
        }
        otp.CodeHash = Hash(email, code);
        otp.ExpiresAt = clock.GetUtcNow().UtcDateTime.Add(Lifetime);
        otp.Attempts = 0;
        await db.SaveChangesAsync(ct);

        await sender.SendOtpAsync(email, code, ct);
    }

    // Returns the signed-in user. Signup is open, and a first login always creates a plain
    // buyer: privilege is granted later by an admin, never chosen at the login screen.
    public async Task<User> VerifyAsync(string? rawEmail, string? code, CancellationToken ct)
    {
        var email = Normalize(rawEmail);
        var otp = await db.OtpCodes.FindAsync([email], ct);
        if (otp is null || otp.Attempts >= MaxAttempts || otp.ExpiresAt <= clock.GetUtcNow().UtcDateTime)
            throw AppException.BadRequest("Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.");

        var expected = Encoding.ASCII.GetBytes(otp.CodeHash);
        var actual = Encoding.ASCII.GetBytes(Hash(email, code ?? ""));
        if (!CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            otp.Attempts++;
            await db.SaveChangesAsync(ct);
            throw AppException.BadRequest("Kod hatalı.");
        }

        db.OtpCodes.Remove(otp);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
        if (user is null)
        {
            user = new User
            {
                Email = email,
                DisplayName = email.Split('@')[0],
                CreatedAt = clock.GetUtcNow().UtcDateTime,
            };
            db.Users.Add(user);
        }
        await db.SaveChangesAsync(ct);
        return user;
    }

    // Stored hashed so a leaked table does not hand out live codes.
    private static string Hash(string email, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{email}:{code}")));
}
