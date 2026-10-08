using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GidaKoprusu.Api.Common;

public static class DbErrors
{
    public static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
