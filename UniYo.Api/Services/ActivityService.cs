using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class ActivityService
{
    private readonly UniYoDbContext _db;
    public ActivityService(UniYoDbContext db) => _db = db;

    public async Task LogAsync(string projectId, string? actorId, string? actorName,
        string action, string? targetType, string? targetId, string message)
    {
        try
        {
            _db.ProjectActivities.Add(new ProjectActivity
            {
                Id = $"act_{DateTime.UtcNow.Ticks}_{Guid.NewGuid().ToString("N")[..5]}",
                ProjectId = projectId,
                ActorId = actorId,
                ActorName = actorName,
                Action = action,
                TargetType = targetType,
                TargetId = targetId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }
        catch
        {
            // Never fail the caller because logging failed
        }
    }
}
