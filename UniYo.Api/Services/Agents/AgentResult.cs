namespace UniYo.Api.Services.Agents;

public class AgentResult
{
    public object Output { get; set; } = new { };
    public List<string> ReasoningTrace { get; set; } = new();
    public List<ToolCall> ToolsCalled { get; set; } = new();
    public double Confidence { get; set; } = 0.8;
    public List<string> Errors { get; set; } = new();
}

public class ToolCall
{
    public string Tool { get; set; } = "";
    public int DurationMs { get; set; }
    public string Status { get; set; } = "ok";
    public string? Detail { get; set; }
}
