using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/sport-types")]
public class SportTypeController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var items = await uow.SportTypes.Query()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new { s.SportTypeId, s.Name, s.Icon })
            .ToListAsync(ct);

        return Ok(items);
    }
}
