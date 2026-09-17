using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    private readonly ProjectService _projects;
    private readonly MembershipService _members;
    private readonly ActivityService _activity;

    public ProjectsController(UniYoDbContext db, ProjectService projects,
        MembershipService members, ActivityService activity)
    {
        _db = db;
        _projects = projects;
        _members = members;
        _activity = activity;
    }

    // ============================================================
    // PROJECT CRUD
    // ============================================================
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? viewerId)
    {
        var rows = await _db.Projects.OrderByDescending(p => p.CreatedAt).ToListAsync();
        var list = new List<object>();
        foreach (var p in rows) list.Add(await _projects.BuildProjectAsync(p, viewerId));
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, [FromQuery] string? viewerId)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound(new { error = "Not found" });
        return Ok(await _projects.BuildProjectAsync(p, viewerId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest(new { error = "Title and description required" });

        var owner = await _db.Users.FindAsync(dto.OwnerId);
        if (owner == null) return BadRequest(new { error = "Invalid owner" });

        var pid = $"proj_{DateTime.UtcNow.Ticks}";
        var p = new Project
        {
            Id = pid,
            OwnerId = owner.Id,
            OwnerName = owner.Name,
            OwnerUniversity = owner.UniversityName,
            OwnerAvatarBase64 = owner.AvatarBase64,
            Title = dto.Title,
            Description = dto.Description,
            BannerBase64 = dto.BannerBase64,
            OpenUniversities = dto.OpenUniversities ?? new[] { "ALL" },
            SkillsNeeded = dto.SkillsNeeded ?? Array.Empty<string>(),
            SeekingInvestment = dto.SeekingInvestment,
            InvestmentGoal = dto.InvestmentGoal ?? "LKR 1,000,000",
            TractionScore = 85,
            Visibility = dto.Visibility ?? "public",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Projects.Add(p);

        _db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = pid,
            UserId = owner.Id,
            Role = "Lead Founder",
        });

        _db.ProjectMessages.Add(new ProjectMessage
        {
            Id = $"msg_{DateTime.UtcNow.Ticks}",
            ProjectId = pid,
            SenderId = owner.Id,
            Sender = owner.Name,
            AvatarBase64 = owner.AvatarBase64,
            Text = "Welcome to the project workspace!",
            MessageType = "system",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await _activity.LogAsync(pid, owner.Id, owner.Name, "created_project", null, null, $"Created project {dto.Title}");

        return StatusCode(201, await _projects.BuildProjectAsync(p, owner.Id));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateProjectDto dto)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound();

        if (dto.Title != null) p.Title = dto.Title;
        if (dto.Description != null) p.Description = dto.Description;
        if (dto.SkillsNeeded != null) p.SkillsNeeded = dto.SkillsNeeded;
        if (dto.SeekingInvestment.HasValue) p.SeekingInvestment = dto.SeekingInvestment.Value;
        if (dto.InvestmentGoal != null) p.InvestmentGoal = dto.InvestmentGoal;
        if (dto.Visibility != null) p.Visibility = dto.Visibility;
        p.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(dto.UserId))
        {
            var u = await _db.Users.FindAsync(dto.UserId);
            if (u != null)
                await _activity.LogAsync(id, u.Id, u.Name, "updated_project", null, null, "Updated project settings");
        }

        return Ok(await _projects.BuildProjectAsync(p, dto.UserId));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound();

        var requests = _db.ProjectRequests.Where(r => r.ProjectId == id);
        var messages = _db.ProjectMessages.Where(m => m.ProjectId == id);
        var tasks = _db.ProjectTasks.Where(t => t.ProjectId == id);
        var repos = _db.ProjectRepos.Where(r => r.ProjectId == id);
        var docs = _db.ProjectDocs.Where(d => d.ProjectId == id);
        var members = _db.ProjectMembers.Where(m => m.ProjectId == id);
        var advisors = _db.ProjectAdvisors.Where(a => a.ProjectId == id);
        var meetings = _db.ProjectMeetings.Where(m => m.ProjectId == id);
        var acts = _db.ProjectActivities.Where(a => a.ProjectId == id);

        _db.ProjectRequests.RemoveRange(requests);
        _db.ProjectMessages.RemoveRange(messages);
        _db.ProjectTasks.RemoveRange(tasks);
        _db.ProjectRepos.RemoveRange(repos);
        _db.ProjectDocs.RemoveRange(docs);
        _db.ProjectMembers.RemoveRange(members);
        _db.ProjectAdvisors.RemoveRange(advisors);
        _db.ProjectMeetings.RemoveRange(meetings);
        _db.ProjectActivities.RemoveRange(acts);
        _db.Projects.Remove(p);

        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // JOIN REQUESTS
    // ============================================================
    [HttpPost("{id}/requests")]
    public async Task<IActionResult> RequestJoin(string id, [FromBody] JoinRequestDto dto)
    {
        var proj = await _db.Projects.FindAsync(id);
        if (proj == null) return NotFound(new { error = "Project not found" });
        if (proj.Visibility == "private") return StatusCode(403, new { error = "Private project — invitation only" });
        if (await _members.IsMemberAsync(id, dto.ApplicantId)) return BadRequest(new { error = "Already a member" });

        var applicant = await _db.Users.FindAsync(dto.ApplicantId);
        if (applicant == null) return BadRequest(new { error = "Invalid applicant" });

        var dup = await _db.ProjectRequests.AnyAsync(r =>
            r.ProjectId == id && r.ApplicantId == dto.ApplicantId &&
            r.Type == "request" && r.Status == "Pending");
        if (dup) return Conflict(new { error = "Request already pending" });

        var rid = $"req_{DateTime.UtcNow.Ticks}";
        _db.ProjectRequests.Add(new ProjectRequest
        {
            Id = rid,
            ProjectId = id,
            ApplicantId = applicant.Id,
            ApplicantName = applicant.Name,
            University = applicant.UniversityName,
            Skill = dto.Skill ?? "General",
            Pitch = dto.Pitch ?? "",
            Status = "Pending",
            Type = "request",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, applicant.Id, applicant.Name, "requested_join", "request", rid, $"{applicant.Name} requested to join");

        return StatusCode(201, new { id = rid, status = "Pending" });
    }

    [HttpPut("{projectId}/requests/{requestId}")]
    public async Task<IActionResult> RespondToRequest(string projectId, string requestId, [FromBody] RequestStatusDto dto)
    {
        var proj = await _db.Projects.FindAsync(projectId);
        if (proj == null) return NotFound();
        if (proj.OwnerId != dto.OwnerId) return StatusCode(403, new { error = "Only owner" });

        var r = await _db.ProjectRequests.FirstOrDefaultAsync(x =>
            x.Id == requestId && x.ProjectId == projectId && x.Type == "request");
        if (r == null) return NotFound(new { error = "Request not found" });

        r.Status = dto.Status;
        r.RespondedAt = DateTime.UtcNow;

        if (dto.Status == "Accepted" && !string.IsNullOrEmpty(r.ApplicantId))
        {
            var exists = await _db.ProjectMembers.AnyAsync(m =>
                m.ProjectId == projectId && m.UserId == r.ApplicantId);
            if (!exists)
            {
                _db.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = projectId,
                    UserId = r.ApplicantId,
                    Role = "Collaborator",
                });
            }
            _db.ProjectMessages.Add(new ProjectMessage
            {
                Id = $"sys_{DateTime.UtcNow.Ticks}",
                ProjectId = projectId,
                Sender = "System",
                Text = $"{r.ApplicantName} joined the project",
                MessageType = "system",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        await _activity.LogAsync(projectId, dto.OwnerId, proj.OwnerName,
            dto.Status == "Accepted" ? "accepted_request" : "rejected_request",
            "request", requestId, $"{dto.Status} {r.ApplicantName}'s request");

        return Ok(new { message = "Updated" });
    }

    [HttpDelete("{projectId}/requests/{requestId}")]
    public async Task<IActionResult> DeleteRequest(string projectId, string requestId)
    {
        var r = await _db.ProjectRequests.FirstOrDefaultAsync(x =>
            x.Id == requestId && x.ProjectId == projectId);
        if (r == null) return NotFound();
        _db.ProjectRequests.Remove(r);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // INVITES
    // ============================================================
    [HttpPost("{id}/invites")]
    public async Task<IActionResult> Invite(string id, [FromBody] InviteDto dto)
    {
        var proj = await _db.Projects.FindAsync(id);
        if (proj == null) return NotFound();
        if (proj.OwnerId != dto.OwnerId) return StatusCode(403, new { error = "Only owner can invite" });
        if (await _members.IsMemberAsync(id, dto.InvitedUserId)) return BadRequest(new { error = "Already a member" });

        var invited = await _db.Users.FindAsync(dto.InvitedUserId);
        if (invited == null) return BadRequest(new { error = "Invalid user" });

        var dup = await _db.ProjectRequests.AnyAsync(r =>
            r.ProjectId == id && r.ApplicantId == dto.InvitedUserId &&
            r.Type == "invite" && r.Status == "Pending");
        if (dup) return Conflict(new { error = "Invite already pending" });

        var rid = $"inv_{DateTime.UtcNow.Ticks}";
        _db.ProjectRequests.Add(new ProjectRequest
        {
            Id = rid,
            ProjectId = id,
            ApplicantId = invited.Id,
            ApplicantName = invited.Name,
            University = invited.UniversityName,
            Skill = dto.Skill ?? "General",
            Pitch = dto.Pitch ?? "",
            Status = "Pending",
            Type = "invite",
            InvitedById = dto.OwnerId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, dto.OwnerId, proj.OwnerName, "invited_user", "invite", rid, $"Invited {invited.Name} to join");

        return StatusCode(201, new { id = rid, status = "Pending" });
    }

    [HttpPut("{projectId}/invites/{inviteId}")]
    public async Task<IActionResult> RespondToInvite(string projectId, string inviteId, [FromBody] InviteStatusDto dto)
    {
        var r = await _db.ProjectRequests.FirstOrDefaultAsync(x =>
            x.Id == inviteId && x.ProjectId == projectId && x.Type == "invite");
        if (r == null) return NotFound();
        if (r.ApplicantId != dto.UserId) return StatusCode(403, new { error = "Not your invite" });

        r.Status = dto.Status;
        r.RespondedAt = DateTime.UtcNow;

        if (dto.Status == "Accepted")
        {
            var exists = await _db.ProjectMembers.AnyAsync(m =>
                m.ProjectId == projectId && m.UserId == dto.UserId);
            if (!exists)
            {
                _db.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = projectId,
                    UserId = dto.UserId,
                    Role = "Collaborator",
                });
            }
            _db.ProjectMessages.Add(new ProjectMessage
            {
                Id = $"sys_{DateTime.UtcNow.Ticks}",
                ProjectId = projectId,
                Sender = "System",
                Text = $"{r.ApplicantName} joined the project",
                MessageType = "system",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    // ============================================================
    // MEMBERS
    // ============================================================
    [HttpDelete("{projectId}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(string projectId, string userId, [FromQuery] string? actorId)
    {
        var proj = await _db.Projects.FindAsync(projectId);
        if (proj == null) return NotFound();

        var isOwner = proj.OwnerId == actorId;
        var isSelf = actorId == userId;
        if (!isOwner && !isSelf) return StatusCode(403, new { error = "Not allowed" });
        if (userId == proj.OwnerId) return BadRequest(new { error = "Cannot remove owner" });

        var member = await _db.ProjectMembers.FirstOrDefaultAsync(m =>
            m.ProjectId == projectId && m.UserId == userId);
        if (member == null) return NotFound();
        var memberName = (await _db.Users.FindAsync(userId))?.Name ?? "Member";

        _db.ProjectMembers.Remove(member);
        await _db.SaveChangesAsync();

        await _activity.LogAsync(projectId, actorId, memberName,
            isSelf ? "left_project" : "removed_member", "member", userId,
            isSelf ? $"{memberName} left the project" : $"Removed {memberName}");

        return Ok(new { message = "Done" });
    }

    [HttpGet("{id}/available-invitees")]
    public async Task<IActionResult> GetAvailableInvitees(string id, [FromQuery] string? role)
    {
        var memberIds = await _db.ProjectMembers.Where(m => m.ProjectId == id)
            .Select(m => m.UserId).ToListAsync();
        var inviteeIds = await _db.ProjectRequests
            .Where(r => r.ProjectId == id && r.Type == "invite" && r.Status == "Pending")
            .Select(r => r.ApplicantId).ToListAsync();

        var students = await _db.Users
            .Where(u => u.Role == "student"
                     && !memberIds.Contains(u.Id)
                     && !inviteeIds.Contains(u.Id!))
            .OrderBy(u => u.Name)
            .ToListAsync();

        var list = new List<object>();
        foreach (var u in students) list.Add(new
        {
            id = u.Id,
            name = u.Name,
            university = u.UniversityName,
            avatar = u.AvatarBase64,
            verified = u.Verified
        });
        return Ok(list);
    }

    // ============================================================
    // ADVISOR
    // ============================================================
    [HttpPost("{id}/advisor-request")]
    public async Task<IActionResult> RequestAdvisor(string id, [FromBody] UniYo.Api.Dtos.AdvisorRequestDto dto)
    {
        string profId = dto.ProfId;
        string ownerId = dto.OwnerId;
        string? pitch = dto.Pitch;

        var proj = await _db.Projects.FindAsync(id);
        if (proj == null) return NotFound();
        if (proj.OwnerId != ownerId) return StatusCode(403, new { error = "Only owner" });

        var prof = await _db.Users.FirstOrDefaultAsync(u => u.Id == profId && u.Role == "professor");
        if (prof == null) return BadRequest(new { error = "Invalid professor" });

        var existing = await _db.ProjectAdvisors.FirstOrDefaultAsync(a =>
            a.ProjectId == id && a.ProfId == profId);

        if (existing != null)
        {
            if (existing.Status == "Active") return Conflict(new { error = "Already advising this project" });
            existing.Status = "Pending";
            existing.Pitch = pitch ?? "";
            existing.RequestedBy = ownerId;
            existing.RequestedAt = DateTime.UtcNow;
        }
        else
        {
            _db.ProjectAdvisors.Add(new ProjectAdvisor
            {
                ProjectId = id,
                ProfId = profId,
                Status = "Pending",
                Pitch = pitch ?? "",
                RequestedBy = ownerId,
                RequestedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, ownerId, proj.OwnerName, "requested_advisor", "advisor", profId, $"Requested Prof. {prof.Name} to advise");
        return Ok(new { message = "Advisor request sent" });
    }

    [HttpPut("{projectId}/advisor/{profId}")]
    public async Task<IActionResult> RespondAdvisor(string projectId, string profId, [FromBody] UniYo.Api.Dtos.AdvisorRespondDto dto)
    {
        string status = dto.Status;
        var advisor = await _db.ProjectAdvisors.FirstOrDefaultAsync(a =>
            a.ProjectId == projectId && a.ProfId == profId);
        if (advisor == null) return NotFound();
        advisor.Status = status;
        advisor.RespondedAt = DateTime.UtcNow;

        var prof = await _db.Users.FindAsync(profId);
        var profName = prof?.Name ?? "Professor";

        if (status == "Active")
        {
            _db.ProjectMessages.Add(new ProjectMessage
            {
                Id = $"sys_{DateTime.UtcNow.Ticks}",
                ProjectId = projectId,
                Sender = "System",
                Text = $"{profName} joined as Faculty Advisor",
                MessageType = "system",
                CreatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();

        await _activity.LogAsync(projectId, profId, profName,
            status == "Active" ? "advisor_accepted" : "advisor_declined",
            "advisor", profId, $"{profName} {(status == "Active" ? "accepted" : "declined")} advisor role");

        return Ok(new { message = "Updated" });
    }

    [HttpDelete("{projectId}/advisor/{profId}")]
    public async Task<IActionResult> RemoveAdvisor(string projectId, string profId, [FromQuery] string? actorId)
    {
        var proj = await _db.Projects.FindAsync(projectId);
        if (proj == null) return NotFound();
        if (proj.OwnerId != actorId) return StatusCode(403, new { error = "Only owner" });

        var advisor = await _db.ProjectAdvisors.FirstOrDefaultAsync(a =>
            a.ProjectId == projectId && a.ProfId == profId);
        if (advisor != null)
        {
            _db.ProjectAdvisors.Remove(advisor);
            await _db.SaveChangesAsync();
        }
        return Ok(new { message = "Advisor removed" });
    }

    // ============================================================
    // CHAT MESSAGES
    // ============================================================
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(string id, [FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest(new { error = "text required" });
        if (!await _members.CanReadAsync(id, dto.SenderId))
            return StatusCode(403, new { error = "Only members and advisors can post" });

        var sender = await _db.Users.FindAsync(dto.SenderId);
        if (sender == null) return BadRequest(new { error = "Invalid sender" });

        var m = new ProjectMessage
        {
            Id = $"msg_{DateTime.UtcNow.Ticks}",
            ProjectId = id,
            SenderId = sender.Id,
            Sender = sender.Name,
            AvatarBase64 = sender.AvatarBase64,
            Text = dto.Text,
            MessageType = "chat",
            CreatedAt = DateTime.UtcNow
        };
        _db.ProjectMessages.Add(m);
        await _db.SaveChangesAsync();

        return StatusCode(201, new
        {
            id = m.Id,
            senderId = m.SenderId,
            sender = m.Sender,
            avatar = m.AvatarBase64,
            text = m.Text,
            messageType = "chat",
            time = m.CreatedAt.ToString("h:mm tt")
        });
    }

    // ============================================================
    // REPOS
    // ============================================================
    [HttpPost("{id}/repos")]
    public async Task<IActionResult> AddRepo(string id, [FromBody] AddRepoDto dto)
    {
        var proj = await _db.Projects.FindAsync(id);
        if (proj == null || proj.OwnerId != dto.UserId) return StatusCode(403, new { error = "Only owner" });

        var rid = $"repo_{DateTime.UtcNow.Ticks}";
        _db.ProjectRepos.Add(new ProjectRepo
        {
            Id = rid,
            ProjectId = id,
            Name = dto.Name,
            Url = dto.Url,
            Stars = dto.Stars ?? 0
        });
        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, dto.UserId, proj.OwnerName, "added_repo", "repo", rid, $"Added repo {dto.Name}");

        return StatusCode(201, new { id = rid, name = dto.Name, url = dto.Url, stars = dto.Stars ?? 0 });
    }

    [HttpDelete("{pid}/repos/{rid}")]
    public async Task<IActionResult> DeleteRepo(string pid, string rid)
    {
        var r = await _db.ProjectRepos.FirstOrDefaultAsync(x => x.Id == rid && x.ProjectId == pid);
        if (r == null) return NotFound();
        _db.ProjectRepos.Remove(r);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // DOCS
    // ============================================================
    [HttpPost("{id}/docs")]
    public async Task<IActionResult> AddDoc(string id, [FromBody] AddDocDto dto)
    {
        var proj = await _db.Projects.FindAsync(id);
        if (proj == null || proj.OwnerId != dto.UserId) return StatusCode(403, new { error = "Only owner" });

        var did = $"doc_{DateTime.UtcNow.Ticks}";
        _db.ProjectDocs.Add(new ProjectDoc
        {
            Id = did,
            ProjectId = id,
            Title = dto.Title,
            Size = dto.Size ?? "N/A",
            Url = dto.Url ?? "#",
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, dto.UserId, proj.OwnerName, "added_doc", "doc", did, $"Added document {dto.Title}");

        return StatusCode(201, new { id = did, title = dto.Title, size = dto.Size ?? "N/A", url = dto.Url ?? "#" });
    }

    [HttpDelete("{pid}/docs/{did}")]
    public async Task<IActionResult> DeleteDoc(string pid, string did)
    {
        var d = await _db.ProjectDocs.FirstOrDefaultAsync(x => x.Id == did && x.ProjectId == pid);
        if (d == null) return NotFound();
        _db.ProjectDocs.Remove(d);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // TASKS
    // ============================================================
    [HttpGet("{id}/tasks")]
    public async Task<IActionResult> GetTasks(string id, [FromQuery] string? viewerId)
    {
        if (!await _members.CanReadAsync(id, viewerId))
            return StatusCode(403, new { error = "Members only" });

        var rows = await _db.ProjectTasks
            .Where(t => t.ProjectId == id)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return Ok(rows);
    }

    [HttpPost("{id}/tasks")]
    public async Task<IActionResult> CreateTask(string id, [FromBody] TaskDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { error = "Title required" });
        if (!await _members.IsMemberAsync(id, dto.UserId))
            return StatusCode(403, new { error = "Members only" });

        var creator = await _db.Users.FindAsync(dto.UserId);
        string? assigneeName = null;
        if (!string.IsNullOrEmpty(dto.AssigneeId))
            assigneeName = (await _db.Users.FindAsync(dto.AssigneeId))?.Name;

        var tid = $"task_{DateTime.UtcNow.Ticks}";
        _db.ProjectTasks.Add(new ProjectTask
        {
            Id = tid,
            ProjectId = id,
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status ?? "todo",
            Priority = dto.Priority ?? "medium",
            AssigneeId = dto.AssigneeId,
            AssigneeName = assigneeName,
            DueDate = dto.DueDate,
            CreatedById = dto.UserId,
            CreatedByName = creator?.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, dto.UserId, creator?.Name, "created_task", "task", tid, $"Created task \"{dto.Title}\"");

        return StatusCode(201, new
        {
            id = tid,
            title = dto.Title,
            description = dto.Description,
            status = dto.Status ?? "todo",
            priority = dto.Priority ?? "medium",
            assigneeId = dto.AssigneeId,
            assigneeName,
            dueDate = dto.DueDate
        });
    }

    [HttpPut("{pid}/tasks/{tid}")]
    public async Task<IActionResult> UpdateTask(string pid, string tid, [FromBody] UpdateTaskDto dto)
    {
        if (!await _members.IsMemberAsync(pid, dto.UserId))
            return StatusCode(403, new { error = "Members only" });

        var t = await _db.ProjectTasks.FirstOrDefaultAsync(x => x.Id == tid && x.ProjectId == pid);
        if (t == null) return NotFound();

        if (dto.Title != null) t.Title = dto.Title;
        if (dto.Description != null) t.Description = dto.Description;
        if (dto.Status != null) t.Status = dto.Status;
        if (dto.Priority != null) t.Priority = dto.Priority;
        if (dto.DueDate != null) t.DueDate = dto.DueDate;
        if (dto.AssigneeId != null)
        {
            t.AssigneeId = string.IsNullOrEmpty(dto.AssigneeId) ? null : dto.AssigneeId;
            t.AssigneeName = string.IsNullOrEmpty(dto.AssigneeId)
                ? null
                : (await _db.Users.FindAsync(dto.AssigneeId))?.Name;
        }
        t.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpDelete("{pid}/tasks/{tid}")]
    public async Task<IActionResult> DeleteTask(string pid, string tid)
    {
        var t = await _db.ProjectTasks.FirstOrDefaultAsync(x => x.Id == tid && x.ProjectId == pid);
        if (t == null) return NotFound();
        _db.ProjectTasks.Remove(t);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // MEETINGS
    // ============================================================
    [HttpGet("{id}/meetings")]
    public async Task<IActionResult> GetMeetings(string id, [FromQuery] string? viewerId)
    {
        if (!await _members.CanReadAsync(id, viewerId))
            return StatusCode(403, new { error = "Members only" });

        var rows = await _db.ProjectMeetings
            .Where(m => m.ProjectId == id)
            .OrderBy(m => m.MeetingDate)
            .ToListAsync();
        return Ok(rows);
    }

    [HttpPost("{id}/meetings")]
    public async Task<IActionResult> CreateMeeting(string id, [FromBody] MeetingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { error = "Title required" });
        if (!await _members.IsMemberAsync(id, dto.UserId))
            return StatusCode(403, new { error = "Members only" });

        var creator = await _db.Users.FindAsync(dto.UserId);
        var mid = $"meet_{DateTime.UtcNow.Ticks}";
        _db.ProjectMeetings.Add(new ProjectMeeting
        {
            Id = mid,
            ProjectId = id,
            Title = dto.Title,
            Description = dto.Description,
            MeetingDate = dto.Date,
            MeetingTime = dto.Time,
            DurationMinutes = dto.DurationMinutes ?? 60,
            Link = dto.Link,
            Status = "Scheduled",
            CreatedById = dto.UserId,
            CreatedByName = creator?.Name,
            CreatedAt = DateTime.UtcNow
        });

        if (dto.AttendeeIds != null)
        {
            foreach (var aid in dto.AttendeeIds)
            {
                _db.ProjectMeetingAttendees.Add(new ProjectMeetingAttendee
                {
                    MeetingId = mid,
                    UserId = aid
                });
            }
        }

        await _db.SaveChangesAsync();
        await _activity.LogAsync(id, dto.UserId, creator?.Name, "scheduled_meeting", "meeting", mid, $"Scheduled meeting \"{dto.Title}\"");

        return StatusCode(201, new
        {
            id = mid,
            title = dto.Title,
            description = dto.Description,
            date = dto.Date,
            time = dto.Time,
            durationMinutes = dto.DurationMinutes ?? 60,
            link = dto.Link,
            status = "Scheduled"
        });
    }

    [HttpDelete("{pid}/meetings/{mid}")]
    public async Task<IActionResult> DeleteMeeting(string pid, string mid)
    {
        var m = await _db.ProjectMeetings.FirstOrDefaultAsync(x => x.Id == mid && x.ProjectId == pid);
        if (m == null) return NotFound();
        _db.ProjectMeetings.Remove(m);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // ACTIVITY
    // ============================================================
    [HttpGet("{id}/activity")]
    public async Task<IActionResult> GetActivity(string id, [FromQuery] string? viewerId)
    {
        if (!await _members.CanReadAsync(id, viewerId))
            return StatusCode(403, new { error = "Members only" });

        var rows = await _db.ProjectActivities
            .Where(a => a.ProjectId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .ToListAsync();
        return Ok(rows);
    }
}

