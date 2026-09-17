using System.Text;
using System.Text.Json;
using Npgsql;
using UniYo.Api.Services;

namespace UniYo.Api.Services;

public class RagService
{
    private readonly IConfiguration _cfg;
    private readonly HttpClient _http;
    private readonly ILogger<RagService> _log;

    public RagService(IConfiguration cfg, HttpClient http, ILogger<RagService> log)
    {
        _cfg = cfg;
        _http = http;
        _log = log;
    }

    private string SidecarUrl => _cfg["Rag:SidecarUrl"] ?? "http://localhost:5001";
    private string GroqUrl => _cfg["Rag:GroqUrl"]!;
    private string GroqModel => _cfg["Rag:GroqModel"] ?? "openai/gpt-oss-20b";
    private string GroqKey => _cfg["Rag:GroqApiKey"] ?? "";
    private int TopK => int.TryParse(_cfg["Rag:TopK"], out var k) ? k : 5;
    private string RagConn => _cfg.GetConnectionString("RagConnection")!;

    // ---------- 1. Get embedding from the Node sidecar ----------
    private async Task<float[]> EmbedAsync(string text)
    {
        var payload = JsonSerializer.Serialize(new { text });
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
        var res = await _http.PostAsync($"{SidecarUrl}/embed", content);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new Exception($"Embedding sidecar failed: {err}");
        }
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var arr = doc.RootElement.GetProperty("embedding");
        var vec = new float[arr.GetArrayLength()];
        int i = 0;
        foreach (var v in arr.EnumerateArray()) vec[i++] = v.GetSingle();
        return vec;
    }

    // ---------- 2. pgvector similarity search ----------
    private async Task<List<(string content, string sourceType, string sourceId, double similarity)>> SearchAsync(
        float[] queryEmbedding, string[] allowedSources)
    {
        var results = new List<(string, string, string, double)>();

        // Format the vector as pgvector literal: [0.1,0.2,...]
        var vecLiteral = "[" + string.Join(",", queryEmbedding.Select(f => f.ToString(System.Globalization.CultureInfo.InvariantCulture))) + "]";

        await using var conn = new NpgsqlConnection(RagConn);
        await conn.OpenAsync();

        var sql = @"
            SELECT content, source_type, source_id,
                   1 - (embedding <=> @vec::vector) AS similarity
            FROM rag_documents
            WHERE source_type = ANY(@sources)
            ORDER BY embedding <=> @vec::vector
            LIMIT @k";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("vec", vecLiteral);
        cmd.Parameters.AddWithValue("sources", allowedSources);
        cmd.Parameters.AddWithValue("k", TopK);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add((
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetDouble(3)
            ));
        }
        return results;
    }

    // ---------- 3. Call Groq ----------
    private async Task<string> ChatAsync(string context, string question, string systemPrompt)
    {
        var body = new
        {
            model = GroqModel,
            temperature = 0.4,
            max_tokens = 800,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = $"Reference material:\n\n{context}\n\nUser question: {question}" }
            }
        };

        var req = new HttpRequestMessage(HttpMethod.Post, GroqUrl);
        req.Headers.Add("Authorization", $"Bearer {GroqKey}");
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var res = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new Exception($"Groq failed: {json}");

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";
    }

    // ---------- 4. Full RAG pipeline ----------
    public async Task<(string response, object[] sources)> AskAsync(string role, string message)
    {
        var queryEmbedding = await EmbedAsync(message);
        var allowed = AiPrompts.AllowedSources(role);
        var results = await SearchAsync(queryEmbedding, allowed);

        var sb = new StringBuilder();
        for (int i = 0; i < results.Count; i++)
        {
            sb.AppendLine($"[{i + 1}] ({results[i].sourceType})");
            sb.AppendLine(results[i].content);
            sb.AppendLine();
        }

        var context = sb.ToString();
        var answer = await ChatAsync(context, message, AiPrompts.System(role));

        var sources = results.Select(r => (object)new
        {
            type = r.sourceType,
            id = r.sourceId,
            similarity = Math.Round(r.similarity, 4)
        }).ToArray();

        return (answer, sources);
    }
}
