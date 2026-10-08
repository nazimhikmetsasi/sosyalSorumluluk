using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;

namespace GidaKoprusu.Api.Tests;

public static class TestData
{
    public static async Task<Organisation> CreateOrganisationAsync(
        this ApiFactory factory, string kind = OrganisationKinds.Business, string status = OrganisationStatuses.Active)
    {
        var organisation = new Organisation
        {
            Id = "org_" + Guid.NewGuid().ToString("N")[..12],
            Name = "Test Kurum",
            Kind = kind,
            Status = status,
            Address = "Test Mah. No:1, Bursa",
            Phone = "+90 224 000 0000",
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Organisations.Add(organisation);
            await db.SaveChangesAsync();
        });
        return organisation;
    }

    // Defaults: created at the test clock's noon, picked up 13:00-18:00 Istanbul time, so it is
    // open for reservations and cancellable until 12:30.
    public static async Task<Listing> CreateListingAsync(
        this ApiFactory factory, string organisationId, int portions = 5, string pickupStart = "13:00",
        string pickupEnd = "18:00", decimal priceOriginal = 100m, decimal priceDiscounted = 40m, decimal weightKg = 2m)
    {
        var listing = new Listing
        {
            OrganisationId = organisationId,
            Title = "Test İlan",
            PriceOriginal = priceOriginal,
            PriceDiscounted = priceDiscounted,
            PortionsTotal = portions,
            PortionsAvailable = portions,
            PickupStartTime = pickupStart,
            PickupEndTime = pickupEnd,
            WeightKg = weightKg,
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Listings.Add(listing);
            await db.SaveChangesAsync();
        });
        return listing;
    }

    public static Task<HttpResponseMessage> ReserveAsync(this HttpClient client, Guid listingId, int portionCount = 1) =>
        client.PostAsJsonAsync("/reservations", new { listingId, portionCount });

    // A buyer's order that the organisation has already scanned as delivered.
    public static async Task<CompletedOrder> CompletedOrderAsync(
        this ApiFactory factory, int portions = 1, decimal weightKg = 2m, string? buyerName = null)
    {
        var organisation = await factory.CreateOrganisationAsync();
        var listing = await factory.CreateListingAsync(organisation.Id, portions: portions, weightKg: weightKg);
        var (buyer, buyerUser) = await factory.SignInAsync(displayName: buyerName);
        var reserved = await buyer.ReserveAsync(listing.Id, portions);
        reserved.EnsureSuccessStatusCode();
        var order = await reserved.Content.ReadFromJsonAsync<JsonElement>();

        var (business, _) = await factory.SignInAsync(Roles.Business, organisation.Id);
        var delivered = await business.PostAsJsonAsync("/deliveries/complete", new { qrToken = order.GetProperty("qrToken").GetString() });
        delivered.EnsureSuccessStatusCode();

        return new CompletedOrder(buyer, buyerUser, business, organisation, order.GetProperty("id").GetGuid());
    }
}

public record CompletedOrder(HttpClient Buyer, User BuyerUser, HttpClient Business, Organisation Organisation, Guid ReservationId);
