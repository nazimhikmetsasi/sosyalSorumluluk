using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Seed;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class BursaSeederTests
{
    private readonly ApiFactory _factory;

    public BursaSeederTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    [Fact]
    public async Task Seed_loads_four_organisations_and_seven_listings_and_is_repeatable()
    {
        await _factory.DbAsync(db => BursaSeeder.SeedAsync(db));
        await _factory.DbAsync(db => BursaSeeder.SeedAsync(db));

        var (organisations, listings, scores) = await _factory.DbAsync(async db => (
            await db.Organisations.CountAsync(o => o.Id.StartsWith("bursa_") && o.Status == OrganisationStatuses.Active),
            await db.Listings.CountAsync(l => l.OrganisationId.StartsWith("bursa_") && l.Status == ListingStatuses.Active),
            await db.Organisations.Where(o => o.Id.StartsWith("bursa_")).Select(o => o.TrustScore).Distinct().ToListAsync()));

        Assert.Equal(4, organisations);
        Assert.Equal(7, listings);
        Assert.Equal(new[] { 64 }, scores); // recomputed: no reviews, no deliveries
    }
}
