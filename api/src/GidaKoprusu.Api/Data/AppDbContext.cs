using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<Organisation> Organisations => Set<Organisation>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Check constraints are raw SQL, so they use the final snake_case column names.
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(u => u.Organisation).WithMany().HasForeignKey(u => u.OrganisationId).OnDelete(DeleteBehavior.SetNull);
            entity.ToTable(t => t.HasCheckConstraint("ck_users_role", "role in ('buyer', 'business', 'ngo', 'admin')"));
        });

        modelBuilder.Entity<OtpCode>(entity => entity.HasKey(o => o.Email));

        // The database defaults matter for the seed SQL, which inserts without these columns.
        modelBuilder.Entity<Organisation>(entity =>
        {
            entity.Property(o => o.Status).HasDefaultValue(OrganisationStatuses.Pending);
            entity.Property(o => o.TrustScore).HasDefaultValue(50);
            entity.Property(o => o.TotalDonatedKg).HasDefaultValue(0m);
            entity.Property(o => o.ReviewCount).HasDefaultValue(0);
            entity.Property(o => o.CreatedAt).HasDefaultValueSql("now()");
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_organisations_kind", "kind in ('business', 'ngo')");
                t.HasCheckConstraint("ck_organisations_status", "status in ('pending', 'active', 'suspended')");
                t.HasCheckConstraint("ck_organisations_trust_score", "trust_score between 0 and 100");
            });
        });

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.Property(l => l.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(l => l.Type).HasDefaultValue(ListingTypes.Discounted);
            entity.Property(l => l.Status).HasDefaultValue(ListingStatuses.Active);
            entity.Property(l => l.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(l => l.Organisation).WithMany().HasForeignKey(l => l.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(l => l.OrganisationId);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_listings_type", "type in ('free', 'discounted', 'bulk')");
                t.HasCheckConstraint("ck_listings_status", "status in ('active', 'archived')");
                t.HasCheckConstraint("ck_listings_portions_total", "portions_total > 0");
                // Last line of defence against overselling, behind the conditional UPDATE.
                t.HasCheckConstraint("ck_listings_portions_available", "portions_available >= 0");
            });
        });

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(r => r.Status).HasDefaultValue(ReservationStatuses.Confirmed);
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Listing).WithMany().HasForeignKey(r => r.ListingId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(r => r.Organisation).WithMany().HasForeignKey(r => r.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => r.UserId);
            // A code only has to be unique within the organisation that scans it.
            entity.HasIndex(r => new { r.OrganisationId, r.PickupCode }).IsUnique();
            entity.HasIndex(r => r.QrToken).IsUnique();
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_reservations_status", "status in ('confirmed', 'completed', 'cancelled')");
                t.HasCheckConstraint("ck_reservations_portion_count", "portion_count > 0");
            });
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(r => r.Reservation).WithMany().HasForeignKey(r => r.ReservationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Organisation).WithMany().HasForeignKey(r => r.OrganisationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => r.ReservationId).IsUnique();
            entity.HasIndex(r => new { r.OrganisationId, r.CreatedAt });
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("ck_reviews_rating", "rating between 1 and 5");
                t.HasCheckConstraint("ck_reviews_comment", "char_length(comment) <= 500");
            });
        });

        // Postgres convention and the Supabase schema both use snake_case. The table name is
        // renamed first because key and index names are derived from it.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            entityType.SetTableName(ToSnakeCase(entityType.GetTableName()!));
            foreach (var property in entityType.GetProperties())
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            foreach (var key in entityType.GetKeys())
                key.SetName(ToSnakeCase(key.GetName()!));
            foreach (var foreignKey in entityType.GetForeignKeys())
                foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()!));
            foreach (var index in entityType.GetIndexes())
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()!));
        }
    }

    private static string ToSnakeCase(string name) =>
        Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant();
}
