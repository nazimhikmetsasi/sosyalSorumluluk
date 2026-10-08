using System.Net.Http.Headers;
using GidaKoprusu.Api.Auth;
using GidaKoprusu.Api.Data;
using Microsoft.Extensions.DependencyInjection;

namespace GidaKoprusu.Api.Tests;

public static class TestAuth
{
    // Skips the OTP round trip: writes the user straight to the database and signs a token
    // with the API's own TokenService. AuthTests cover the real OTP flow.
    public static async Task<(HttpClient Client, User User)> SignInAsync(
        this ApiFactory factory, string role = Roles.Buyer, string? organisationId = null, string? displayName = null)
    {
        var user = new User
        {
            Email = $"{Guid.NewGuid():N}@test.local",
            Role = role,
            OrganisationId = organisationId,
            DisplayName = displayName ?? "Test Kullanıcı",
            CreatedAt = factory.Clock.UtcNow,
        };
        await factory.DbAsync(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var token = factory.Services.GetRequiredService<TokenService>().Create(user);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (client, user);
    }
}
