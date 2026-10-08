using GidaKoprusu.Api.Organisations;

namespace GidaKoprusu.Api.Tests;

public class TrustScoreTests
{
    [Theory]
    [InlineData(0, 0, 0, 64)]
    [InlineData(0, 0, 1, 65)]
    [InlineData(1, 5, 1, 69)]
    [InlineData(2, 3, 0, 48)]
    [InlineData(10, 50, 25, 96)]
    [InlineData(29, 101, 0, 57)] // exactly 56.5: rounds away from zero, like Postgres round(numeric)
    public void Compute_matches_the_supabase_formula(int reviewCount, int ratingSum, int completedCount, int expected)
    {
        Assert.Equal(expected, TrustScore.Compute(reviewCount, ratingSum, completedCount));
    }
}
