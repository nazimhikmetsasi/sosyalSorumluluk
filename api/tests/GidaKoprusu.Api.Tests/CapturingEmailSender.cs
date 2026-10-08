using System.Collections.Concurrent;
using GidaKoprusu.Api.Auth;

namespace GidaKoprusu.Api.Tests;

// Stands in for the real sender so a test can read the code that would have been mailed.
public sealed class CapturingEmailSender : IEmailSender
{
    private readonly ConcurrentDictionary<string, string> _codes = new();

    public Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        _codes[email] = code;
        return Task.CompletedTask;
    }

    public string LastCodeFor(string email) => _codes[email];
}
