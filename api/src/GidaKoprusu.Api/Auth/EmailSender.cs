using System.Net;
using System.Net.Mail;

namespace GidaKoprusu.Api.Auth;

public interface IEmailSender
{
    Task SendOtpAsync(string email, string code, CancellationToken ct);
}

// Used when Smtp:Host is empty (local development): the code goes to the log, not an inbox.
public sealed class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        logger.LogWarning("OTP for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}

public sealed class SmtpEmailSender(IConfiguration config) : IEmailSender
{
    public async Task SendOtpAsync(string email, string code, CancellationToken ct)
    {
        var smtp = config.GetSection("Smtp");
        using var client = new SmtpClient(smtp["Host"], smtp.GetValue("Port", 587))
        {
            EnableSsl = smtp.GetValue("EnableSsl", true),
            Credentials = new NetworkCredential(smtp["Username"], smtp["Password"]),
        };
        using var message = new MailMessage(smtp["From"] ?? smtp["Username"]!, email)
        {
            Subject = "Gıda Köprüsü giriş kodunuz",
            Body = $"Giriş kodunuz: {code}\n\nKod 10 dakika geçerlidir.",
        };
        await client.SendMailAsync(message, ct);
    }
}
