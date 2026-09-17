using Microsoft.AspNetCore.Mvc;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok", engine = "ASP.NET Core 8", db = "uniyo_db" });
    }
}
