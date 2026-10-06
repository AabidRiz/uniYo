using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using UniYo.Api.Data;
using UniYo.Api.Services.Agents;

namespace UniYo.Api.Controllers;

[ApiController]
public class AgentController : ControllerBase
{
    private readonly AgentOrchestrator _orchestrator;
    private readonly CollaboratorAgent _collaborator;
    private readonly BusinessAgent _business;
    private readonly ProfessorAgent _professor;
    private readonly ValidatorAgent _validator;
    private readonly UniYoDbContext _db;

    public AgentController(
        AgentOrchestrator orchestrator,
        CollaboratorAgent collaborator,
        BusinessAgent business,
        ProfessorAgent professor,
        ValidatorAgent validator,
        UniYoDbContext db)
    {
        _orchestrator = orchestrator;
        _collaborator = collaborator;
        _business = business;
        _professor = professor;
        _validator = validator;
        _db = db;
    }

    public class AgentRunRequest
    {
        public string ProjectId { get; set; } = "";
        public string InitiatorId { get; set; } = "";
        public Guid? WorkflowId { get; set; }
        public JsonElement? Questionnaire { get; set; }
    }

    // ============================================================
    // INDIVIDUAL AGENT ENDPOINTS — reuse workflow if provided
    // ============================================================
    [HttpPost("api/agent/collaborator/run")]
    public async Task<IActionResult> RunCollaborator([FromBody] AgentRunRequest req)
    {
        var workflowId = await GetOrCreateWorkflow(req, "collaborator");
        try
        {
            await _collaborator.RunAsync(workflowId);
            var wf = await _db.AgentWorkflows.FindAsync(workflowId);
            return Ok(new { workflowId, agent = "collaborator", status = wf!.Status, plan = ParseJson(wf.Plan) });
        }
        catch (Exception ex) { await MarkFailed(workflowId, ex.Message); return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost("api/agent/business/run")]
    public async Task<IActionResult> RunBusiness([FromBody] AgentRunRequest req)
    {
        var workflowId = await GetOrCreateWorkflow(req, "business");
        try
        {
            await _business.RunAsync(workflowId);
            var wf = await _db.AgentWorkflows.FindAsync(workflowId);
            return Ok(new { workflowId, agent = "business", status = wf!.Status, analysis = ParseJson(wf.Analysis) });
        }
        catch (Exception ex) { await MarkFailed(workflowId, ex.Message); return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost("api/agent/professor/run")]
    public async Task<IActionResult> RunProfessor([FromBody] AgentRunRequest req)
    {
        var workflowId = await GetOrCreateWorkflow(req, "professor");
        try
        {
            await _professor.RunAsync(workflowId);
            var wf = await _db.AgentWorkflows.FindAsync(workflowId);
            return Ok(new { workflowId, agent = "professor", status = wf!.Status, endorsement = ParseJson(wf.Endorsement) });
        }
        catch (Exception ex) { await MarkFailed(workflowId, ex.Message); return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost("api/agent/validator/run")]
    public async Task<IActionResult> RunValidator([FromBody] AgentRunRequest req)
    {
        var workflowId = await GetOrCreateWorkflow(req, "validator");
        try
        {
            await _validator.RunAsync(workflowId);
            var wf = await _db.AgentWorkflows.FindAsync(workflowId);
            return Ok(new { workflowId, agent = "validator", status = wf!.Status, validation = ParseJson(wf.Validation), approvalId = wf.ApprovalId });
        }
        catch (Exception ex) { await MarkFailed(workflowId, ex.Message); return StatusCode(500, new { error = ex.Message }); }
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private async Task<Guid> GetOrCreateWorkflow(AgentRunRequest req, string agentName)
    {
        if (req.WorkflowId.HasValue)
        {
            var existing = await _db.AgentWorkflows.FindAsync(req.WorkflowId.Value);
            if (existing != null)
            {
                if (req.Questionnaire.HasValue)
                {
                    existing.Questionnaire = req.Questionnaire.Value.GetRawText();
                    existing.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }
                return existing.Id;
            }
        }

        var wf = new Entities.AgentWorkflow
        {
            Id = Guid.NewGuid(),
            ProjectId = req.ProjectId,
            InitiatorId = req.InitiatorId,
            Role = "student",
            Objective = $"Run {agentName} agent",
            Status = "running",
            ApprovalStatus = "none",
            Errors = "[]",
            Questionnaire = req.Questionnaire.HasValue ? req.Questionnaire.Value.GetRawText() : null
        };
        _db.AgentWorkflows.Add(wf);
        await _db.SaveChangesAsync();
        return wf.Id;
    }

    private async Task MarkFailed(Guid workflowId, string error)
    {
        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        if (wf != null)
        {
            wf.Status = "failed";
            wf.Errors = JsonSerializer.Serialize(new[] { error });
            await _db.SaveChangesAsync();
        }
    }

    private static object? ParseJson(string? json) => string.IsNullOrEmpty(json) ? null : JsonDocument.Parse(json).RootElement;

    [HttpGet("api/agent/{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var wf = await _db.AgentWorkflows.FindAsync(id);
        if (wf == null) return NotFound(new { error = "Workflow not found" });
        return Ok(new {
            workflowId = wf.Id, status = wf.Status,
            plan = ParseJson(wf.Plan), analysis = ParseJson(wf.Analysis),
            endorsement = ParseJson(wf.Endorsement), validation = ParseJson(wf.Validation),
            approvalId = wf.ApprovalId
        });
    }

    [HttpGet("api/agent/{id}/steps")]
    public async Task<IActionResult> Steps(Guid id)
    {
        var steps = await _db.AgentSteps.Where(s => s.WorkflowId == id).OrderBy(s => s.StepNumber)
            .Select(s => new { s.AgentName, s.StepNumber, s.ToolsCalled, s.DurationMs, s.Status, s.CreatedAt }).ToListAsync();
        return Ok(steps);
    }

    public class ApproveRequest { public string ActorId { get; set; } = ""; public string? Reason { get; set; } }

    [HttpPost("api/agent/{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest req)
    {
        try { await _orchestrator.ApproveAsync(id, req.ActorId); return Ok(new { success = true, status = "approved" }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("api/agent/{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ApproveRequest req)
    {
        try { await _orchestrator.RejectAsync(id, req.ActorId, req.Reason ?? "Not specified"); return Ok(new { success = true, status = "rejected" }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    public class StartRequest
    {
        public string ProjectId { get; set; } = "";
        public string InitiatorId { get; set; } = "";
        public string Role { get; set; } = "student";
        public string Objective { get; set; } = "";
        public JsonElement? Questionnaire { get; set; }
    }

    [HttpPost("api/agent/start")]
    public async Task<IActionResult> Start([FromBody] StartRequest req)
    {
        var objective = string.IsNullOrWhiteSpace(req.Objective) ? $"Prepare project {req.ProjectId}" : req.Objective;
        var questionnaireJson = req.Questionnaire.HasValue ? req.Questionnaire.Value.GetRawText() : null;
        var workflowId = await _orchestrator.StartAsync(req.ProjectId, req.InitiatorId, req.Role, objective, questionnaireJson);
        var wf = await _db.AgentWorkflows.FindAsync(workflowId);
        return Ok(new {
            workflowId = wf!.Id, status = wf.Status,
            plan = ParseJson(wf.Plan), analysis = ParseJson(wf.Analysis),
            endorsement = ParseJson(wf.Endorsement), validation = ParseJson(wf.Validation),
            approvalId = wf.ApprovalId
        });
    }
}
