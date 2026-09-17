using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UniYoDbContext _db;
    private readonly UserService _users;
    private readonly PostService _postService;
    public UsersController(UniYoDbContext db, UserService users, PostService postService) { _db = db; _users = users; _postService = postService; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role)
    {
        var q = _db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(role)) q = q.Where(u => u.Role == role);
        var users = await q.OrderBy(u => u.CreatedAt).ToListAsync();
        var list = new List<object>();
        foreach (var u in users) list.Add(await _users.BuildUserAsync(u));
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound(new { error = "Not found" });
        return Ok(await _users.BuildUserAsync(u));
    }

    [HttpGet("{id}/posts")]
    public async Task<IActionResult> GetUserPosts(string id)
    {
        var posts = await _db.Posts
            .Where(p => p.AuthorId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        var list = new List<object>();
        foreach (var p in posts) list.Add(await _postService.BuildPostAsync(p, id));
        return Ok(list);
    }

    [HttpGet("{id}/connections")]
    public async Task<IActionResult> GetConnections(string id)
    {
        var rows = await (
            from c in _db.UserConnections
            join u in _db.Users on c.ConnectedUserId equals u.Id
            where c.UserId == id
            select u
        ).ToListAsync();
        var list = new List<object>();
        foreach (var u in rows) list.Add(await _users.BuildUserAsync(u));
        return Ok(list);
    }

    [HttpPost("{id}/connections")]
    public async Task<IActionResult> Connect(string id, [FromBody] ConnectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TargetId))
            return BadRequest(new { error = "targetId required" });

        var exists1 = await _db.UserConnections.AnyAsync(c => c.UserId == id && c.ConnectedUserId == dto.TargetId);
        if (!exists1)
        {
            _db.UserConnections.Add(new UserConnection
            {
                UserId = id,
                ConnectedUserId = dto.TargetId,
                Status = "connected",
                CreatedAt = DateTime.UtcNow
            });
        }
        var exists2 = await _db.UserConnections.AnyAsync(c => c.UserId == dto.TargetId && c.ConnectedUserId == id);
        if (!exists2)
        {
            _db.UserConnections.Add(new UserConnection
            {
                UserId = dto.TargetId,
                ConnectedUserId = id,
                Status = "connected",
                CreatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Connected" });
    }

    [HttpDelete("{id}/connections/{targetId}")]
    public async Task<IActionResult> Disconnect(string id, string targetId)
    {
        var rows = await _db.UserConnections
            .Where(c => (c.UserId == id && c.ConnectedUserId == targetId) ||
                        (c.UserId == targetId && c.ConnectedUserId == id))
            .ToListAsync();
        _db.UserConnections.RemoveRange(rows);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Disconnected" });
    }

    [HttpGet("{id}/invites")]
    public async Task<IActionResult> GetInvites(string id)
    {
        var rows = await (
            from r in _db.ProjectRequests
            join p in _db.Projects on r.ProjectId equals p.Id
            where r.ApplicantId == id && r.Type == "invite" && r.Status == "Pending"
            orderby r.CreatedAt descending
            select new
            {
                id = r.Id,
                projectId = r.ProjectId,
                projectTitle = p.Title,
                ownerName = p.OwnerName,
                ownerAvatar = p.OwnerAvatarBase64,
                projectDescription = p.Description,
                skill = r.Skill,
                pitch = r.Pitch,
                createdAt = r.CreatedAt
            }
        ).ToListAsync();
        return Ok(rows);
    }

    [HttpGet("{id}/enrollments")]
    public async Task<IActionResult> GetEnrollments(string id)
    {
        var rows = await (
            from e in _db.CourseEnrollments
            join v in _db.ProfessorVideos on e.VideoId equals v.Id
            join u in _db.Users on e.ProfId equals u.Id
            where e.StudentId == id
            orderby e.CreatedAt descending
            select new
            {
                id = e.Id,
                videoId = e.VideoId,
                videoTitle = v.Title,
                thumbnailUrl = v.ThumbnailUrl,
                videoUrl = v.VideoUrl,
                durationMinutes = v.DurationMinutes,
                profId = e.ProfId,
                profName = u.Name,
                profAvatar = u.AvatarBase64,
                status = e.Status,
                isPaid = e.IsPaid,
                amountPaid = e.AmountPaid,
                transactionId = e.TransactionId,
                paidAt = e.PaidAt
            }
        ).ToListAsync();
        return Ok(rows);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();

        if (dto.Name != null) u.Name = dto.Name;
        if (dto.Bio != null) u.Bio = dto.Bio;
        if (dto.Degree != null) u.Degree = dto.Degree;
        if (dto.Faculty != null) u.Faculty = dto.Faculty;
        if (dto.Company != null) u.Company = dto.Company;
        if (dto.Industry != null) u.Industry = dto.Industry;
        if (dto.Title != null) u.Title = dto.Title;
        if (dto.Skills != null) u.Skills = dto.Skills;
        if (dto.AvatarBase64 != null) u.AvatarBase64 = dto.AvatarBase64;
        if (dto.CoverBase64 != null) u.CoverBase64 = dto.CoverBase64;
        if (dto.ConsultationFee.HasValue) u.ConsultationFee = dto.ConsultationFee.Value;

        await _db.SaveChangesAsync();
        return Ok(await _users.BuildUserAsync(u));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        _db.Users.Remove(u);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }
}

