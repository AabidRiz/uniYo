using Microsoft.AspNetCore.Mvc;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/_routes")]
public class DebugRoutesController : ControllerBase
{
    private readonly IEnumerable<EndpointDataSource> _sources;
    public DebugRoutesController(IEnumerable<EndpointDataSource> sources) => _sources = sources;

    [HttpGet]
    public IActionResult GetAll()
    {
        var routes = _sources
            .SelectMany(s => s.Endpoints)
            .OfType<RouteEndpoint>()
            .Select(e => new
            {
                method = string.Join(",", e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? new List<string>()),
                route = e.RoutePattern.RawText
            })
            .OrderBy(x => x.route)
            .ToList();
        return Ok(routes);
    }
}
