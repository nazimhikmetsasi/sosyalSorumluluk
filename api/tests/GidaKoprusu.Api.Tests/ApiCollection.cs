namespace GidaKoprusu.Api.Tests;

// Every test that touches the API or the database joins this collection, so they share one
// container and run one after another (they also share the mutable TestClock).
[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "api";
}
