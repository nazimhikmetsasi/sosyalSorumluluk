using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class DeliveryTests
{
    private readonly ApiFactory _factory;

    public DeliveryTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private async Task<(Organisation Organisation, HttpClient Buyer, JsonElement Order)> OrderAsync()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var order = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();
        return (organisation, buyer, order);
    }

    private static Task<HttpResponseMessage> ScanAsync(HttpClient client, JsonElement order) =>
        client.PostAsJsonAsync("/deliveries/complete", new { qrToken = order.GetProperty("qrToken").GetString() });

    [Fact]
    public async Task Scanning_completes_the_order_once_and_updates_the_trust_score()
    {
        var (organisation, buyer, order) = await OrderAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);

        var first = await ScanAsync(business, order);
        var second = await ScanAsync(business, order);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(order.GetProperty("id").GetString(), (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal("Bu teslimat daha önce zaten onaylanmış.", await second.DetailAsync());

        var mine = await buyer.GetFromJsonAsync<JsonElement>("/reservations");
        Assert.Equal("completed", mine[0].GetProperty("status").GetString());
        var score = await _factory.DbAsync(db => db.Organisations.Where(o => o.Id == organisation.Id).Select(o => o.TrustScore).SingleAsync());
        Assert.Equal(TrustScore.Compute(0, 0, 1), score);
    }

    [Fact]
    public async Task Another_organisation_cannot_complete_the_order()
    {
        var (_, _, order) = await OrderAsync();
        var other = await _factory.CreateOrganisationAsync();
        var (stranger, _) = await _factory.SignInAsync(Roles.Business, other.Id);

        var response = await ScanAsync(stranger, order);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("Geçersiz QR kod.", await response.DetailAsync());
    }

    [Fact]
    public async Task A_buyer_cannot_complete_an_order()
    {
        var (_, buyer, order) = await OrderAsync();

        var response = await ScanAsync(buyer, order);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("Teslimat yalnızca işletme veya STK hesabıyla onaylanır.", await response.DetailAsync());
    }

    [Fact]
    public async Task A_cancelled_order_cannot_be_delivered()
    {
        var (organisation, buyer, order) = await OrderAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, organisation.Id);
        await buyer.PostAsync($"/reservations/{order.GetProperty("id").GetString()}/cancel", null);

        var response = await ScanAsync(business, order);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Bu sipariş artık teslim edilemez.", await response.DetailAsync());
    }
}
