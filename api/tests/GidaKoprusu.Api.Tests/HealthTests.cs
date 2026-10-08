using System.Net;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class HealthTests
{
    private readonly ApiFactory _factory;

    public HealthTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    [Fact]
    public async Task Health_reports_ok_when_the_database_is_reachable()
    {
        var response = await _factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("ok", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Unknown_routes_return_problem_details()
    {
        var response = await _factory.CreateClient().GetAsync("/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
