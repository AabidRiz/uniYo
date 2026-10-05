using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class UserService
{
    private readonly UniYoDbContext _db;
    public UserService(UniYoDbContext db) => _db = db;

    public async Task<object> BuildUserAsync(User u)
    {
        var connCount = await _db.UserConnections.CountAsync(c => c.UserId == u.Id);
        var projCount = await _db.ProjectMembers.CountAsync(m => m.UserId == u.Id);
        var postCount = await _db.Posts.CountAsync(p => p.AuthorId == u.Id);
        var advisedCount = await _db.ProjectAdvisors.CountAsync(a => a.ProfId == u.Id && a.Status == "Active");

        return new
        {
            id = u.Id,
            role = u.Role,
            name = u.Name,
            email = u.Email,
            studentId = u.StudentId,
            student_id = u.StudentId,
            university = u.UniversityName,
            university_name = u.UniversityName,
            faculty = u.Faculty,
            degree = u.Degree,
            company = u.Company,
            industry = u.Industry,
            title = u.Title,
            bio = u.Bio,
            avatar = TruncateBase64(u.AvatarBase64),
            avatar_base64 = TruncateBase64(u.AvatarBase64),
            cover = (string?)null,
            cover_base64 = (string?)null,
            skills = string.IsNullOrEmpty(u.Skills)
                ? new List<string>()
                : u.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList(),
            verified = u.Verified,
            verificationStatus = u.VerificationStatus,
            verification_status = u.VerificationStatus,
            verificationReason = u.VerificationReason,
            hourlyRate = u.HourlyRate,
            hourly_rate = u.HourlyRate,
            consultationType = u.ConsultationType,
            consultation_type = u.ConsultationType,
            consultationFee = u.ConsultationFee,
            consultationCurrency = u.ConsultationCurrency ?? "LKR",
            stats = new
            {
                connections = connCount,
                projects = projCount,
                posts = postCount,
                advisedProjects = advisedCount
            }
        };
    }

    public async Task<object?> BuildUserByIdAsync(string id)
    {
        var u = await _db.Users.FindAsync(id);
        return u == null ? null : await BuildUserAsync(u);
    }

    private static string? TruncateBase64(string? b64)
    {
        if (string.IsNullOrEmpty(b64)) return null;
        return b64.Length <= 50000 ? b64 : null;
    }
}

