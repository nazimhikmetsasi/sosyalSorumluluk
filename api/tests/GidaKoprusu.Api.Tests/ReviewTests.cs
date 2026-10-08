using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Organisations;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ReviewTests
{
    private readonly ApiFactory _factory;

    public ReviewTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static object Review(CompletedOrder order, int rating = 5) => new
    {
        reservationId = order.ReservationId,
        organisationId = order.Organisation.Id,
        rating,
        comment = "Çok taze geldi",
        tags = new[] { "Taze" },
    };

    [Fact]
    public async Task A_review_after_delivery_updates_the_organisation_score()
    {
        var order = await _factory.CompletedOrderAsync(buyerName: "Ayşe K.");

        var response = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 5));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var review = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ayşe K.", review.GetProperty("author").GetString());
        Assert.Equal("Çok taze geldi", review.GetProperty("comment").GetString());
        Assert.Equal("Taze", review.GetProperty("tags")[0].GetString());

        var organisation = await _factory.DbAsync(db => db.Organisations.SingleAsync(o => o.Id == order.Organisation.Id));
        Assert.Equal(TrustScore.Compute(1, 5, 1), organisation.TrustScore);
        Assert.Equal(5.0m, organisation.Rating);
        Assert.Equal(1, organisation.ReviewCount);

        var all = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/reviews");
        Assert.Contains(all.EnumerateArray(), r => r.GetProperty("id").GetString() == review.GetProperty("id").GetString());
    }

    [Fact]
    public async Task A_second_review_for_the_same_order_conflicts()
    {
        var order = await _factory.CompletedOrderAsync();
        await order.Buyer.PostAsJsonAsync("/reviews", Review(order));

        var second = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 1));

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal("Bu siparişe zaten yorum yazdınız.", await second.DetailAsync());
    }

    [Fact]
    public async Task Only_the_buyer_of_a_delivered_order_may_review()
    {
        var order = await _factory.CompletedOrderAsync();
        var (stranger, _) = await _factory.SignInAsync();
        var organisation = await _factory.CreateOrganisationAsync();
        var listing = await _factory.CreateListingAsync(organisation.Id);
        var (buyer, _) = await _factory.SignInAsync();
        var pending = await (await buyer.ReserveAsync(listing.Id)).Content.ReadFromJsonAsync<JsonElement>();

        var byStranger = await stranger.PostAsJsonAsync("/reviews", Review(order));
        var beforeDelivery = await buyer.PostAsJsonAsync("/reviews",
            new { reservationId = pending.GetProperty("id").GetGuid(), organisationId = organisation.Id, rating = 4 });

        const string message = "Yalnızca teslim aldığınız siparişe yorum yazabilirsiniz.";
        Assert.Equal(HttpStatusCode.Forbidden, byStranger.StatusCode);
        Assert.Equal(message, await byStranger.DetailAsync());
        Assert.Equal(HttpStatusCode.Forbidden, beforeDelivery.StatusCode);
        Assert.Equal(message, await beforeDelivery.DetailAsync());
    }

    [Fact]
    public async Task Rating_must_be_between_one_and_five()
    {
        var order = await _factory.CompletedOrderAsync();

        var response = await order.Buyer.PostAsJsonAsync("/reviews", Review(order, rating: 6));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Puan 1 ile 5 arasında olmalı.", await response.DetailAsync());
    }
}
