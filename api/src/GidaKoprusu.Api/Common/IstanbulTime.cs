using System.Globalization;

namespace GidaKoprusu.Api.Common;

// ponytail: Turkey has used a fixed UTC+3 offset with no daylight saving since 2016, so a
// constant is exact. Switch to TimeZoneInfo if that ever changes.
public static class IstanbulTime
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(3);

    // Mirrors pickup_instant() in supabase/pickup-window.sql: the HH:mm wall-clock time on the
    // Istanbul calendar day of `createdAtUtc`, returned as a UTC instant. Null when the time is
    // missing or malformed, which callers treat as "no deadline".
    public static DateTime? PickupInstant(DateTime createdAtUtc, string? hhmm)
    {
        if (!TryParseClock(hhmm, out var time))
            return null;

        var localDay = DateOnly.FromDateTime(createdAtUtc + Offset);
        return DateTime.SpecifyKind(localDay.ToDateTime(time) - Offset, DateTimeKind.Utc);
    }

    public static bool IsClockTime(string? hhmm) => TryParseClock(hhmm, out _);

    private static bool TryParseClock(string? hhmm, out TimeOnly time) =>
        TimeOnly.TryParseExact(hhmm, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
}
