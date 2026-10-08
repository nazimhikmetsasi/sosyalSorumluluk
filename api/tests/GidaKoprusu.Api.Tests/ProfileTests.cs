using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GidaKoprusu.Api.Common;
using GidaKoprusu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GidaKoprusu.Api.Tests;

[Collection(ApiCollection.Name)]
public class ProfileTests
{
    private readonly ApiFactory _factory;

    public ProfileTests(ApiFactory factory)
    {
        _factory = factory;
        factory.Clock.Now = TestClock.Noon;
    }

    private static MultipartFormDataContent ImageForm(byte[] bytes, string contentType)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", "image" } };
    }

    [Fact]
    public async Task Put_me_updates_profile_fields_but_never_the_role()
    {
        var (client, user) = await _factory.SignInAsync();

        var response = await client.PutAsJsonAsync("/me",
            new { displayName = "Ayşe", city = "Bursa", district = "Nilüfer", phone = "555", bio = "Merhaba", role = "admin" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var account = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ayşe", account.GetProperty("displayName").GetString());
        Assert.Equal("Bursa", account.GetProperty("city").GetString());
        Assert.Equal("buyer", account.GetProperty("role").GetString());
        var storedRole = await _factory.DbAsync(db => db.Users.Where(u => u.Id == user.Id).Select(u => u.Role).SingleAsync());
        Assert.Equal(Roles.Buyer, storedRole);
    }

    [Fact]
    public async Task Avatar_upload_stores_the_file_and_serves_it()
    {
        var (client, user) = await _factory.SignInAsync();
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

        var response = await client.PostAsync("/me/avatar", ImageForm(png, "image/png"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var publicUrl = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("publicUrl").GetString()!;
        Assert.Contains($"/uploads/avatars/{user.Id}.png?v=", publicUrl);

        var served = await client.GetAsync(new Uri(publicUrl).PathAndQuery);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal(png, await served.Content.ReadAsByteArrayAsync());

        var me = await client.GetFromJsonAsync<JsonElement>("/me");
        Assert.Equal(publicUrl, me.GetProperty("avatarUrl").GetString());
    }

    [Fact]
    public async Task Avatar_rejects_files_that_are_not_images()
    {
        var (client, _) = await _factory.SignInAsync();

        var response = await client.PostAsync("/me/avatar", ImageForm([1, 2, 3], "text/plain"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.", await response.DetailAsync());
    }

    [Fact]
    public async Task Avatar_rejects_files_over_two_megabytes()
    {
        var (client, _) = await _factory.SignInAsync();

        var response = await client.PostAsync("/me/avatar", ImageForm(new byte[Uploads.MaxBytes + 1], "image/png"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Görsel 2 MB sınırını aşıyor.", await response.DetailAsync());
    }
}
