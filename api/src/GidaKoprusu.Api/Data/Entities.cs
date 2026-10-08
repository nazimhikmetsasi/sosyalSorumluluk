namespace GidaKoprusu.Api.Data;

// Statuses and roles are stored as the same lowercase strings Supabase used, so the seed SQL
// and the frontend keep working without a mapping layer.
public static class Roles
{
    public const string Buyer = "buyer";
    public const string Business = "business";
    public const string Ngo = "ngo";
    public const string Admin = "admin";
}

public static class OrganisationKinds
{
    public const string Business = "business";
    public const string Ngo = "ngo";
}

public static class OrganisationStatuses
{
    public const string Pending = "pending";
    public const string Active = "active";
    public const string Suspended = "suspended";
}

public static class ListingTypes
{
    public const string Free = "free";
    public const string Discounted = "discounted";
    public const string Bulk = "bulk";
}

public static class ListingStatuses
{
    public const string Active = "active";
    public const string Archived = "archived";
}

public static class ReservationStatuses
{
    public const string Confirmed = "confirmed";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
}

// Supabase kept identity (auth.users) and profile (public.profiles) apart; here one table
// holds both. Role and organisation are only ever changed by an admin endpoint.
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public string Role { get; set; } = Roles.Buyer;
    public string? OrganisationId { get; set; }
    public Organisation? Organisation { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OtpCode
{
    public required string Email { get; set; }
    public required string CodeHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }
}

public class Organisation
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Kind { get; set; }
    public string Status { get; set; } = OrganisationStatuses.Pending;
    public string? Type { get; set; }
    public string? Avatar { get; set; }
    public string? Cover { get; set; }
    public string? Address { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public int TrustScore { get; set; } = 50;
    public decimal TotalDonatedKg { get; set; }
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Listing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Type { get; set; } = ListingTypes.Discounted;
    public decimal PriceOriginal { get; set; }
    public decimal PriceDiscounted { get; set; }
    public int PortionsTotal { get; set; } = 1;
    public int PortionsAvailable { get; set; }
    public string? PickupStartTime { get; set; }
    public string? PickupEndTime { get; set; }
    public string? Image { get; set; }
    public List<string> Allergens { get; set; } = [];
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public decimal WeightKg { get; set; }
    public decimal Co2ReductionKg { get; set; }
    public string Status { get; set; } = ListingStatuses.Active;
    public DateTime CreatedAt { get; set; }
}

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? ListingId { get; set; }
    public Listing? Listing { get; set; }
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public required string ListingTitle { get; set; }
    public string? Image { get; set; }
    public int PortionCount { get; set; } = 1;
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = ReservationStatuses.Confirmed;
    public string? PickupStartTime { get; set; }
    public string? PickupEndTime { get; set; }
    public required string PickupCode { get; set; }
    public required string QrToken { get; set; }
    // Snapshotted when the order is placed, so editing the listing later cannot rewrite what
    // someone already rescued.
    public decimal SavedKg { get; set; }
    public decimal Co2Kg { get; set; }
    public decimal SavedAmount { get; set; }
    public DateTime? ListingCreatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public required string OrganisationId { get; set; }
    public Organisation Organisation { get; set; } = null!;
    public string AuthorName { get; set; } = "Gıda Kurtarıcısı";
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public List<string> Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
