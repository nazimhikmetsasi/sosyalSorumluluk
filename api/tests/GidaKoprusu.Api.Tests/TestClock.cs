namespace GidaKoprusu.Api.Tests;

// The API reads time only through TimeProvider, so tests can move the clock to check
// deadlines (OTP expiry, 30-minute cancellation cut-off, listing expiry).
public sealed class TestClock : TimeProvider
{
    // 12:00 in Istanbul. Every DB test class resets the clock to this in its constructor.
    public static readonly DateTimeOffset Noon = new(2026, 10, 8, 9, 0, 0, TimeSpan.Zero);

    public DateTimeOffset Now { get; set; } = Noon;

    public DateTime UtcNow => Now.UtcDateTime;

    public override DateTimeOffset GetUtcNow() => Now;
}
