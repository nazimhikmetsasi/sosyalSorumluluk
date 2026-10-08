using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GidaKoprusu.Api.Data;

// Lets `dotnet ef` build the model without starting the web host. The connection string is
// only used by commands that talk to a database, such as `dotnet ef database update`.
public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Port=5433;Database=gidakoprusu;Username=postgres;Password=postgres")
            .Options);
}
