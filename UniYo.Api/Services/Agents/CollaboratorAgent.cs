using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Services.Agents;

public class CollaboratorAgent
{
    private readonly UniYoDbContext _db;
    private readonly AgentLlmService _llm;
    private readonly MatchingService _match;
    private readonly ILogger<CollaboratorAgent> _log;

    public CollaboratorAgent(UniYoDbContext db, AgentLlmService llm, MatchingService match, ILogger<CollaboratorAgent> log)
    {
        _db = db; _llm = llm; _match = match; _log = log;
    }

    public async Task RunAsync(Guid workflowId)
    {
        var sw = Stopwatch.StartNew();
        var result = new AgentResult();

        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null) throw new Exception("Workflow not found");

        var project = await _db.Projects.FindAsync(wf.ProjectId);
        if (project == null) throw new Exception("Project not found");

        // TOOL 1: get_project
        var t1 = Stopwatch.StartNew();
        result.ReasoningTrace.Add($"Read project \"{project.Title}\" ({project.SkillsNeeded?.Length ?? 0} required skills)");
        result.ToolsCalled.Add(new ToolCall { Tool = "get_project", DurationMs = (int)t1.ElapsedMilliseconds, Status = "ok" });

        // TOOL 2: find_teammates — real matching
        var t2 = Stopwatch.StartNew();
        var allStudents = await _db.Users
            .Where(u => u.Role == "student" && u.Verified)
            .ToListAsync();

        result.ReasoningTrace.Add($"Queried {allStudents.Count} verified student profiles");

        var scored = allStudents
            .Select(s => new { Student = s, Score = _match.StudentProjectMatch(s, project) })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(8)
            .ToList();

        result.ReasoningTrace.Add($"Matched {scored.Count} students with >0% skill overlap");
        result.ReasoningTrace.Add($"Top match: {scored.FirstOrDefault()?.Student.Name ?? "(none)"} at {scored.FirstOrDefault()?.Score ?? 0}%");
        result.ToolsCalled.Add(new ToolCall { Tool = "find_teammates", DurationMs = (int)t2.ElapsedMilliseconds, Status = "ok", Detail = $"{scored.Count} matches" });

        // Compute skill gaps deterministically
        var requiredSkills = project.SkillsNeeded ?? Array.Empty<string>();
        var topSkills = scored.SelectMany(s => (s.Student.Skills ?? "").Split(','))
            .Select(x => x.Trim().ToLower()).Distinct().ToHashSet();
        var gaps = requiredSkills
            .Where(r => !topSkills.Any(t => t.Contains(r.ToLower()) || r.ToLower().Contains(t)))
            .ToList();

        result.ReasoningTrace.Add($"Detected {gaps.Count} skill gaps in candidate pool");

        // LLM call for plan — with a tactical personality
        var systemPrompt = @"You are the Collaborator Agent for UniYO. You are DIRECT and TACTICAL.
You break projects into concise steps. You do not use filler words.
Return ONLY valid JSON:
{ ""steps"": [""step1"",""step2"",""step3""], ""summary"": ""one-line tactical summary"" }";

        var userMsg = $"Project: {project.Title}\nDescription: {project.Description}\nRequired skills: {string.Join(", ", requiredSkills)}\nTop candidate matches: {string.Join(", ", scored.Take(3).Select(s => s.Student.Name))}";

        var rawPlan = await _llm.CallJsonAsync(systemPrompt, userMsg);
        var steps = rawPlan.GetProperty("steps");
        var summary = rawPlan.GetProperty("summary").GetString() ?? "";

        // Confidence: based on candidate coverage
        var coverage = requiredSkills.Length == 0 ? 0.5
            : (double)(requiredSkills.Length - gaps.Count) / requiredSkills.Length;
        result.Confidence = Math.Round(0.4 + coverage * 0.5, 2);
        result.ReasoningTrace.Add($"Confidence {result.Confidence:P0} — {requiredSkills.Length - gaps.Count}/{requiredSkills.Length} skills covered by candidates");

        // Write to blackboard
        wf.Plan = JsonSerializer.Serialize(new
        {
            steps,
            requiredSkills,
            gaps,
            summary,
            candidateCount = scored.Count,
            topCandidates = scored.Take(5).Select(s => new {
                id = s.Student.Id,
                name = s.Student.Name,
                university = s.Student.UniversityName,
                matchScore = s.Score,
                skills = (s.Student.Skills ?? "").Split(',').Select(x => x.Trim()).Take(5)
            }),
            agentsCalled = new[] { "get_project", "find_teammates" }
        });
        wf.Status = "analysis";
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Audit log
        _db.AgentSteps.Add(new AgentStep
        {
            WorkflowId = workflowId,
            AgentName = "collaborator",
            StepNumber = 1,
            Input = JsonSerializer.Serialize(new { wf.Objective, wf.ProjectId }),
            Output = JsonSerializer.Serialize(result),
            ToolsCalled = JsonSerializer.Serialize(result.ToolsCalled),
            DurationMs = (int)sw.ElapsedMilliseconds,
            Status = "ok"
        });
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Collaborator] workflow {workflowId} → confidence {result.Confidence}");
    }
}
