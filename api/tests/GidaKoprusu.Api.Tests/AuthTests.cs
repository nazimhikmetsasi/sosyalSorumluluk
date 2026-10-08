using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class AuthTests
{
    private const string WrongOrExpired = "Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.";

    private readonly ApiFactory _factory;

    public AuthTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.local";

    [Fact]
    public async Task First_login_creates_a_buyer_and_returns_a_working_token()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();

        var sent = await client.PostAsJsonAsync("/auth/otp", new { email = email.ToUpperInvariant() });
        Assert.Equal(HttpStatusCode.NoContent, sent.StatusCode);

        var code = _factory.Emails.LastCodeFor(email);
        Assert.Matches("^[0-9]{8}$", code);

        var verified = await client.PostAsJsonAsync("/auth/verify", new { email, code });
        Assert.Equal(HttpStatusCode.OK, verified.StatusCode);
        var body = await verified.Content.ReadFromJsonAsync<JsonElement>();
        var account = body.GetProperty("account");
        Assert.Equal(email, account.GetProperty("email").GetString());
        Assert.Equal("buyer", account.GetProperty("role").GetString());
        Assert.Equal(JsonValueKind.Null, account.GetProperty("organisationId").ValueKind);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        var me = await client.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal(account.GetProperty("id").GetString(), me.GetProperty("id").GetString());
    }

    [Fact]
    public async Task Invalid_email_is_rejected_with_a_turkish_message()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/otp", new { email = "not-an-email" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Geçerli bir e-posta adresi girin.", await response.DetailAsync());
    }

    [Fact]
    public async Task Five_wrong_codes_lock_the_code_even_for_the_right_one()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/auth/otp", new { email });
        var code = _factory.Emails.LastCodeFor(email);
        var wrong = code == "00000000" ? "11111111" : "00000000";

        for (var attempt = 0; attempt < 5; attempt++)
        {
            var response = await client.PostAsJsonAsync("/auth/verify", new { email, code = wrong });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("Kod hatalı.", await response.DetailAsync());
        }

        var locked = await client.PostAsJsonAsync("/auth/verify", new { email, code });
        Assert.Equal(HttpStatusCode.BadRequest, locked.StatusCode);
        Assert.Equal(WrongOrExpired, await locked.DetailAsync());
    }

    [Fact]
    public async Task Code_expires_after_ten_minutes()
    {
        var client = _factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/auth/otp", new { email });
        var code = _factory.Emails.LastCodeFor(email);

        _factory.Clock.Now = TestClock.Noon.AddMinutes(11);
        var response = await client.PostAsJsonAsync("/auth/verify", new { email, code });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(WrongOrExpired, await response.DetailAsync());
    }

    [Fact]
    public async Task Me_requires_a_token()
    {
        var response = await _factory.CreateClient().GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Seeded_admin_email_signs_in_as_admin()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/auth/otp", new { email = ApiFactory.AdminEmail });

        var verified = await client.PostAsJsonAsync("/auth/verify",
            new { email = ApiFactory.AdminEmail, code = _factory.Emails.LastCodeFor(ApiFactory.AdminEmail) });

        var body = await verified.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("admin", body.GetProperty("account").GetProperty("role").GetString());
    }
}
