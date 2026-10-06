using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services.Agents;

public class ProfessorAgent
{
    private readonly UniYoDbContext _db;
    private readonly AgentLlmService _llm;
    private readonly ILogger<ProfessorAgent> _log;

    public ProfessorAgent(UniYoDbContext db, AgentLlmService llm, ILogger<ProfessorAgent> log)
    {
        _db = db; _llm = llm; _log = log;
    }

    public async Task RunAsync(Guid workflowId)
    {
        var sw = Stopwatch.StartNew();
        var result = new AgentResult();

        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null || wf.Analysis == null) throw new Exception("Prior agents incomplete — run Business first");

        var project = await _db.Projects.FindAsync(wf.ProjectId);
        if (project == null) throw new Exception("Project not found");

        // CROSS-AGENT READ
        var analysis = JsonDocument.Parse(wf.Analysis).RootElement;
        var tractionScore = analysis.GetProperty("score").GetInt32();
        result.ReasoningTrace.Add($"Read analysis from Business: traction score = {tractionScore}/100");

        // TOOL 1: find_professor — match by expertise keywords
        var t1 = Stopwatch.StartNew();
        var projectText = $"{project.Title} {project.Description}".ToLowerInvariant();
        var projectSkills = (project.SkillsNeeded ?? Array.Empty<string>()).Select(s => s.ToLowerInvariant()).ToArray();

        var professors = await _db.Users
            .Where(u => u.Role == "professor" && u.Verified)
            .ToListAsync();

        result.ReasoningTrace.Add($"Queried {professors.Count} verified professors");

        var scoredProfs = professors.Select(p =>
        {
            var expertise = (p.Skills ?? "").ToLowerInvariant().Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var score = 0;
            foreach (var e in expertise)
            {
                if (projectText.Contains(e)) score += 30;
                if (projectSkills.Any(s => s.Contains(e) || e.Contains(s))) score += 20;
            }
            return new { Prof = p, Score = score, Expertise = expertise };
        }).OrderByDescending(x => x.Score).ToList();

        var topProf = scoredProfs.FirstOrDefault();
        if (topProf == null || topProf.Score == 0)
        {
            result.Errors.Add("No professor matched project expertise");
            result.ReasoningTrace.Add("⚠ No professor with matching expertise found");
            wf.Endorsement = JsonSerializer.Serialize(new {
                error = "no_professor_matched",
                reasoning = result.ReasoningTrace,
                agentsCalled = new[] { "find_professor" }
            });
            wf.Status = "validating";
            wf.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return;
        }

        result.ReasoningTrace.Add($"Matched {topProf.Prof.Name} (score {topProf.Score}) in {topProf.Prof.Faculty}");
        result.ToolsCalled.Add(new ToolCall { Tool = "find_professor", DurationMs = (int)t1.ElapsedMilliseconds, Status = "ok", Detail = topProf.Prof.Name });

        // TOOL 2: get_availability
        var t2 = Stopwatch.StartNew();
        var slots = await _db.ProfessorAvailabilities
            .Where(a => a.ProfId == topProf.Prof.Id)
            .Take(3)
            .Select(a => new { a.Day, a.Time })
            .ToListAsync();

        result.ReasoningTrace.Add($"Found {slots.Count} availability slots");
        result.ToolsCalled.Add(new ToolCall { Tool = "get_availability", DurationMs = (int)t2.ElapsedMilliseconds, Status = "ok" });

        // LLM call — formal academic tone
        var systemPrompt = @"You are the Professor Agent for UniYO. You write in FORMAL ACADEMIC English.
Endorsements are 3 sentences. They reference the professor's expertise and the project's merit.
Return ONLY valid JSON: { ""endorsement"": ""..."" }";

        var userMsg = $"Project: {project.Title}\nProfessor: {topProf.Prof.Name}, {topProf.Prof.Faculty}\nProfessor expertise: {string.Join(", ", topProf.Expertise)}\nProject traction: {tractionScore}/100";

        var raw = await _llm.CallJsonAsync(systemPrompt, userMsg);
        var endorsement = raw.GetProperty("endorsement").GetString() ?? "";

        // Confidence based on match strength
        result.Confidence = Math.Round(Math.Min(0.98, 0.5 + (topProf.Score / 200.0)), 2);

        // Write
        wf.Endorsement = JsonSerializer.Serialize(new
        {
            professorId = topProf.Prof.Id,
            professorName = topProf.Prof.Name,
            university = topProf.Prof.UniversityName,
            faculty = topProf.Prof.Faculty,
            expertiseMatch = topProf.Score,
            endorsementDraft = endorsement,
            availability = slots,
            agentsCalled = new[] { "find_professor", "get_availability" }
        });
        wf.Status = "validating";
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _db.AgentSteps.Add(new AgentStep
        {
            WorkflowId = workflowId,
            AgentName = "professor",
            StepNumber = 3,
            Input = JsonSerializer.Serialize(new { tractionScore }),
            Output = JsonSerializer.Serialize(result),
            ToolsCalled = JsonSerializer.Serialize(result.ToolsCalled),
            DurationMs = (int)sw.ElapsedMilliseconds,
            Status = "ok"
        });
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Professor] workflow {workflowId} → {topProf.Prof.Name}, confidence {result.Confidence}");
    }
}
