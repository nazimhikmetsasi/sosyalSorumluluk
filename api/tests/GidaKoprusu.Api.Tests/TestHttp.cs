using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

public static class TestHttp
{
    // The Turkish message the frontend shows, from a ProblemDetails body.
    public static async Task<string?> DetailAsync(this HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString();
}
