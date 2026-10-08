namespace GidaKoprusu.Api.Common;

public sealed class Uploads(IConfiguration config, IWebHostEnvironment env, TimeProvider clock)
{
    public const long MaxBytes = 2 * 1024 * 1024;

    private static readonly Dictionary<string, string> Extensions = new()
    {
        ["image/jpeg"] = "jpg",
        ["image/png"] = "png",
        ["image/webp"] = "webp",
    };

    public string Root => Path.GetFullPath(config["Uploads:Root"] ?? "uploads", env.ContentRootPath);

    // Writes <root>/<folder>/<name>.<ext> and returns an absolute URL. The path stays the same
    // when an image is replaced, so a version query string makes browsers fetch the new one.
    public async Task<string> SaveImageAsync(IFormFile file, string folder, string name, HttpRequest request, CancellationToken ct)
    {
        if (!Extensions.TryGetValue(file.ContentType, out var extension))
            throw AppException.BadRequest("Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.");
        if (file.Length > MaxBytes)
            throw AppException.BadRequest("Görsel 2 MB sınırını aşıyor.");

        var directory = Path.Combine(Root, folder);
        Directory.CreateDirectory(directory);
        var fileName = $"{name}.{extension}";
        await using (var stream = File.Create(Path.Combine(directory, fileName)))
            await file.CopyToAsync(stream, ct);

        return $"{request.Scheme}://{request.Host}/uploads/{folder}/{fileName}?v={clock.GetUtcNow().ToUnixTimeMilliseconds()}";
    }
}
