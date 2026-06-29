using Microsoft.AspNetCore.Mvc;
using SportBooking.Application.Common.Models;

namespace SportBooking.API.Extensions;

public static class ResultExtensions
{
    public static IActionResult ToActionResult<T>(this Result<T> result, ControllerBase controller) =>
        result.IsSuccess
            ? result.StatusCode == 201
                ? controller.StatusCode(201, result.Data)
                : controller.Ok(result.Data)
            : result.StatusCode switch
            {
                404 => controller.NotFound(new { error = result.Error }),
                401 => controller.Unauthorized(new { error = result.Error }),
                403 => controller.StatusCode(403, new { error = result.Error }),
                _ => controller.BadRequest(new { error = result.Error })
            };

    public static IActionResult ToActionResult(this Result result, ControllerBase controller) =>
        result.IsSuccess
            ? result.StatusCode == 204
                ? controller.NoContent()
                : controller.Ok()
            : result.StatusCode switch
            {
                404 => controller.NotFound(new { error = result.Error }),
                _ => controller.BadRequest(new { error = result.Error })
            };
}