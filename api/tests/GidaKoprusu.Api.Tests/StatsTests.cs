using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class StatsTests
{
    private readonly ApiFactory _factory;

    public StatsTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private Task<JsonElement> PlatformAsync() =>
        _factory.CreateClient().GetFromJsonAsync<JsonElement>("/stats/platform");

    [Fact]
    public async Task Platform_stats_count_only_delivered_orders()
    {
        var before = await PlatformAsync();

        await _factory.CompletedOrderAsync(portions: 2, weightKg: 2); // 2 of 2 portions, 2 kg rescued
        var after = await PlatformAsync();

        Assert.Equal(2, after.GetProperty("totalPortions").GetInt32() - before.GetProperty("totalPortions").GetInt32());
        var kg = after.GetProperty("totalFoodSavedKg").GetDecimal() - before.GetProperty("totalFoodSavedKg").GetDecimal();
        Assert.InRange(kg, 1.9m, 2.1m); // both totals are rounded to one decimal
        Assert.True(after.GetProperty("activeBusinesses").GetInt32() >= 1);
        Assert.True(after.GetProperty("totalUsers").GetInt32() >= 2);
    }

    [Fact]
    public async Task Leaderboard_ranks_by_points_and_flags_the_caller()
    {
        var order = await _factory.CompletedOrderAsync(portions: 30, weightKg: 3, buyerName: "Lider Test");

        var rows = await order.Buyer.GetFromJsonAsync<JsonElement>("/stats/leaderboard?limit=100");

        var me = Assert.Single(rows.EnumerateArray(), r => r.GetProperty("isCurrentUser").GetBoolean());
        Assert.Equal("Lider Test", me.GetProperty("name").GetString());
        Assert.Equal(1500, me.GetProperty("points").GetInt32());
        Assert.Equal(3.0m, me.GetProperty("kg").GetDecimal());
        var ranks = rows.EnumerateArray().Select(r => r.GetProperty("rank").GetInt32()).ToList();
        Assert.Equal(Enumerable.Range(1, ranks.Count), ranks);
    }
}
