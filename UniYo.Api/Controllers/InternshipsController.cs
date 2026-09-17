using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
public class InternshipsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public InternshipsController(UniYoDbContext db) => _db = db;

    [HttpGet("api/internships")]
    public async Task<IActionResult> GetAll([FromQuery] string? ownerId)
    {
        var q = _db.Internships.AsQueryable();
        if (!string.IsNullOrEmpty(ownerId)) q = q.Where(j => j.OwnerId == ownerId);
        var rows = await q.OrderByDescending(j => j.CreatedAt).ToListAsync();
        var list = new List<object>();
        foreach (var j in rows)
        {
            var apps = await _db.InternshipApplications.Where(a => a.InternshipId == j.Id).ToListAsync();
            list.Add(new
            {
                id = j.Id,
                ownerId = j.OwnerId,
                title = j.Title,
                company = j.Company,
                location = j.Location,
                stipend = j.Stipend,
                type = j.Type,
                description = j.Description,
                createdAt = j.CreatedAt,
                applicants = apps
            });
        }
        return Ok(list);
    }

    [HttpPost("api/internships")]
    public async Task<IActionResult> Create([FromBody] CreateInternshipDto dto)
    {
        var id = $"job_{DateTime.UtcNow.Ticks}";
        _db.Internships.Add(new Internship
        {
            Id = id,
            OwnerId = dto.OwnerId,
            Title = dto.Title,
            Company = dto.Company,
            Location = dto.Location ?? "Colombo",
            Stipend = dto.Stipend ?? "LKR 50,000",
            Type = dto.Type ?? "Internship",
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        var job = await _db.Internships.FindAsync(id);
        return StatusCode(201, job);
    }

    [HttpPut("api/internships/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateInternshipDto dto)
    {
        var j = await _db.Internships.FindAsync(id);
        if (j == null) return NotFound();
        if (dto.Title != null) j.Title = dto.Title;
        if (dto.Location != null) j.Location = dto.Location;
        if (dto.Stipend != null) j.Stipend = dto.Stipend;
        if (dto.Description != null) j.Description = dto.Description;
        await _db.SaveChangesAsync();
        return Ok(j);
    }

    [HttpDelete("api/internships/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var j = await _db.Internships.FindAsync(id);
        if (j == null) return NotFound();
        var apps = _db.InternshipApplications.Where(a => a.InternshipId == id);
        _db.InternshipApplications.RemoveRange(apps);
        _db.Internships.Remove(j);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    [HttpPut("api/internships/{jobId}/applicants/{appId}")]
    public async Task<IActionResult> UpdateApplicant(string jobId, string appId, [FromBody] ApplicantStatusDto dto)
    {
        var app = await _db.InternshipApplications.FindAsync(appId);
        if (app == null) return NotFound();
        app.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(app);
    }

    [HttpPost("api/internships/{jobId}/apply")]
    public async Task<IActionResult> Apply(string jobId, [FromBody] ApplyJobDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.UserId) || string.IsNullOrEmpty(dto.Name) || string.IsNullOrEmpty(dto.Email)
                || string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.Degree)
                || string.IsNullOrEmpty(dto.Experience) || string.IsNullOrEmpty(dto.CvBase64) || string.IsNullOrEmpty(dto.CvName))
                return BadRequest(new { error = "Personal details, education, experience, contact, and CV are required" });

            if (!await _db.Internships.AnyAsync(j => j.Id == jobId))
                return NotFound(new { error = "Internship posting not found" });

            if (!await _db.Users.AnyAsync(u => u.Id == dto.UserId))
                return NotFound(new { error = "User account not found. Please log out and log in again." });

            var exists = await _db.InternshipApplications.AnyAsync(a => a.InternshipId == jobId && a.UserId == dto.UserId);
            if (exists) return Conflict(new { error = "Already applied" });

            var id = $"app_{DateTime.UtcNow.Ticks}";
            _db.InternshipApplications.Add(new InternshipApplication
            {
                Id = id,
                InternshipId = jobId,
                UserId = dto.UserId,
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                University = dto.University,
                Degree = dto.Degree,
                Faculty = dto.Faculty,
                Gpa = dto.Gpa,
                Experience = dto.Experience,
                CvBase64 = dto.CvBase64,
                CvName = dto.CvName,
                Status = "Applied"
            });
            await _db.SaveChangesAsync();
            return StatusCode(201, new { id, status = "Applied" });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"apply route failed: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

[ApiController]
public class InvestmentsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public InvestmentsController(UniYoDbContext db) => _db = db;

    [HttpGet("api/investments")]
    public async Task<IActionResult> GetAll([FromQuery] string? investorId, [FromQuery] string? studentId)
    {
        var q = _db.InvestmentInterests.AsQueryable();
        if (!string.IsNullOrEmpty(investorId)) q = q.Where(i => i.InvestorId == investorId);
        if (!string.IsNullOrEmpty(studentId))
        {
            var leadPrefix = await _db.Users.Where(u => u.Id == studentId).Select(u => u.Name).FirstOrDefaultAsync();
            q = q.Where(i => i.StudentId == studentId || (leadPrefix != null && i.StudentLead.StartsWith(leadPrefix)));
        }
        var rows = await q.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(rows);
    }

    [HttpPost("api/investments")]
    public async Task<IActionResult> Create([FromBody] CreateInvestmentDto dto)
    {
        var id = $"inv_{DateTime.UtcNow.Ticks}";
        _db.InvestmentInterests.Add(new InvestmentInterest
        {
            Id = id,
            ProjectId = dto.ProjectId,
            ProjectTitle = dto.ProjectTitle,
            StudentLead = dto.StudentLead,
            InvestorId = dto.InvestorId,
            InvestorName = dto.InvestorName,
            TargetAmount = dto.TargetAmount,
            Status = "Pending",
            AiSummary = dto.AiSummary,
            MeetingSlot = dto.MeetingSlot,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        var inv = await _db.InvestmentInterests.FindAsync(id);
        return StatusCode(201, inv);
    }

    [HttpPut("api/investments/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UniYo.Api.Dtos.UpdateInvestmentDto dto)
    {
        var inv = await _db.InvestmentInterests.FindAsync(id);
        if (inv == null) return NotFound();
        if (dto.Status != null) inv.Status = dto.Status;
        if (dto.MeetingSlot != null) inv.MeetingSlot = dto.MeetingSlot;
        if (dto.AiSummary != null) inv.AiSummary = dto.AiSummary;
        await _db.SaveChangesAsync();
        return Ok(inv);
    }

    [HttpDelete("api/investments/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var inv = await _db.InvestmentInterests.FindAsync(id);
        if (inv == null) return NotFound();
        _db.InvestmentInterests.Remove(inv);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    [HttpGet("api/investments/{id}/meetings")]
    public async Task<IActionResult> GetMeetings(string id)
    {
        var rows = await _db.InvestmentMeetings.Where(m => m.InvestmentId == id).OrderByDescending(m => m.CreatedAt).ToListAsync();
        return Ok(rows);
    }

    [HttpPost("api/investments/{id}/meetings")]
    public async Task<IActionResult> CreateMeeting(string id, [FromBody] CreateInvestmentMeetingDto dto)
    {
        var inv = await _db.InvestmentInterests.FirstOrDefaultAsync(i => i.Id == id && i.InvestorId == dto.InvestorId && i.Status == "Approved");
        if (inv == null) return StatusCode(403, new { error = "Investment must be admin-approved and owned by investor" });

        var studentId = dto.StudentId;
        if (string.IsNullOrEmpty(studentId) && !string.IsNullOrEmpty(inv.ProjectId))
        {
            var owner = await _db.Projects.Where(p => p.Id == inv.ProjectId).Select(p => p.OwnerId).FirstOrDefaultAsync();
            studentId = owner;
        }
        if (string.IsNullOrEmpty(studentId)) return BadRequest(new { error = "Unable to determine student" });

        var mid = $"invmeet_{DateTime.UtcNow.Ticks}";
        _db.InvestmentMeetings.Add(new InvestmentMeeting
        {
            Id = mid,
            InvestmentId = id,
            InvestorId = dto.InvestorId,
            StudentId = studentId,
            Date = dto.Date,
            Time = dto.Time,
            Link = dto.Link,
            Message = dto.Message,
            Status = "Proposed",
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = mid, status = "Proposed", date = dto.Date, time = dto.Time, link = dto.Link, message = dto.Message, studentId });
    }

    [HttpPut("api/investment-meetings/{id}")]
    public async Task<IActionResult> UpdateInvestmentMeeting(string id, [FromBody] UpdateInvestmentMeetingDto dto)
    {
        var m = await _db.InvestmentMeetings.FindAsync(id);
        if (m == null) return NotFound(new { error = "Meeting not found" });
        if (dto.ActorId != m.StudentId && dto.ActorId != m.InvestorId)
            return StatusCode(403, new { error = "Not allowed" });

        if (dto.ActorId == m.StudentId && dto.Action == "change_request")
        {
            m.Status = "Change requested";
            m.ChangeRequest = dto.ChangeRequest;
        }
        else if (dto.ActorId == m.StudentId && dto.Action == "accept")
        {
            m.Status = "Accepted";
        }
        else if (dto.ActorId == m.InvestorId)
        {
            if (dto.Date != null) m.Date = dto.Date;
            if (dto.Time != null) m.Time = dto.Time;
            if (dto.Link != null) m.Link = dto.Link;
            if (dto.Message != null) m.Message = dto.Message;
            m.Status = "Proposed";
        }
        else return StatusCode(403, new { error = "Invalid action" });

        await _db.SaveChangesAsync();
        return Ok(m);
    }
}

