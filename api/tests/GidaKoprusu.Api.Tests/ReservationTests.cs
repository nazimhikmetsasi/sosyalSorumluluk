using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ReservationTests
{
    private readonly ApiFactory _factory;

    public ReservationTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private Task<int> PortionsLeftAsync(Guid listingId) =>
        _factory.DbAsync(db => db.Listings.Where(l => l.Id == listingId).Select(l => l.PortionsAvailable).SingleAsync());

    [Fact]
    public async Task Price_impact_and_codes_are_computed_by_the_server()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5, priceOriginal: 100, priceDiscounted: 40, weightKg: 2);
        var (buyer, user) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id, portionCount: 2);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(user.Id.ToString(), order.GetProperty("userId").GetString());
        Assert.Equal(organisation.Id, order.GetProperty("businessId").GetString());
        Assert.Equal("Test Kurum", order.GetProperty("businessName").GetString());
        Assert.Equal("confirmed", order.GetProperty("status").GetString());
        Assert.Equal(80m, order.GetProperty("paidAmount").GetDecimal());
        Assert.Equal(0.8m, order.GetProperty("savedKg").GetDecimal());
        Assert.Equal(2m, order.GetProperty("co2Kg").GetDecimal());
        Assert.Equal(120m, order.GetProperty("savedAmount").GetDecimal());
        Assert.Matches("^GK-[0-9]{6}$", order.GetProperty("pickupCode").GetString());
        Assert.Matches("^[0-9a-f]{48}$", order.GetProperty("qrToken").GetString());
        Assert.Equal(3, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Twenty_buyers_racing_for_the_last_portion_produce_exactly_one_order()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 1);
        var buyers = new List<HttpClient>();
        for (var i = 0; i < 20; i++)
            buyers.Add((await _factory.SignInAsync()).Client);

        var responses = await Task.WhenAll(buyers.Select(buyer => buyer.ReserveAsync(listing.Id)));

        Assert.Equal(1, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.Equal(19, responses.Count(r => r.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(0, await PortionsLeftAsync(listing.Id));
        var orders = await _factory.DbAsync(db => db.Reservations.CountAsync(r => r.ListingId == listing.Id));
        Assert.Equal(1, orders);
    }

    [Fact]
    public async Task Asking_for_more_than_is_left_is_rejected()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5);
        var (buyer, _) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id, portionCount: 6);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Yeterli porsiyon kalmadı.", await response.DetailAsync());
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Businesses_cannot_reserve()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var response = await business.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("İşletme ve yönetici hesapları rezervasyon yapamaz.", await response.DetailAsync());
    }

    [Fact]
    public async Task An_ngo_can_reserve()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var ngo = await _factory.CreateOrganisationAsync(OrganisationKinds.Ngo);
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (ngoUser, _) = await _factory.SignInAsync(Roles.Ngo, ngo.Id);

        var response = await ngoUser.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task A_listing_past_its_pickup_window_cannot_be_reserved()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, pickupStart: "09:00", pickupEnd: "11:00");
        var (buyer, _) = await _factory.SignInAsync();

        var response = await buyer.ReserveAsync(listing.Id);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Bu ilanın teslim süresi doldu.", await response.DetailAsync());
    }

    [Fact]
    public async Task Cancelling_returns_the_portions()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, portions: 5);
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id, 2)).Content.ReadFromJsonAsync<JsonElement>();

        var response = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("cancelled", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));

        var again = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal(5, await PortionsLeftAsync(listing.Id));
    }

    [Fact]
    public async Task Cancelling_closes_thirty_minutes_before_pickup()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id, pickupStart: "13:00", pickupEnd: "18:00");
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        _factory.Clock.Now = TestClock.Noon.AddMinutes(40); // 12:40 in Istanbul, pickup at 13:00
        var response = await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Teslim saatine 30 dakikadan az kaldığı için iptal edilemez.", await response.DetailAsync());
    }

    [Fact]
    public async Task Nobody_else_can_cancel_an_order()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var (stranger, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        var response = await stranger.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("Sipariş bulunamadı.", await response.DetailAsync());
    }

    [Fact]
    public async Task Each_side_sees_only_its_own_orders()
    {
        var bakery = await _factory.CreateOrganisationAsync();
        var grocer = await _factory.CreateOrganisationAsync();
        var bread = await _factory.CreateListingAsync(bakery.Id);
        var apples = await _factory.CreateListingAsync(grocer.Id);
        var (alice, _) = await _factory.SignInAsync();
        var (bob, _) = await _factory.SignInAsync();
        var (bakeryUser, _) = await _factory.SignInAsync(Roles.Business, bakery.Id);
        var (grocerUser, _) = await _factory.SignInAsync(Roles.Business, grocer.Id);
        var aliceOrder = (await (await alice.ReserveAsync(bread.Id)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        var bobOrder = (await (await bob.ReserveAsync(apples.Id)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();

        async Task<List<string>> Ids(HttpClient client) =>
            (await client.GetFromJsonAsync<JsonElement>("/reservations")).EnumerateArray()
                .Select(r => r.GetProperty("id").GetString()!).ToList();

        Assert.Equal(new[] { aliceOrder! }, await Ids(alice));
        Assert.Equal(new[] { aliceOrder! }, await Ids(bakeryUser));
        Assert.Equal(new[] { bobOrder! }, await Ids(grocerUser));
    }
}
