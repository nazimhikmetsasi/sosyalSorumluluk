using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Auth;

// The first admin cannot be granted from the panel (only an admin can grant), so it is
// created at startup from configuration.
public static class AdminSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config, TimeProvider clock)
    {
        var raw = config["Seed:AdminEmail"];
        if (string.IsNullOrWhiteSpace(raw))
            return;

        var email = OtpService.Normalize(raw);
        if (await db.Users.AnyAsync(u => u.Email == email))
            return;

        db.Users.Add(new User
        {
            Email = email,
            Role = Roles.Admin,
            DisplayName = "Yönetici",
            CreatedAt = clock.GetUtcNow().UtcDateTime,
        });
        await db.SaveChangesAsync();
    }
}
