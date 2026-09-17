using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public NotificationsController(UniYoDbContext db) => _db = db;

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { error = "User not found" });
        var role = user.Role;

        int calendar, questions, projects, invites;

        if (role == "professor")
        {
            calendar = await _db.ProfessorSessions.CountAsync(s => s.ProfId == id && s.Status == "Pending");
            questions = await _db.ProfessorQuestions.CountAsync(q => q.ProfId == id && q.Answer == null);
            projects = await _db.ProjectAdvisors.CountAsync(a => a.ProfId == id && a.Status == "Pending");
        }
        else
        {
            calendar = await _db.ProfessorSessions.CountAsync(s =>
                s.StudentId == id && (s.Status == "Approved" || s.Status == "Rejected"));
            questions = await _db.ProfessorQuestions.CountAsync(q => q.StudentId == id && q.Answer != null);
            projects = 0;
        }
        invites = await _db.ProjectRequests.CountAsync(r =>
            r.ApplicantId == id && r.Type == "invite" && r.Status == "Pending");

        return Ok(new { calendar, questions, projects, invites });
    }
}
