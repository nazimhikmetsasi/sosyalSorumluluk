using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class SchemaTests
{
    private readonly ApiFactory _factory;

    public SchemaTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static string NewOrganisationId() => "org_" + Guid.NewGuid().ToString("N")[..12];

    [Fact]
    public async Task Listing_round_trips_allergens_and_organisation_gets_database_defaults()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Şema Fırını", Kind = OrganisationKinds.Business });
            db.Listings.Add(new Listing
            {
                OrganisationId = organisationId,
                Title = "Poğaça",
                PortionsTotal = 3,
                PortionsAvailable = 3,
                Allergens = ["Gluten", "Susam"],
            });
            await db.SaveChangesAsync();
        });

        var (allergens, trustScore, status) = await _factory.DbAsync(async db =>
        {
            var listing = await db.Listings.SingleAsync(l => l.OrganisationId == organisationId);
            var organisation = await db.Organisations.SingleAsync(o => o.Id == organisationId);
            return (listing.Allergens, organisation.TrustScore, organisation.Status);
        });

        Assert.Equal(new[] { "Gluten", "Susam" }, allergens);
        Assert.Equal(50, trustScore);
        Assert.Equal(OrganisationStatuses.Pending, status);
    }

    [Fact]
    public async Task Tables_and_columns_use_snake_case_names()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Ad Testi", Kind = OrganisationKinds.Ngo });
            await db.SaveChangesAsync();
        });

        var count = await _factory.DbAsync(db => db.Database
            .SqlQuery<int>($"select count(*)::int as \"Value\" from organisations where id = {organisationId} and trust_score = 50")
            .SingleAsync());

        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Database_rejects_a_listing_with_zero_portions()
    {
        var organisationId = NewOrganisationId();
        await _factory.DbAsync(async db =>
        {
            db.Organisations.Add(new Organisation { Id = organisationId, Name = "Kısıt Testi", Kind = OrganisationKinds.Business });
            await db.SaveChangesAsync();
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => _factory.DbAsync(async db =>
        {
            db.Listings.Add(new Listing { OrganisationId = organisationId, Title = "Boş", PortionsTotal = 0 });
            await db.SaveChangesAsync();
        }));
    }
}
