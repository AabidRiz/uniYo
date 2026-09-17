using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public AdminController(UniYoDbContext db) => _db = db;

    // ============================================================
    // VERIFICATION QUEUE — flat array with full data
    // ============================================================
    [HttpGet("verification-queue")]
    public async Task<IActionResult> GetVerificationQueue()
    {
        var combined = new List<object>();

        var queued = await _db.VerificationQueues.OrderByDescending(q => q.Id).ToListAsync();
        foreach (var q in queued)
        {
            User? user = null;
            if (!string.IsNullOrEmpty(q.UserId))
                user = await _db.Users.FindAsync(q.UserId);
            else if (!string.IsNullOrEmpty(q.Email))
                user = await _db.Users.FirstOrDefaultAsync(u => u.Email == q.Email);

            combined.Add(new
            {
                id = q.Id,
                userId = q.UserId,
                user_id = q.UserId,
                name = q.Name,
                email = q.Email,
                studentId = q.StudentId,
                student_id = q.StudentId,
                university = q.University,
                role = user?.Role ?? "student",
                company = user?.Company,
                industry = user?.Industry,
                title = user?.Title,
                faculty = user?.Faculty,
                degree = user?.Degree,
                bio = user?.Bio,
                avatarBase64 = user?.AvatarBase64,
                avatar_base64 = user?.AvatarBase64,
                submittedAt = q.SubmittedAt ?? "Recently",
                submitted_at = q.SubmittedAt ?? "Recently",
                idFormatMatch = q.IdFormatMatch,
                id_format_match = q.IdFormatMatch,
                otpVerified = q.OtpVerified,
                otp_verified = q.OtpVerified,
                aiConfidence = q.AiConfidence ?? "88%",
                ai_confidence = q.AiConfidence ?? "88%",
                flagReason = q.FlagReason ?? "Pending admin review",
                flag_reason = q.FlagReason ?? "Pending admin review",
                idCardBase64 = q.IdCardBase64 ?? user?.CoverBase64,
                id_card_base64 = q.IdCardBase64 ?? user?.CoverBase64,
                enterpriseProfile = ParseEnterpriseProfile(user),
                enterprise_profile = ParseEnterpriseProfile(user),
                status = q.Status,
                verified = user?.Verified ?? false
            });
        }

        var direct = await _db.Users
            .Where(u => (u.Role == "professor" || u.Role == "business") && u.VerificationStatus == "pending")
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        foreach (var u in direct)
        {
            combined.Add(new
            {
                id = u.Id,
                userId = u.Id,
                user_id = u.Id,
                name = u.Name,
                email = u.Email,
                studentId = (string?)null,
                student_id = (string?)null,
                university = u.UniversityName,
                role = u.Role,
                company = u.Company,
                industry = u.Industry,
                title = u.Title,
                faculty = u.Faculty,
                degree = u.Degree,
                bio = u.Bio,
                avatarBase64 = u.AvatarBase64,
                avatar_base64 = u.AvatarBase64,
                submittedAt = "Recently",
                submitted_at = "Recently",
                idFormatMatch = false,
                id_format_match = false,
                otpVerified = true,
                otp_verified = true,
                aiConfidence = "—",
                ai_confidence = "—",
                flagReason = u.VerificationReason ?? "Awaiting admin review",
                flag_reason = u.VerificationReason ?? "Awaiting admin review",
                idCardBase64 = u.CoverBase64,
                id_card_base64 = u.CoverBase64,
                enterpriseProfile = ParseEnterpriseProfile(u),
                enterprise_profile = ParseEnterpriseProfile(u),
                status = "Pending",
                verified = u.Verified
            });
        }

        return Ok(combined);
    }

    private static object? ParseEnterpriseProfile(User? u)
    {
        if (u == null || string.IsNullOrEmpty(u.EnterpriseProfile)) return null;
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(u.EnterpriseProfile);
        }
        catch { return null; }
    }

    // ============================================================
    // APPROVE / REJECT a student queue item
    // ============================================================
    [HttpPost("verify/{id}")]
    public async Task<IActionResult> Verify(string id, [FromBody] VerifyDto dto)
    {
        var q = await _db.VerificationQueues.FindAsync(id);
        if (q == null) return NotFound(new { error = "Queue item not found" });

        q.Status = dto.Action == "approve" ? "Approved" : "Rejected";

        var user = !string.IsNullOrEmpty(q.UserId)
            ? await _db.Users.FindAsync(q.UserId)
            : await _db.Users.FirstOrDefaultAsync(u => u.Email == q.Email);

        if (user != null)
        {
            if (dto.Action == "approve")
            {
                user.Verified = true;
                user.VerificationStatus = "verified";
                user.VerificationReason = "Approved by admin";
            }
            else
            {
                _db.Users.Remove(user);
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = q.Status });
    }

    // ============================================================
    // APPROVE / REJECT professor or business
    // ============================================================
    [HttpPost("verify-user/{id}")]
    public async Task<IActionResult> VerifyUser(string id, [FromBody] VerifyDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { error = "Account not found" });

        if (dto.Action == "approve")
        {
            user.Verified = true;
            user.VerificationStatus = "verified";
            user.VerificationReason = "Approved by admin";
            var q = await _db.VerificationQueues.FirstOrDefaultAsync(x => x.UserId == id);
            if (q != null) q.Status = "Approved";
        }
        else
        {
            var q = await _db.VerificationQueues.FirstOrDefaultAsync(x => x.UserId == id);
            if (q != null) q.Status = "Rejected";
            _db.Users.Remove(user);
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = dto.Action == "approve" ? "Approved" : "Deleted" });
    }

    // ============================================================
    // INVESTMENTS — with both snake_case and camelCase aliases
    // ============================================================
    [HttpGet("investments")]
    public async Task<IActionResult> GetInvestments()
    {
        var rows = await _db.InvestmentInterests.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(rows.Select(i => new
        {
            id = i.Id,
            projectId = i.ProjectId,
            project_id = i.ProjectId,
            projectTitle = i.ProjectTitle,
            project_title = i.ProjectTitle,
            studentLead = i.StudentLead,
            student_lead = i.StudentLead,
            studentId = i.StudentId,
            student_id = i.StudentId,
            investorId = i.InvestorId,
            investor_id = i.InvestorId,
            investorName = i.InvestorName,
            investor_name = i.InvestorName,
            targetAmount = i.TargetAmount,
            target_amount = i.TargetAmount,
            status = i.Status,
            aiSummary = i.AiSummary,
            ai_summary = i.AiSummary,
            meetingSlot = i.MeetingSlot,
            meeting_slot = i.MeetingSlot,
            createdAt = i.CreatedAt,
            created_at = i.CreatedAt
        }));
    }

    [HttpPut("investments/{id}")]
    public async Task<IActionResult> ModerateInvestment(string id, [FromBody] ModerateInvestmentDto dto)
    {
        var inv = await _db.InvestmentInterests.FindAsync(id);
        if (inv == null) return NotFound(new { error = "Investment not found" });
        inv.Status = dto.Action == "approve" ? "Approved" : "Passed";
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = inv.Id,
            projectTitle = inv.ProjectTitle,
            project_title = inv.ProjectTitle,
            status = inv.Status
        });
    }

    // ============================================================
    // CONTENT MODERATION
    // ============================================================
    [HttpGet("content")]
    public async Task<IActionResult> GetContent()
    {
        var posts = await _db.Posts.OrderByDescending(p => p.CreatedAt).Take(50).ToListAsync();
        var projects = await _db.Projects.OrderByDescending(p => p.CreatedAt).Take(50).ToListAsync();
        var videos = await _db.ProfessorVideos.OrderByDescending(v => v.CreatedAt).Take(50).ToListAsync();
        var complaints = await _db.AdminComplaints.OrderByDescending(c => c.CreatedAt).Take(50).ToListAsync();

        return Ok(new
        {
            posts = posts.Select(p => new
            {
                id = p.Id,
                authorName = p.AuthorName,
                author_name = p.AuthorName,
                authorRole = p.AuthorRole,
                author_role = p.AuthorRole,
                content = p.Content,
                image = p.ImageBase64,
                createdAt = p.CreatedAt,
                created_at = p.CreatedAt
            }),
            projects = projects.Select(p => new
            {
                id = p.Id,
                title = p.Title,
                ownerName = p.OwnerName,
                owner_name = p.OwnerName,
                description = p.Description,
                createdAt = p.CreatedAt,
                created_at = p.CreatedAt
            }),
            videos = videos.Select(v => new
            {
                id = v.Id,
                title = v.Title,
                description = v.Description,
                createdAt = v.CreatedAt,
                created_at = v.CreatedAt
            }),
            complaints = complaints.Select(c => new
            {
                id = c.Id,
                reporterId = c.ReporterId,
                reporter_id = c.ReporterId,
                targetType = c.TargetType,
                target_type = c.TargetType,
                targetId = c.TargetId,
                target_id = c.TargetId,
                reason = c.Reason,
                status = c.Status,
                createdAt = c.CreatedAt,
                created_at = c.CreatedAt
            })
        });
    }

    [HttpDelete("content/{type}/{id}")]
    public async Task<IActionResult> DeleteContent(string type, string id)
    {
        if (type == "posts")
        {
            var p = await _db.Posts.FindAsync(id);
            if (p != null) { _db.Posts.Remove(p); await _db.SaveChangesAsync(); }
        }
        else if (type == "projects")
        {
            var p = await _db.Projects.FindAsync(id);
            if (p != null) { _db.Projects.Remove(p); await _db.SaveChangesAsync(); }
        }
        else if (type == "videos")
        {
            var v = await _db.ProfessorVideos.FindAsync(id);
            if (v != null) { _db.ProfessorVideos.Remove(v); await _db.SaveChangesAsync(); }
        }
        else return BadRequest(new { error = "Invalid content type" });

        return Ok(new { message = "Deleted" });
    }

    // ============================================================
    // COMPLAINTS
    // ============================================================
    [HttpPost("complaints")]
    public async Task<IActionResult> SubmitComplaint([FromBody] ComplaintDto dto)
    {
        if (string.IsNullOrEmpty(dto.ReporterId) || string.IsNullOrEmpty(dto.TargetType) || string.IsNullOrEmpty(dto.TargetId))
            return BadRequest(new { error = "Complaint details required" });

        var id = $"complaint_{DateTime.UtcNow.Ticks}";
        _db.AdminComplaints.Add(new AdminComplaint
        {
            Id = id,
            ReporterId = dto.ReporterId,
            TargetType = dto.TargetType,
            TargetId = dto.TargetId,
            Reason = dto.Reason,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id, status = "Pending" });
    }

    [HttpPut("complaints/{id}")]
    public async Task<IActionResult> ModerateComplaint(string id, [FromBody] ModerateComplaintDto dto)
    {
        var c = await _db.AdminComplaints.FindAsync(id);
        if (c == null) return NotFound();
        c.Status = dto.Action == "remove" ? "Removed" : "Reviewed";
        await _db.SaveChangesAsync();
        return Ok(c);
    }
}
