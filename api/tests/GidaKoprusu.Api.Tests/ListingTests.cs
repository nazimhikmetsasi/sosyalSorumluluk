using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ListingTests
{
    private readonly ApiFactory _factory;

    public ListingTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static object NewListing(int portions = 4) => new
    {
        title = "Akşam Poğaçası",
        description = "Karışık paket",
        category = "Unlu Mamüller",
        type = "discounted",
        priceOriginal = 120,
        priceDiscounted = 30,
        portions,
        pickupStartTime = "18:00",
        pickupEndTime = "21:00",
        image = "https://example.com/p.jpg",
        allergens = new[] { "Gluten" },
        lat = 40.18,
        lng = 29.06,
        weightKg = 2,
        co2ReductionKg = 5,
    };

    private static async Task<List<string>> IdsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonElement>("/listings"))
            .EnumerateArray().Select(l => l.GetProperty("id").GetString()!).ToList();

    [Fact]
    public async Task A_business_creates_a_listing_for_its_own_organisation()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var response = await business.PostAsJsonAsync("/listings", NewListing(portions: 4));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var listing = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(organisation.Id, listing.GetProperty("businessId").GetString());
        Assert.Equal("Test Kurum", listing.GetProperty("businessName").GetString());
        Assert.Equal(4, listing.GetProperty("portionsTotal").GetInt32());
        Assert.Equal(4, listing.GetProperty("portionsAvailable").GetInt32());
        Assert.Equal(75, listing.GetProperty("discountPercentage").GetInt32());
        Assert.Equal("Gluten", listing.GetProperty("allergens")[0].GetString());
        Assert.Equal("active", listing.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Buyers_and_ngos_cannot_create_listings()
    {
        var ngo = await _factory.CreateOrganisationAsync(OrganisationKinds.Ngo);
        var (buyer, _) = await _factory.SignInAsync();
        var (ngoUser, _) = await _factory.SignInAsync(Roles.Ngo, ngo.Id);

        var byBuyer = await buyer.PostAsJsonAsync("/listings", NewListing());
        var byNgo = await ngoUser.PostAsJsonAsync("/listings", NewListing());

        Assert.Equal(HttpStatusCode.Forbidden, byBuyer.StatusCode);
        Assert.Equal("Yalnızca işletme hesapları ilan açabilir.", await byBuyer.DetailAsync());
        Assert.Equal(HttpStatusCode.Forbidden, byNgo.StatusCode);
    }

    [Fact]
    public async Task Listing_validation_rejects_bad_input()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var noPortions = await business.PostAsJsonAsync("/listings", new { title = "X", portions = 0 });
        var badTime = await business.PostAsJsonAsync("/listings", new { title = "X", portions = 1, pickupStartTime = "6pm" });

        Assert.Equal("Porsiyon sayısı en az 1 olmalı.", await noPortions.DetailAsync());
        Assert.Equal("Teslim saati SS:dd biçiminde olmalı.", await badTime.DetailAsync());
    }

    [Fact]
    public async Task Only_the_owning_business_edits_or_archives_a_listing()
    {
        var own = await _factory.CreateOrganisationAsync();
        var other = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(own.Id);
        var (owner, _) = await _factory.SignInAsync(Roles.Business, own.Id);
        var (stranger, _) = await _factory.SignInAsync(Roles.Business, other.Id);

        var strangerEdit = await stranger.PatchAsJsonAsync($"/listings/{listing.Id}/portions", new { portionsAvailable = 0 });
        Assert.Equal(HttpStatusCode.Forbidden, strangerEdit.StatusCode);
        Assert.Equal("Bu ilan üzerinde yetkiniz yok.", await strangerEdit.DetailAsync());

        var ownerEdit = await owner.PatchAsJsonAsync($"/listings/{listing.Id}/portions", new { portionsAvailable = 2 });
        Assert.Equal(HttpStatusCode.OK, ownerEdit.StatusCode);
        Assert.Equal(2, (await ownerEdit.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("portionsAvailable").GetInt32());

        var archive = await owner.PostAsync($"/listings/{listing.Id}/archive", null);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);
        Assert.DoesNotContain(listing.Id.ToString(), await IdsAsync(owner));
    }

    [Fact]
    public async Task Get_listings_archives_listings_whose_pickup_window_has_closed()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var open = await _factory.CreateListingAsync(organisation.Id, pickupStart: "13:00", pickupEnd: "18:00");
        var closed = await _factory.CreateListingAsync(organisation.Id, pickupStart: "09:00", pickupEnd: "11:00");
        var (buyer, _) = await _factory.SignInAsync();

        var ids = await IdsAsync(buyer);

        Assert.Contains(open.Id.ToString(), ids);
        Assert.DoesNotContain(closed.Id.ToString(), ids);
        var status = await _factory.DbAsync(db => db.Listings.Where(l => l.Id == closed.Id).Select(l => l.Status).SingleAsync());
        Assert.Equal(ListingStatuses.Archived, status);
    }

    [Fact]
    public async Task Listings_of_a_pending_organisation_are_visible_only_to_that_organisation()
    {
        var pending = await _factory.CreateOrganisationAsync(status: OrganisationStatuses.Pending);
        var listing = await _factory.CreateListingAsync(pending.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var (owner, _) = await _factory.SignInAsync(Roles.Business, pending.Id);

        Assert.DoesNotContain(listing.Id.ToString(), await IdsAsync(buyer));
        Assert.Contains(listing.Id.ToString(), await IdsAsync(owner));
    }
}
