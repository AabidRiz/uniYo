using Microsoft.AspNetCore.Mvc;
using UniYo.Api.Dtos;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly RagService _rag;
    public AiController(RagService rag) => _rag = rag;

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AiChatDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { error = "message required" });

        try
        {
            var (response, sources) = await _rag.AskAsync(dto.Role ?? "student", dto.Message.Trim());
            return Ok(new { response, sources });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"/api/ai/chat failed: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
