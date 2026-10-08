using GidaKoprusu.Api.Common;

namespace GidaKoprusu.Api.Tests;

public class IstanbulTimeTests
{
    [Fact]
    public void Pickup_instant_is_the_wall_clock_time_in_istanbul_as_utc()
    {
        var created = new DateTime(2026, 10, 8, 9, 0, 0, DateTimeKind.Utc); // 12:00 in Istanbul

        Assert.Equal(new DateTime(2026, 10, 8, 10, 0, 0, DateTimeKind.Utc), IstanbulTime.PickupInstant(created, "13:00"));
    }

    [Fact]
    public void Pickup_instant_uses_the_istanbul_calendar_day_not_the_utc_one()
    {
        var created = new DateTime(2026, 10, 8, 22, 30, 0, DateTimeKind.Utc); // 01:30 on 9 October in Istanbul

        Assert.Equal(new DateTime(2026, 10, 9, 6, 0, 0, DateTimeKind.Utc), IstanbulTime.PickupInstant(created, "09:00"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("25:00")]
    [InlineData("1300")]
    [InlineData("abc")]
    public void Pickup_instant_is_null_for_a_missing_or_malformed_time(string? hhmm)
    {
        Assert.Null(IstanbulTime.PickupInstant(new DateTime(2026, 10, 8, 9, 0, 0, DateTimeKind.Utc), hhmm));
    }

    [Theory]
    [InlineData("00:00", true)]
    [InlineData("23:59", true)]
    [InlineData("24:00", false)]
    [InlineData(null, false)]
    public void Is_clock_time_accepts_only_hh_mm(string? value, bool expected)
    {
        Assert.Equal(expected, IstanbulTime.IsClockTime(value));
    }
}
