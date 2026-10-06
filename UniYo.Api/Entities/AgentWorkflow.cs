using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniYo.Api.Entities;

[Table("agent_workflows")]
public class AgentWorkflow
{
    [Key][Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("objective")] public string Objective { get; set; } = "";
    [Column("initiator_id")] public string InitiatorId { get; set; } = "";
    [Column("role")] public string Role { get; set; } = "";
    [Column("status")] public string Status { get; set; } = "planning";

    // Each agent writes to its own column
    [Column("plan", TypeName = "jsonb")] public string? Plan { get; set; }              // Agent 1: Collaborator
    [Column("analysis", TypeName = "jsonb")] public string? Analysis { get; set; }      // Agent 2: Business
    [Column("endorsement", TypeName = "jsonb")] public string? Endorsement { get; set; }// Agent 3: Professor
    [Column("validation", TypeName = "jsonb")] public string? Validation { get; set; }  // Agent 4: Validator

    // Approval
    [Column("approval_status")] public string ApprovalStatus { get; set; } = "none";
    [Column("questionnaire", TypeName = "jsonb")] public string? Questionnaire { get; set; }
    [Column("approval_actor_id")] public string? ApprovalActorId { get; set; }
    [Column("approval_id")] public string? ApprovalId { get; set; }

    [Column("final_outcome", TypeName = "jsonb")] public string? FinalOutcome { get; set; }
    [Column("errors", TypeName = "jsonb")] public string Errors { get; set; } = "[]";
    [Column("duration_ms")] public int? DurationMs { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("agent_steps")]
public class AgentStep
{
    [Key][Column("id")] public Guid Id { get; set; } = Guid.NewGuid();
    [Column("workflow_id")] public Guid WorkflowId { get; set; }
    [Column("agent_name")] public string AgentName { get; set; } = "";
    [Column("step_number")] public int StepNumber { get; set; }
    [Column("input", TypeName = "jsonb")] public string? Input { get; set; }
    [Column("output", TypeName = "jsonb")] public string? Output { get; set; }
    [Column("tools_called", TypeName = "jsonb")] public string? ToolsCalled { get; set; }
    [Column("duration_ms")] public int? DurationMs { get; set; }
    [Column("status")] public string Status { get; set; } = "ok";
    [Column("error")] public string? Error { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

