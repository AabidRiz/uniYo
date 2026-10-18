using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace UniYo.Api.Controllers;

[ApiController]
public class DebugAiController : ControllerBase
{
    private readonly IConfiguration _cfg;
    public DebugAiController(IConfiguration cfg) { _cfg = cfg; }

    [HttpGet("api/debug-test-groq")]
    public async Task<IActionResult> TestGroq()
    {
        var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? _cfg["Rag:GroqApiKey"] ?? "";
        var url = "https://api.groq.com/openai/v1/chat/completions";
        
        var body = new
        {
            model = "openai/gpt-oss-20b",
            messages = new[] { new { role = "user", content = "Say exactly: SYSTEM ONLINE" } }
        };

        using var http = new HttpClient();
        http.Timeout = TimeSpan.FromSeconds(10);
        
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.Add("Authorization", $"Bearer {apiKey}");
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        try
        {
            var res = await http.SendAsync(req);
            var raw = await res.Content.ReadAsStringAsync();
            return Ok(new { status = res.StatusCode, response = raw });
        }
        catch (Exception ex)
        {
            return Ok(new { status = "Error", response = ex.Message });
        }
    }
}
