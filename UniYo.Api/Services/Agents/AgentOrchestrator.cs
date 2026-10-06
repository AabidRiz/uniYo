using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;

namespace UniYo.Api.Services.Agents;

public class AgentOrchestrator
{
    private readonly UniYoDbContext _db;
    private readonly CollaboratorAgent _collaborator;
    private readonly BusinessAgent _business;
    private readonly ProfessorAgent _professor;
    private readonly ValidatorAgent _validator;
    private readonly ILogger<AgentOrchestrator> _log;

    public AgentOrchestrator(
        UniYoDbContext db,
        CollaboratorAgent collaborator,
        BusinessAgent business,
        ProfessorAgent professor,
        ValidatorAgent validator,
        ILogger<AgentOrchestrator> log)
    {
        _db = db;
        _collaborator = collaborator;
        _business = business;
        _professor = professor;
        _validator = validator;
        _log = log;
    }

    public async Task<Guid> StartAsync(string projectId, string initiatorId, string role, string objective, string? questionnaire = null)
    {
        var wf = new Entities.AgentWorkflow
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            InitiatorId = initiatorId,
            Role = role,
            Objective = objective,
            Status = "planning",
            ApprovalStatus = "none",
            Errors = "[]",
            Questionnaire = questionnaire
        };
        _db.AgentWorkflows.Add(wf);
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Orchestrator] workflow {wf.Id} created");

        var start = DateTime.UtcNow;
        try
        {
            await _collaborator.RunAsync(wf.Id);
            await _business.RunAsync(wf.Id);
            await _professor.RunAsync(wf.Id);
            await _validator.RunAsync(wf.Id);
        }
        catch (Exception ex)
        {
            wf.Status = "failed";
            wf.Errors = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
            await _db.SaveChangesAsync();
            _log.LogError($"[Orchestrator] workflow {wf.Id} failed: {ex.Message}");
            throw;
        }

        wf.DurationMs = (int)(DateTime.UtcNow - start).TotalMilliseconds;
        await _db.SaveChangesAsync();

        return wf.Id;
    }

    public async Task ApproveAsync(Guid workflowId, string actorId)
    {
        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null) throw new Exception("Workflow not found");
        if (wf.Status != "awaiting_approval") throw new Exception($"Cannot approve workflow in status '{wf.Status}'");

        wf.ApprovalStatus = "approved";
        wf.ApprovalActorId = actorId;
        wf.Status = "completed";
        wf.FinalOutcome = System.Text.Json.JsonSerializer.Serialize(new
        {
            published = true,
            publishedAt = DateTime.UtcNow,
            approvedBy = actorId,
            memo = "Project published to investors."
        });
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _log.LogInformation($"[Orchestrator] workflow {workflowId} APPROVED by {actorId}");
    }

    public async Task RejectAsync(Guid workflowId, string actorId, string reason)
    {
        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf == null) throw new Exception("Workflow not found");

        wf.ApprovalStatus = "rejected";
        wf.ApprovalActorId = actorId;
        wf.Status = "rejected";
        wf.FinalOutcome = System.Text.Json.JsonSerializer.Serialize(new
        {
            rejected = true,
            reason,
            rejectedBy = actorId,
            rejectedAt = DateTime.UtcNow
        });
        wf.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
