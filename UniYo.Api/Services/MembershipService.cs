using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;

namespace UniYo.Api.Services;

public class MembershipService
{
    private readonly UniYoDbContext _db;
    public MembershipService(UniYoDbContext db) => _db = db;

    public async Task<bool> IsMemberAsync(string projectId, string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return false;
        return await _db.ProjectMembers.AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);
    }

    public async Task<bool> IsAdvisorAsync(string projectId, string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return false;
        return await _db.ProjectAdvisors.AnyAsync(a =>
            a.ProjectId == projectId && a.ProfId == userId && a.Status == "Active");
    }

    public async Task<bool> CanReadAsync(string projectId, string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return false;
        return (await IsMemberAsync(projectId, userId)) || (await IsAdvisorAsync(projectId, userId));
    }
}
