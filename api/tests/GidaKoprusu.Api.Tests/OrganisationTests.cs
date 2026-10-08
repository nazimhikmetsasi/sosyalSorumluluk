using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class OrganisationTests
{
    private readonly ApiFactory _factory;

    public OrganisationTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static async Task<List<string>> IdsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonElement>("/organisations"))
            .EnumerateArray().Select(o => o.GetProperty("id").GetString()!).ToList();

    [Fact]
    public async Task Pending_organisations_are_hidden_from_buyers_but_not_from_admins()
    {
        var active = await _factory.CreateOrganisationAsync();
        var pending = await _factory.CreateOrganisationAsync(status: OrganisationStatuses.Pending);
        var (buyer, _) = await _factory.SignInAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var buyerIds = await IdsAsync(buyer);
        Assert.Contains(active.Id, buyerIds);
        Assert.DoesNotContain(pending.Id, buyerIds);

        var adminIds = await IdsAsync(admin);
        Assert.Contains(pending.Id, adminIds);
    }

    [Fact]
    public async Task Admin_creates_an_active_organisation_and_cannot_set_its_score()
    {
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var id = "org_" + Guid.NewGuid().ToString("N")[..8];
        var request = new { id, name = "Yeni Fırın", kind = "business", type = "Fırın", trustScore = 99, rating = 5 };

        var created = await admin.PostAsJsonAsync("/organisations", request);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("active", body.GetProperty("status").GetString());
        Assert.Equal(50, body.GetProperty("trustScore").GetInt32());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("rating").ValueKind);

        var duplicate = await admin.PostAsJsonAsync("/organisations", request);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal("Bu kimlikte bir kurum zaten var.", await duplicate.DetailAsync());
    }

    [Fact]
    public async Task Organisation_id_must_be_a_safe_slug()
    {
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var response = await admin.PostAsJsonAsync("/organisations", new { id = "../etc", name = "Kötü", kind = "business" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Kurum kimliği yalnızca küçük harf, rakam, - ve _ içerebilir.", await response.DetailAsync());
    }

    [Fact]
    public async Task Only_admins_create_organisations_or_change_their_status()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (buyer, _) = await _factory.SignInAsync();

        var create = await buyer.PostAsJsonAsync("/organisations", new { id = "org_x", name = "X", kind = "business" });
        var status = await buyer.PatchAsJsonAsync($"/organisations/{organisation.Id}/status", new { status = "suspended" });
        var anonymous = await _factory.CreateClient().PostAsJsonAsync("/organisations", new { id = "org_y", name = "Y", kind = "business" });

        Assert.Equal(HttpStatusCode.Forbidden, create.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, status.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task Admin_suspends_an_organisation()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);

        var response = await admin.PatchAsJsonAsync($"/organisations/{organisation.Id}/status", new { status = "suspended" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("suspended", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Grant_binds_a_user_to_an_organisation_and_members_lists_them()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var (_, target) = await _factory.SignInAsync();

        var grant = await admin.PostAsJsonAsync("/admin/grants",
            new { email = target.Email.ToUpperInvariant(), organisationId = organisation.Id, role = "business" });
        Assert.Equal(HttpStatusCode.NoContent, grant.StatusCode);

        var members = await admin.GetFromJsonAsync<JsonElement>($"/organisations/{organisation.Id}/members");
        var member = Assert.Single(members.EnumerateArray());
        Assert.Equal(target.Email, member.GetProperty("email").GetString());
        Assert.Equal("business", member.GetProperty("role").GetString());

        var revoke = await admin.PostAsJsonAsync("/admin/grants", new { email = target.Email, organisationId = (string?)null, role = "buyer" });
        Assert.Equal(HttpStatusCode.NoContent, revoke.StatusCode);
        var stored = await _factory.DbAsync(db => db.Users.SingleAsync(u => u.Id == target.Id));
        Assert.Equal(Roles.Buyer, stored.Role);
        Assert.Null(stored.OrganisationId);
    }

    [Fact]
    public async Task Grant_rejects_unknown_users_and_admin_role()
    {
        var organisation = await _factory.CreateOrganisationAsync();
        var (admin, _) = await _factory.SignInAsync(Roles.Admin);
        var (_, target) = await _factory.SignInAsync();

        var unknown = await admin.PostAsJsonAsync("/admin/grants", new { email = "nobody@test.local", organisationId = organisation.Id, role = "business" });
        var toAdmin = await admin.PostAsJsonAsync("/admin/grants", new { email = target.Email, organisationId = organisation.Id, role = "admin" });

        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal("Kullanıcı bulunamadı.", await unknown.DetailAsync());
        Assert.Equal(HttpStatusCode.BadRequest, toAdmin.StatusCode);
        Assert.Equal("Geçersiz rol.", await toAdmin.DetailAsync());
    }

    [Fact]
    public async Task A_business_may_change_only_its_own_organisation_images()
    {
        var own = await _factory.CreateOrganisationAsync();
        var other = await _factory.CreateOrganisationAsync();
        var (business, _) = await _factory.SignInAsync(Roles.Business, own.Id);

        HttpContent Form()
        {
            var file = new ByteArrayContent([1, 2, 3]);
            file.Headers.ContentType = new MediaTypeHeaderValue("image/webp");
            return new MultipartFormDataContent { { file, "file", "logo" } };
        }

        var mine = await business.PostAsync($"/organisations/{own.Id}/images/avatar", Form());
        var theirs = await business.PostAsync($"/organisations/{other.Id}/images/avatar", Form());

        Assert.Equal(HttpStatusCode.OK, mine.StatusCode);
        Assert.Contains($"/uploads/organisations/{own.Id}/avatar.webp?v=",
            (await mine.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("publicUrl").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, theirs.StatusCode);
        Assert.Equal("Bu kurumun görselini değiştirme yetkiniz yok.", await theirs.DetailAsync());
    }
}
