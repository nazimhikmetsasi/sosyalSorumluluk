using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GidaKoprusu.Api.Common;

// Thrown for every expected failure (validation, permission, business rule). The handler
// below turns it into a ProblemDetails response whose `detail` is the Turkish message the
// frontend shows as-is.
public sealed class AppException(int status, string detail) : Exception(detail)
{
    public int Status { get; } = status;

    public static AppException BadRequest(string detail) => new(StatusCodes.Status400BadRequest, detail);
    public static AppException Forbidden(string detail) => new(StatusCodes.Status403Forbidden, detail);
    public static AppException NotFound(string detail) => new(StatusCodes.Status404NotFound, detail);
    public static AppException Conflict(string detail) => new(StatusCodes.Status409Conflict, detail);
}

public sealed class AppExceptionHandler(IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not AppException app)
            return false;

        context.Response.StatusCode = app.Status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = app.Status, Detail = app.Message },
        });
    }
}
