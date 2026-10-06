using System.Text;
using System.Text.Json;

namespace UniYo.Api.Services.Agents;

public class AgentLlmService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _cfg;
    private readonly ILogger<AgentLlmService> _log;

    public AgentLlmService(HttpClient http, IConfiguration cfg, ILogger<AgentLlmService> log)
    {
        _http = http; _cfg = cfg; _log = log;
        _http.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<JsonElement> CallJsonAsync(string systemPrompt, string userMessage, int maxRetries = 3)
    {
        var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? _cfg["Rag:GroqApiKey"] ?? "";
        var url = _cfg["Rag:GroqUrl"] ?? "https://api.groq.com/openai/v1/chat/completions";
        var model = Environment.GetEnvironmentVariable("GROQ_MODEL") ?? _cfg["Rag:GroqModel"] ?? "openai/gpt-oss-20b";

        var body = new
        {
            model,
            temperature = 0.2,
            max_tokens = 800,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            }
        };

        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                var req = new HttpRequestMessage(HttpMethod.Post, url);
                req.Headers.Add("Authorization", $"Bearer {apiKey}");
                req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

                var res = await _http.SendAsync(req);
                var raw = await res.Content.ReadAsStringAsync();

                if (!res.IsSuccessStatusCode)
                {
                    _log.LogWarning($"[LLM] attempt {attempt + 1} failed: {res.StatusCode}");
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
                    continue;
                }

                using var doc = JsonDocument.Parse(raw);
                var content = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "{}";

                return JsonDocument.Parse(content).RootElement.Clone();
            }
            catch (Exception ex)
            {
                _log.LogWarning($"[LLM] attempt {attempt + 1} error: {ex.Message}");
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
            }
        }

        throw new Exception("LLM call failed after retries");
    }
}
