using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Services.Agents;

public class BusinessAgent
{
    private readonly UniYoDbContext _db;
    private readonly AgentLlmService _llm;
    private readonly MatchingService _match;
    private readonly ILogger<BusinessAgent> _log;

    public BusinessAgent(UniYoDbContext db, AgentLlmService llm, MatchingService match, ILogger<BusinessAgent> log)
    {
        _db = db; _llm = llm; _match = match; _log = log;
    }

    public async Task RunAsync(Guid workflowId)
    {
        var sw = Stopwatch.StartNew();
        var result = new AgentResult();

        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null || wf.Plan == null) throw new Exception("Workflow/plan missing — run Collaborator first");

        var project = await _db.Projects.FindAsync(wf.ProjectId);
        if (project == null) throw new Exception("Project not found");

        // CROSS-AGENT READ
        var plan = JsonDocument.Parse(wf.Plan).RootElement;
        var planSteps = plan.GetProperty("steps").GetArrayLength();
        var requiredSkills = plan.GetProperty("requiredSkills").EnumerateArray().Select(x => x.GetString() ?? "").ToArray();
        result.ReasoningTrace.Add($"Read plan from Collaborator: {planSteps} steps, {requiredSkills.Length} required skills");

        // TOOL 1: score_project — deterministic with breakdown
        var t1 = Stopwatch.StartNew();
        var scoreBreakdown = new List<string>();
        int score = 50;
        scoreBreakdown.Add("Base: 50");

        if (!string.IsNullOrEmpty(project.Description) && project.Description.Length > 100)
        { score += 10; scoreBreakdown.Add("+10 (description > 100 chars)"); }

        if (requiredSkills.Length >= 3)
        { score += 10; scoreBreakdown.Add("+10 (3+ skills specified)"); }

        if (project.SeekingInvestment)
        { score += 10; scoreBreakdown.Add("+10 (seeking investment)"); }

        if (!string.IsNullOrEmpty(project.InvestmentGoal))
        { score += 5; scoreBreakdown.Add("+5 (investment goal set)"); }

        if (project.OpenUniversities != null && project.OpenUniversities.Length > 0)
        { score += 5; scoreBreakdown.Add("+5 (multi-university open)"); }

        score = Math.Min(score, 100);
        result.ReasoningTrace.Add($"Computed traction score = {score}/100");
        foreach (var line in scoreBreakdown) result.ReasoningTrace.Add($"  · {line}");
        result.ToolsCalled.Add(new ToolCall { Tool = "score_project", DurationMs = (int)t1.ElapsedMilliseconds, Status = "ok", Detail = $"{score}/100" });

        // TOOL 2: match_investors — real thesis matching
        var t2 = Stopwatch.StartNew();
        var investors = await _db.Users.Where(u => u.Role == "business" && u.Verified).ToListAsync();
        result.ReasoningTrace.Add($"Queried {investors.Count} verified investors");

        var matches = investors.Select(inv => new
        {
            Investor = inv,
            MatchScore = _match.InvestorProjectMatch(inv, project),
            Thesis = (inv.Skills ?? "").Split(',').Select(x => x.Trim()).Where(x => x.Length > 0).ToArray()
        }).ToList();

        var accepted = matches.Where(m => m.MatchScore >= 30).OrderByDescending(m => m.MatchScore).Take(5).ToList();
        var rejected = matches.Count(m => m.MatchScore < 30);

        result.ReasoningTrace.Add($"Accepted {accepted.Count} investors with match ≥ 30%");
        result.ReasoningTrace.Add($"Rejected {rejected} investors below threshold");
        result.ToolsCalled.Add(new ToolCall { Tool = "match_investors", DurationMs = (int)t2.ElapsedMilliseconds, Status = "ok", Detail = $"{accepted.Count} matched" });

        // LLM call for pitch draft with analytical personality
        var systemPrompt = @"You are the Business Agent for UniYO. You are ANALYTICAL and SKEPTICAL.
You write investor pitches in 3 sentences max. You use numbers.
Return ONLY valid JSON:
{ ""pitch"": ""..."", ""risks"": [""risk1"",""risk2""] }";

        var userMsg = $"Project: {project.Title}\nTraction score: {score}/100\nRequired skills: {string.Join(", ", requiredSkills)}\nMatched investors: {accepted.Count}";

        var rawPitch = await _llm.CallJsonAsync(systemPrompt, userMsg);
        var pitch = rawPitch.GetProperty("pitch").GetString() ?? "";
        var risks = rawPitch.GetProperty("risks").EnumerateArray().Select(x => x.GetString() ?? "").ToArray();

        // Confidence: how strong the investor match is
        var topMatch = accepted.FirstOrDefault()?.MatchScore ?? 0;
        result.Confidence = Math.Round(0.5 + (topMatch / 200.0), 2);

        if (accepted.Count == 0)
        {
            result.Errors.Add("No investors matched above threshold");
            result.ReasoningTrace.Add("⚠ No investors matched — the project may need repositioning");
        }

        // Write to blackboard
        wf.Analysis = JsonSerializer.Serialize(new
        {
            score,
            scoreBreakdown,
            investorMatches = accepted.Select(m => new
            {
                Id = m.Investor.Id,
                Name = m.Investor.Name,
                Company = m.Investor.Company,
                Industry = m.Investor.Industry,
                matchScore = m.MatchScore,
                thesis = m.Thesis,
                reasons = new[] {
                    $"Thesis includes {string.Join(", ", m.Thesis)}",
                    $"Project seeks ${project.InvestmentGoal}"
                }
            }),
            rejectedCount = rejected,
            pitchDraft = pitch,
            risks,
            agentsCalled = new[] { "score_project", "match_investors" }
        });
        wf.Status = "professor_review";
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _db.AgentSteps.Add(new AgentStep
        {
            WorkflowId = workflowId,
            AgentName = "business",
            StepNumber = 2,
            Input = JsonSerializer.Serialize(new { planSteps, requiredSkills }),
            Output = JsonSerializer.Serialize(result),
            ToolsCalled = JsonSerializer.Serialize(result.ToolsCalled),
            DurationMs = (int)sw.ElapsedMilliseconds,
            Status = accepted.Count > 0 ? "ok" : "warn"
        });
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Business] workflow {workflowId} → score {score}, {accepted.Count} investors, confidence {result.Confidence}");
    }
}
