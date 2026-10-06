using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Npgsql;
using UniYo.Api.Services;

namespace UniYo.Api.Services;

public class RagService
{
    private readonly IConfiguration _cfg;
    private readonly HttpClient _http;
    private readonly ILogger<RagService> _log;
    private static readonly MemoryCache _embeddingCache = new MemoryCache(new MemoryCacheOptions());

    public RagService(IConfiguration cfg, HttpClient http, ILogger<RagService> log)
    {
        _cfg = cfg;
        _http = http;
        _log = log;
    }

    private string SidecarUrl => Environment.GetEnvironmentVariable("SIDECAR_URL")
        ?? _cfg["Rag:SidecarUrl"] ?? "http://localhost:5001";
    private string GroqUrl => _cfg["Rag:GroqUrl"] ?? "https://api.groq.com/openai/v1/chat/completions";
    private string GroqModel => Environment.GetEnvironmentVariable("GROQ_MODEL")
        ?? _cfg["Rag:GroqModel"] ?? "openai/gpt-oss-20b";
    private string GroqKey => Environment.GetEnvironmentVariable("GROQ_API_KEY")
        ?? _cfg["Rag:GroqApiKey"] ?? "";
    private int TopK => int.TryParse(_cfg["Rag:TopK"], out var k) ? k : 5;
    private string RagConn => Environment.GetEnvironmentVariable("RAG_DATABASE_URL")
        ?? _cfg.GetConnectionString("RagConnection")!;

    // ============================================================
    // 1. EMBEDDING — with cache + retry with exponential backoff
    // ============================================================
    private async Task<float[]> EmbedAsync(string text)
    {
        var cacheKey = $"emb_{text.ToLowerInvariant().GetHashCode()}";
        if (_embeddingCache.TryGetValue(cacheKey, out float[]? cached) && cached != null)
        {
            _log.LogInformation("[rag] embedding cache hit");
            return cached;
        }

        var payload = JsonSerializer.Serialize(new { text });
        var vector = await EmbedWithRetryAsync(payload);

        _embeddingCache.Set(cacheKey, vector, TimeSpan.FromMinutes(30));
        return vector;
    }

    private async Task<float[]> EmbedWithRetryAsync(string payload, int maxRetries = 4)
    {
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            HttpResponseMessage res;
            try
            {
                res = await _http.PostAsync($"{SidecarUrl}/embed", content);
            }
            catch (HttpRequestException ex)
            {
                _log.LogWarning($"[rag] sidecar network error: {ex.Message} (attempt {attempt + 1})");
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
                continue;
            }

            if (res.IsSuccessStatusCode)
            {
                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var arr = doc.RootElement.GetProperty("embedding");
                var vec = new float[arr.GetArrayLength()];
                int i = 0;
                foreach (var v in arr.EnumerateArray()) vec[i++] = v.GetSingle();
                return vec;
            }

            if ((int)res.StatusCode == 429)
            {
                var delaySec = Math.Pow(2, attempt);
                _log.LogWarning($"[rag] sidecar 429, retry {attempt + 1}/{maxRetries} in {delaySec}s");
                await Task.Delay(TimeSpan.FromSeconds(delaySec));
                continue;
            }

            var err = await res.Content.ReadAsStringAsync();
            throw new Exception($"Embedding sidecar failed: {err}");
        }

        throw new Exception("Embedding sidecar failed: Too Many Requests");
    }

    // ============================================================
    // 2. PGVECTOR SIMILARITY SEARCH
    // ============================================================
    private async Task<List<(string content, string sourceType, string sourceId, double similarity)>> SearchAsync(
        float[] queryEmbedding, string[] allowedSources)
    {
        var results = new List<(string, string, string, double)>();

        var vecLiteral = "[" + string.Join(",",
            queryEmbedding.Select(f => f.ToString(System.Globalization.CultureInfo.InvariantCulture))) + "]";

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

    // ============================================================
    // 3. GROQ LLM CALL
    // ============================================================
    private async Task<string> ChatAsync(string context, string question, string systemPrompt)
    {
        var body = new
        {
            model = GroqModel,
            temperature = 0.4,
            max_tokens = 900,
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

    // ============================================================
    // 4. FULL RAG PIPELINE — with graceful fallback on 429
    // ============================================================
    public async Task<(string response, object[] sources)> AskAsync(string role, string message)
    {
        float[] queryEmbedding;
        try
        {
            queryEmbedding = await EmbedAsync(message);
        }
        catch (Exception ex) when (ex.Message.Contains("Too Many Requests") || ex.Message.Contains("429"))
        {
            _log.LogWarning("[rag] embedding sidecar exhausted retries — using smart fallback");
            return await SmartFallbackAsync(role, message);
        }

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

    // ============================================================
    // 5. SMART FALLBACK — detects intent (generate vs search)
    // ============================================================
    private async Task<(string response, object[] sources)> SmartFallbackAsync(string role, string message)
    {
        var lower = message.ToLowerInvariant();

        // Detect GENERATION intent
        var generationKeywords = new[]
        {
            "design", "create", "write", "draft", "generate", "make",
            "syllabus", "module", "outline", "plan", "draft", "compose",
            "help me", "how do i", "how to", "explain", "summarize"
        };
        var isGeneration = generationKeywords.Any(k => lower.Contains(k));

        if (isGeneration)
        {
            _log.LogInformation("[rag] generation intent detected — calling Groq directly");
            try
            {
                var rolePrompt = AiPrompts.System(role);
                var enhancedPrompt = rolePrompt + @"

You are responding in a fallback mode where retrieval is not available. Provide a helpful, well-structured answer based on your general knowledge. If the request is to design a syllabus or module, structure it clearly with weeks/months, topics, learning outcomes, and assessments.";

                var answer = await ChatAsync(
                    context: "(no reference material — direct generation mode)",
                    question: message,
                    systemPrompt: enhancedPrompt
                );

                return (
                    answer + "\n\n_(AI in direct generation mode — semantic search unavailable.)_",
                    Array.Empty<object>()
                );
            }
            catch (Exception ex)
            {
                _log.LogError($"[rag] direct generation failed: {ex.Message}");
                return ("I couldn't generate that right now. Please try again in a moment.", Array.Empty<object>());
            }
        }

        // Otherwise → SEARCH intent
        var terms = lower
            .Split(new[] { ' ', ',', '.', '?', '!', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 3)
            .Distinct()
            .Take(5)
            .ToArray();

        if (terms.Length == 0)
            return ("Please provide more specific keywords (at least 4 characters each).", Array.Empty<object>());

        var sources = new List<object>();
        var lines = new List<string>();

        try
        {
            await using var conn = new NpgsqlConnection(RagConn);
            await conn.OpenAsync();

            var whereClauses = string.Join(" OR ", terms.Select((_, i) => $"LOWER(content) LIKE @p{i}"));
            var sql = $@"
                SELECT source_type, source_id, content
                FROM rag_documents
                WHERE source_type IN ('project','post','internship','video','student_profile')
                  AND ({whereClauses})
                LIMIT 5";

            await using var cmd = new NpgsqlCommand(sql, conn);
            for (int i = 0; i < terms.Length; i++)
                cmd.Parameters.AddWithValue($"p{i}", $"%{terms[i]}%");

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var sourceType = reader.GetString(0);
                var sourceId = reader.GetString(1);
                var content = reader.GetString(2);
                var preview = content.Length > 140 ? content.Substring(0, 140) + "..." : content;

                sources.Add(new { type = sourceType, id = sourceId });
                lines.Add($"• [{sourceType}] {preview}");
            }
        }
        catch (Exception ex)
        {
            _log.LogError($"[rag] keyword fallback DB error: {ex.Message}");
            return ("Search is temporarily busy. Please try again in a moment.", Array.Empty<object>());
        }

        if (sources.Count == 0)
            return (
                $"No matches for: {string.Join(", ", terms)}. Try different keywords.",
                Array.Empty<object>()
            );

        return (
            $"Semantic search is busy — showing keyword matches:\n\n" + string.Join("\n", lines),
            sources.ToArray()
        );
    }
}
