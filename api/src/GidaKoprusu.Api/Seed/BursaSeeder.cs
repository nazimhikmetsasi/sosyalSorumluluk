using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Seed;

public static class BursaSeeder
{
    // Runs the SQL through a plain command rather than ExecuteSqlRaw, which would treat the
    // braces in array literals as format placeholders.
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        var sql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Seed", "seed-bursa.sql"), ct);

        await db.Database.OpenConnectionAsync(ct);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = sql;
            await command.ExecuteNonQueryAsync(ct);
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        var ids = await db.Organisations.Where(o => o.Id.StartsWith("bursa_")).Select(o => o.Id).ToListAsync(ct);
        foreach (var id in ids)
            await TrustScore.RecomputeAsync(db, id, ct);
    }
}
