using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services.Agents;

public class ValidatorAgent
{
    private readonly UniYoDbContext _db;
    private readonly ILogger<ValidatorAgent> _log;

    public ValidatorAgent(UniYoDbContext db, ILogger<ValidatorAgent> log)
    {
        _db = db; _log = log;
    }

    public async Task RunAsync(Guid workflowId)
    {
        var sw = Stopwatch.StartNew();
        var result = new AgentResult();

        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null) throw new Exception("Workflow not found");

        // CROSS-AGENT READ
        result.ReasoningTrace.Add("Verifying outputs from all 3 previous agents");

        var checks = new List<object>();
        var errors = new List<string>();

        // CHECK 1: plan exists
        bool planExists = !string.IsNullOrEmpty(wf.Plan);
        checks.Add(new { rule = "plan_exists", passed = planExists, detail = planExists ? "ok" : "missing" });
        if (!planExists) errors.Add("plan_missing");

        JsonElement? plan = planExists ? JsonDocument.Parse(wf.Plan!).RootElement : null;

        // CHECK 2: plan has ≥ 3 steps
        int stepCount = 0;
        if (plan.HasValue && plan.Value.TryGetProperty("steps", out var stepsArr))
            stepCount = stepsArr.GetArrayLength();
        bool planLengthOk = stepCount >= 3;
        checks.Add(new { rule = "plan_length_ge_3", passed = planLengthOk, detail = $"{stepCount} steps" });
        if (!planLengthOk) errors.Add("plan_too_short");

        // CHECK 3: at least 1 candidate
        int candidateCount = 0;
        if (plan.HasValue && plan.Value.TryGetProperty("candidateCount", out var cc))
            candidateCount = cc.GetInt32();
        bool hasCandidates = candidateCount > 0;
        checks.Add(new { rule = "has_candidates", passed = hasCandidates, detail = $"{candidateCount} candidates" });
        if (!hasCandidates) errors.Add("no_candidates");

        // CHECK 4: analysis exists
        bool analysisExists = !string.IsNullOrEmpty(wf.Analysis);
        checks.Add(new { rule = "analysis_exists", passed = analysisExists, detail = analysisExists ? "ok" : "missing" });
        if (!analysisExists) errors.Add("analysis_missing");

        JsonElement? analysis = analysisExists ? JsonDocument.Parse(wf.Analysis!).RootElement : null;

        // CHECK 5: traction ≥ 50
        int score = 0;
        if (analysis.HasValue && analysis.Value.TryGetProperty("score", out var sc))
            score = sc.GetInt32();
        bool tractionOk = score >= 50;
        checks.Add(new { rule = "traction_ge_50", passed = tractionOk, detail = $"score {score}" });
        if (!tractionOk) errors.Add("traction_below_50");

        // CHECK 6: at least 1 investor match
        int investorCount = 0;
        if (analysis.HasValue && analysis.Value.TryGetProperty("investorMatches", out var im))
            investorCount = im.GetArrayLength();
        bool hasInvestors = investorCount > 0;
        checks.Add(new { rule = "has_investor_match", passed = hasInvestors, detail = $"{investorCount} investors" });
        if (!hasInvestors) errors.Add("no_investor_match");

        // CHECK 7: professor assigned
        bool profAssigned = false;
        if (!string.IsNullOrEmpty(wf.Endorsement))
        {
            var end = JsonDocument.Parse(wf.Endorsement).RootElement;
            if (end.TryGetProperty("professorId", out var pid))
                profAssigned = !string.IsNullOrEmpty(pid.GetString());
        }
        checks.Add(new { rule = "advisor_assigned", passed = profAssigned, detail = profAssigned ? "yes" : "none" });
        if (!profAssigned) errors.Add("no_advisor");

        // CHECK 8: endorsement drafted
        bool endorsementDrafted = false;
        if (!string.IsNullOrEmpty(wf.Endorsement))
        {
            var end = JsonDocument.Parse(wf.Endorsement).RootElement;
            if (end.TryGetProperty("endorsementDraft", out var draft))
                endorsementDrafted = !string.IsNullOrEmpty(draft.GetString());
        }
        checks.Add(new { rule = "endorsement_drafted", passed = endorsementDrafted, detail = endorsementDrafted ? "yes" : "none" });
        if (!endorsementDrafted) errors.Add("no_endorsement");

        var allPassed = errors.Count == 0;
        var requiresApproval = allPassed;

        result.ReasoningTrace.Add($"Ran {checks.Count} deterministic checks");
        result.ReasoningTrace.Add($"{checks.Count - errors.Count}/{checks.Count} passed");

        if (allPassed)
            result.ReasoningTrace.Add("✓ All checks passed — pausing for human approval");
        else
            result.ReasoningTrace.Add($"✗ {errors.Count} check(s) failed: {string.Join(", ", errors)}");

        result.ToolsCalled.Add(new ToolCall { Tool = "validate_project", DurationMs = (int)sw.ElapsedMilliseconds, Status = allPassed ? "ok" : "fail", Detail = $"{checks.Count - errors.Count}/{checks.Count}" });

        result.Confidence = 1.0; // deterministic

        var approvalId = allPassed ? $"appr_{Guid.NewGuid():N}" : null;

        wf.Validation = JsonSerializer.Serialize(new
        {
            valid = allPassed,
            checks,
            errors,
            requiresApproval,
            approvalId,
            checkCount = checks.Count,
            passedCount = checks.Count - errors.Count,
            agentsCalled = new[] { "validate_project" }
        });
        wf.Status = allPassed ? "awaiting_approval" : "rejected";
        wf.ApprovalId = approvalId;
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _db.AgentSteps.Add(new AgentStep
        {
            WorkflowId = workflowId,
            AgentName = "validator",
            StepNumber = 4,
            Input = JsonSerializer.Serialize(new { plan = planExists, analysis = analysisExists, endorsement = profAssigned }),
            Output = JsonSerializer.Serialize(result),
            ToolsCalled = JsonSerializer.Serialize(result.ToolsCalled),
            DurationMs = (int)sw.ElapsedMilliseconds,
            Status = allPassed ? "ok" : "rejected"
        });
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Validator] workflow {workflowId} → {checks.Count - errors.Count}/{checks.Count} passed");
    }
}
