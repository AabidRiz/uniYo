using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class ProjectService
{
    private readonly UniYoDbContext _db;
    private readonly MembershipService _members;

    public ProjectService(UniYoDbContext db, MembershipService members)
    {
        _db = db;
        _members = members;
    }

    public async Task<object> BuildProjectAsync(Project p, string? viewerId = null)
    {
        var isMember = await _members.IsMemberAsync(p.Id, viewerId);
        var isOwner = viewerId == p.OwnerId;
        var isAdvisor = await _members.IsAdvisorAsync(p.Id, viewerId);
        var canSee = isMember || isAdvisor;

        // Members
        var memberRows = await (
            from m in _db.ProjectMembers
            join u in _db.Users on m.UserId equals u.Id
            where m.ProjectId == p.Id
            select new
            {
                id = u.Id,
                name = u.Name,
                uni = u.UniversityName,
                role = m.Role,
                avatar = u.AvatarBase64
            }
        ).ToListAsync();

        // Active advisor
        var activeAdvisor = await (
            from a in _db.ProjectAdvisors
            join u in _db.Users on a.ProfId equals u.Id
            where a.ProjectId == p.Id && a.Status == "Active"
            select new
            {
                id = u.Id,
                name = u.Name,
                university = u.UniversityName,
                faculty = u.Faculty,
                title = u.Title,
                avatar = u.AvatarBase64
            }
        ).FirstOrDefaultAsync();

        // Base payload
        var payload = new Dictionary<string, object?>
        {
            ["id"] = p.Id,
            ["ownerId"] = p.OwnerId,
            ["owner"] = new
            {
                id = p.OwnerId,
                name = p.OwnerName,
                university = p.OwnerUniversity,
                avatar = p.OwnerAvatarBase64
            },
            ["title"] = p.Title,
            ["description"] = p.Description,
            ["banner"] = p.BannerBase64,
            ["openToUniversities"] = p.OpenUniversities ?? Array.Empty<string>(),
            ["open_universities"] = p.OpenUniversities ?? Array.Empty<string>(),
            ["skillsNeeded"] = p.SkillsNeeded ?? Array.Empty<string>(),
            ["skills_needed"] = p.SkillsNeeded ?? Array.Empty<string>(),
            ["seekingInvestment"] = p.SeekingInvestment,
            ["seeking_investment"] = p.SeekingInvestment,
            ["investmentGoal"] = p.InvestmentGoal,
            ["investment_goal"] = p.InvestmentGoal,
            ["tractionScore"] = p.TractionScore,
            ["traction_score"] = p.TractionScore,
            ["visibility"] = p.Visibility ?? "public",
            ["createdAt"] = p.CreatedAt,
            ["isMember"] = isMember,
            ["isOwner"] = isOwner,
            ["isAdvisor"] = isAdvisor,
            ["members"] = memberRows,
            ["advisor"] = activeAdvisor,
            ["incomingRequests"] = Array.Empty<object>(),
            ["pendingInvites"] = Array.Empty<object>(),
            ["chatMessages"] = Array.Empty<object>(),
            ["repositories"] = Array.Empty<object>(),
            ["documents"] = Array.Empty<object>(),
            ["tasks"] = Array.Empty<object>(),
            ["meetings"] = Array.Empty<object>(),
            ["activity"] = Array.Empty<object>()
        };

        if (canSee)
        {
            var messages = await _db.ProjectMessages
                .Where(m => m.ProjectId == p.Id)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            var repos = await _db.ProjectRepos.Where(r => r.ProjectId == p.Id).ToListAsync();
            var docs = await _db.ProjectDocs
                .Where(d => d.ProjectId == p.Id)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
            var tasks = await _db.ProjectTasks
                .Where(t => t.ProjectId == p.Id)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            var meetings = await _db.ProjectMeetings
                .Where(m => m.ProjectId == p.Id)
                .OrderBy(m => m.MeetingDate)
                .ToListAsync();
            var activities = await _db.ProjectActivities
                .Where(a => a.ProjectId == p.Id)
                .OrderByDescending(a => a.CreatedAt)
                .Take(50)
                .ToListAsync();

            var meetingIds = meetings.Select(m => m.Id).ToList();
            var attendeeRows = meetingIds.Count == 0
                ? new List<object>()
                : (await (
                    from a in _db.ProjectMeetingAttendees
                    join u in _db.Users on a.UserId equals u.Id
                    where meetingIds.Contains(a.MeetingId)
                    select new { meetingId = a.MeetingId, id = u.Id, name = u.Name, avatar = u.AvatarBase64 }
                ).ToListAsync()).Cast<object>().ToList();

            payload["chatMessages"] = messages.Select(m => new
            {
                id = m.Id,
                senderId = m.SenderId,
                sender = m.Sender,
                avatar = m.AvatarBase64,
                text = m.Text,
                messageType = m.MessageType ?? "chat",
                time = m.CreatedAt.ToString("h:mm tt")
            });

            payload["repositories"] = repos.Select(r => new { id = r.Id, name = r.Name, url = r.Url, stars = r.Stars });

            payload["documents"] = docs.Select(d => new
            {
                id = d.Id,
                title = d.Title,
                size = d.Size,
                url = d.Url,
                date = d.CreatedAt.ToString("d")
            });

            payload["tasks"] = tasks.Select(t => new
            {
                id = t.Id,
                title = t.Title,
                description = t.Description,
                status = t.Status,
                priority = t.Priority,
                assigneeId = t.AssigneeId,
                assigneeName = t.AssigneeName,
                dueDate = t.DueDate,
                createdById = t.CreatedById,
                createdByName = t.CreatedByName,
                createdAt = t.CreatedAt
            });

            payload["meetings"] = meetings.Select(m => new
            {
                id = m.Id,
                title = m.Title,
                description = m.Description,
                date = m.MeetingDate,
                time = m.MeetingTime,
                durationMinutes = m.DurationMinutes,
                link = m.Link,
                status = m.Status,
                createdById = m.CreatedById,
                createdByName = m.CreatedByName,
                attendees = attendeeRows.Where(a => ((dynamic)a).meetingId == m.Id).ToList()
            });

            payload["activity"] = activities.Select(a => new
            {
                id = a.Id,
                actorId = a.ActorId,
                actorName = a.ActorName,
                action = a.Action,
                targetType = a.TargetType,
                targetId = a.TargetId,
                message = a.Message,
                createdAt = a.CreatedAt
            });
        }

        if (isOwner)
        {
            var requests = await _db.ProjectRequests
                .Where(r => r.ProjectId == p.Id && r.Type == "request" && r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var invites = await _db.ProjectRequests
                .Where(r => r.ProjectId == p.Id && r.Type == "invite" && r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var pendingAdvisor = await (
                from a in _db.ProjectAdvisors
                join u in _db.Users on a.ProfId equals u.Id
                where a.ProjectId == p.Id && a.Status == "Pending"
                select new
                {
                    profId = u.Id,
                    profName = u.Name,
                    university = u.UniversityName,
                    title = u.Title,
                    avatar = u.AvatarBase64,
                    pitch = a.Pitch,
                    requestedAt = a.RequestedAt
                }
            ).FirstOrDefaultAsync();

            payload["incomingRequests"] = requests.Select(r => new
            {
                id = r.Id,
                applicantId = r.ApplicantId,
                applicantName = r.ApplicantName,
                uni = r.University,
                skill = r.Skill,
                pitch = r.Pitch,
                status = r.Status
            });

            payload["pendingInvites"] = invites.Select(r => new
            {
                id = r.Id,
                invitedUserId = r.ApplicantId,
                invitedName = r.ApplicantName,
                invitedUni = r.University,
                status = r.Status
            });

            payload["pendingAdvisorRequest"] = pendingAdvisor;
        }

        if (!isMember && !isAdvisor && !string.IsNullOrEmpty(viewerId))
        {
            var myReq = await _db.ProjectRequests
                .Where(r => r.ProjectId == p.Id && r.ApplicantId == viewerId && r.Type == "request" && r.Status == "Pending")
                .FirstOrDefaultAsync();

            var myInv = await _db.ProjectRequests
                .Where(r => r.ProjectId == p.Id && r.ApplicantId == viewerId && r.Type == "invite" && r.Status == "Pending")
                .FirstOrDefaultAsync();

            payload["myRequest"] = myReq == null ? null : new { id = myReq.Id, status = myReq.Status };
            payload["myInvite"] = myInv == null ? null : new { id = myInv.Id };
        }

        return payload;
    }
}
