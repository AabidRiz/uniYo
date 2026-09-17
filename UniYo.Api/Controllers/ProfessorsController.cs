using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/professors")]
public class ProfessorsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    private readonly UserService _users;
    public ProfessorsController(UniYoDbContext db, UserService users) { _db = db; _users = users; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var profs = await _db.Users.Where(u => u.Role == "professor").ToListAsync();
        var list = new List<object>();
        foreach (var p in profs) list.Add(await _users.BuildUserAsync(p));
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var p = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "professor");
        if (p == null) return NotFound(new { error = "Not found" });

        var baseUser = await _users.BuildUserAsync(p);
        var videoCount = await _db.ProfessorVideos.CountAsync(v => v.ProfId == id);
        var sessionCount = await _db.ProfessorSessions.CountAsync(s => s.ProfId == id);
        var advisedCount = await _db.ProjectAdvisors.CountAsync(a => a.ProfId == id && a.Status == "Active");
        var reviewsAgg = await _db.SessionReviews
            .Where(r => r.ProfId == id)
            .GroupBy(r => 1)
            .Select(g => new { count = g.Count(), avg = g.Average(x => (double)x.Rating) })
            .FirstOrDefaultAsync();

        var dict = new Dictionary<string, object?>();
        foreach (var prop in baseUser.GetType().GetProperties())
            dict[char.ToLowerInvariant(prop.Name[0]) + prop.Name.Substring(1)] = prop.GetValue(baseUser);
        dict["profStats"] = new
        {
            videos = videoCount,
            sessions = sessionCount,
            advisedProjects = advisedCount,
            reviewCount = reviewsAgg?.count ?? 0,
            avgRating = reviewsAgg?.avg ?? 0
        };
        return Ok(dict);
    }

    [HttpGet("{id}/overview")]
    public async Task<IActionResult> GetOverview(string id)
    {
        var confirmed = await _db.ProfessorSessions.CountAsync(s => s.ProfId == id && s.Status == "Confirmed");
        var completed = await _db.ProfessorSessions.CountAsync(s => s.ProfId == id && s.Status == "Completed");
        var videos = await _db.ProfessorVideos.CountAsync(v => v.ProfId == id);
        var unanswered = await _db.ProfessorQuestions.CountAsync(q => q.ProfId == id && q.Answer == null);
        var advised = await _db.ProjectAdvisors.CountAsync(a => a.ProfId == id && a.Status == "Active");
        var pendingReqs = await _db.ProjectAdvisors.CountAsync(a => a.ProfId == id && a.Status == "Pending");
        var avg = await _db.ProfessorSessions.Where(s => s.ProfId == id && s.Rating != null)
            .Select(s => (double?)s.Rating).AverageAsync();
        return Ok(new
        {
            confirmedSessions = confirmed,
            completedSessions = completed,
            videos,
            unansweredQuestions = unanswered,
            advisedProjects = advised,
            pendingAdvisorRequests = pendingReqs,
            avgRating = avg ?? 0
        });
    }

    // ============ AVAILABILITY ============
    [HttpGet("{id}/availability")]
    public async Task<IActionResult> GetAvailability(string id)
    {
        var rows = await _db.ProfessorAvailabilities.Where(a => a.ProfId == id).OrderBy(a => a.Id).ToListAsync();
        return Ok(rows);
    }

    [HttpPost("{id}/availability")]
    public async Task<IActionResult> AddAvailability(string id, [FromBody] AvailabilityDto dto)
    {
        if (string.IsNullOrEmpty(dto.Day) || string.IsNullOrEmpty(dto.Time)) return BadRequest(new { error = "Day and time required" });
        var aid = $"av_{DateTime.UtcNow.Ticks}";
        _db.ProfessorAvailabilities.Add(new ProfessorAvailability
        {
            Id = aid, ProfId = id, Day = dto.Day, Time = dto.Time, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = aid, prof_id = id, day = dto.Day, time = dto.Time });
    }

    [HttpDelete("{pid}/availability/{aid}")]
    public async Task<IActionResult> DeleteAvailability(string pid, string aid)
    {
        var row = await _db.ProfessorAvailabilities.FirstOrDefaultAsync(a => a.Id == aid && a.ProfId == pid);
        if (row == null) return NotFound();
        _db.ProfessorAvailabilities.Remove(row);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ SESSIONS ============
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions([FromQuery] string? profId, [FromQuery] string? studentId)
    {
        var q = _db.ProfessorSessions.AsQueryable();
        if (!string.IsNullOrEmpty(profId)) q = q.Where(s => s.ProfId == profId);
        if (!string.IsNullOrEmpty(studentId)) q = q.Where(s => s.StudentId == studentId);
        var rows = await q.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return Ok(rows);
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> BookSession([FromBody] BookSessionDto dto)
    {
        var prof = await _db.Users.FindAsync(dto.ProfId);
        var student = await _db.Users.FindAsync(dto.StudentId);
        if (prof == null || student == null) return BadRequest(new { error = "Invalid" });
        var sid = $"sess_{DateTime.UtcNow.Ticks}";
        var s = new ProfessorSession
        {
            Id = sid,
            ProfId = prof.Id,
            ProfName = prof.Name,
            University = prof.UniversityName,
            StudentId = student.Id,
            StudentName = student.Name,
            Date = dto.Date,
            Time = dto.Time,
            Type = dto.Type ?? "Consultation",
            Topic = dto.Topic ?? "",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        _db.ProfessorSessions.Add(s);
        await _db.SaveChangesAsync();
        return StatusCode(201, s);
    }

    [HttpPut("sessions/{id}")]
    public async Task<IActionResult> UpdateSession(string id, [FromBody] UpdateSessionDto dto)
    {
        var s = await _db.ProfessorSessions.FindAsync(id);
        if (s == null) return NotFound();
        var isProf = dto.ActorId == s.ProfId;
        var isStudent = dto.ActorId == s.StudentId;
        if (!isProf && !isStudent) return StatusCode(403, new { error = "Not allowed" });

        if (dto.Topic != null) s.Topic = dto.Topic;
        if (dto.Date != null) s.Date = dto.Date;
        if (dto.Time != null) s.Time = dto.Time;
        if (dto.Notes != null) s.Notes = dto.Notes;
        if (dto.Rating.HasValue) s.Rating = dto.Rating;
        if (dto.RatingComment != null) s.RatingComment = dto.RatingComment;
        if (isProf)
        {
            if (dto.Status != null) s.Status = dto.Status;
            if (dto.MeetingLink != null) s.MeetingLink = dto.MeetingLink;
            if (dto.ResponseMessage != null) s.ResponseMessage = dto.ResponseMessage;
            if (dto.RejectionReason != null) s.RejectionReason = dto.RejectionReason;
            if (dto.Status == "Completed") s.CompletedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> DeleteSession(string id, [FromBody] DeleteSessionDto body)
    {
        var s = await _db.ProfessorSessions.FindAsync(id);
        if (s == null) return NotFound();
        if (body.ActorId != s.ProfId) return StatusCode(403, new { error = "Only professor" });
        _db.ProfessorSessions.Remove(s);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ SESSION REVIEWS ============
    [HttpPost("sessions/{sid}/review")]
    public async Task<IActionResult> ReviewSession(string sid, [FromBody] CreateReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5) return BadRequest(new { error = "Rating must be 1-5" });
        var s = await _db.ProfessorSessions.FindAsync(sid);
        if (s == null) return NotFound();
        if (s.StudentId != dto.StudentId) return StatusCode(403, new { error = "Not your session" });
        if (s.Status != "Completed") return BadRequest(new { error = "Session not completed yet" });

        var student = await _db.Users.FindAsync(dto.StudentId);
        var existing = await _db.SessionReviews.FirstOrDefaultAsync(r => r.SessionId == sid);
        var rid = existing?.Id ?? $"rev_{DateTime.UtcNow.Ticks}";

        if (existing != null)
        {
            existing.Rating = dto.Rating;
            existing.Comment = dto.Comment ?? "";
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.SessionReviews.Add(new SessionReview
            {
                Id = rid,
                SessionId = sid,
                ProfId = s.ProfId ?? "",
                StudentId = dto.StudentId,
                StudentName = student?.Name,
                StudentAvatar = student?.AvatarBase64,
                Rating = dto.Rating,
                Comment = dto.Comment ?? "",
                CreatedAt = DateTime.UtcNow
            });
        }
        s.Rating = dto.Rating;
        s.RatingComment = dto.Comment ?? "";

        await _db.SaveChangesAsync();
        return Ok(new { id = rid, rating = dto.Rating, comment = dto.Comment ?? "" });
    }

    [HttpDelete("sessions/{sid}/review")]
    public async Task<IActionResult> DeleteSessionReview(string sid, [FromBody] DeleteSessionDto body)
    {
        var review = await _db.SessionReviews.FirstOrDefaultAsync(r => r.SessionId == sid);
        if (review == null || review.StudentId != body.ActorId) return StatusCode(403, new { error = "Only reviewer" });
        _db.SessionReviews.Remove(review);
        var s = await _db.ProfessorSessions.FindAsync(sid);
        if (s != null) { s.Rating = null; s.RatingComment = null; }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ PROFESSOR REVIEWS ============
    [HttpGet("{id}/reviews")]
    public async Task<IActionResult> GetReviews(string id)
    {
        var rows = await _db.SessionReviews
            .Where(r => r.ProfId == id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        double avg = rows.Count > 0 ? rows.Average(r => r.Rating) : 0;
        return Ok(new { reviews = rows, avgRating = avg, count = rows.Count });
    }

    [HttpPost("{id}/reviews")]
    public async Task<IActionResult> CreateReview(string id, [FromBody] CreateReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5 || string.IsNullOrWhiteSpace(dto.Comment))
            return BadRequest(new { error = "Rating and review are required" });
        var existing = await _db.SessionReviews.FirstOrDefaultAsync(r =>
            r.ProfId == id && r.StudentId == dto.StudentId && r.SessionId == null);
        var rid = existing?.Id ?? $"rev_{DateTime.UtcNow.Ticks}";
        var student = await _db.Users.FindAsync(dto.StudentId);
        if (existing != null)
        {
            existing.Rating = dto.Rating;
            existing.Comment = dto.Comment.Trim();
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.SessionReviews.Add(new SessionReview
            {
                Id = rid,
                SessionId = null,
                ProfId = id,
                StudentId = dto.StudentId,
                StudentName = student?.Name,
                StudentAvatar = student?.AvatarBase64,
                Rating = dto.Rating,
                Comment = dto.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = rid, profId = id, studentId = dto.StudentId, rating = dto.Rating, comment = dto.Comment.Trim() });
    }

    [HttpPut("reviews/{reviewId}")]
    public async Task<IActionResult> UpdateProfessorReview(string reviewId, [FromBody] CreateReviewDto dto)
    {
        var r = await _db.SessionReviews.FirstOrDefaultAsync(x => x.Id == reviewId && x.StudentId == dto.StudentId && x.SessionId == null);
        if (r == null) return StatusCode(403, new { error = "Not your professor review" });
        r.Rating = dto.Rating;
        r.Comment = dto.Comment?.Trim() ?? "";
        r.CreatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(r);
    }

    [HttpDelete("reviews/{reviewId}")]
    public async Task<IActionResult> DeleteProfessorReview(string reviewId, [FromBody] DeleteSessionDto body)
    {
        var r = await _db.SessionReviews.FirstOrDefaultAsync(x => x.Id == reviewId && x.StudentId == body.ActorId && x.SessionId == null);
        if (r == null) return StatusCode(403, new { error = "Not your professor review" });
        _db.SessionReviews.Remove(r);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ Q&A ============
    [HttpGet("{id}/questions")]
    public async Task<IActionResult> GetQuestions(string id)
    {
        var rows = await _db.ProfessorQuestions
            .Where(q => q.ProfId == id)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();
        return Ok(rows);
    }

    [HttpPost("{id}/questions")]
    public async Task<IActionResult> AskQuestion(string id, [FromBody] CreateQuestionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Question)) return BadRequest(new { error = "Question required" });
        var student = await _db.Users.FindAsync(dto.StudentId);
        if (student == null) return BadRequest(new { error = "Invalid student" });
        var qid = $"q_{DateTime.UtcNow.Ticks}";
        _db.ProfessorQuestions.Add(new ProfessorQuestion
        {
            Id = qid,
            ProfId = id,
            StudentId = student.Id,
            StudentName = student.Name,
            StudentAvatar = student.AvatarBase64,
            Question = dto.Question,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = qid, question = dto.Question, studentName = student.Name });
    }

    // Professor answers a question
    [HttpPut("{pid}/questions/{qid}")]
    public async Task<IActionResult> AnswerQuestion(string pid, string qid, [FromBody] AnswerQuestionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Answer)) return BadRequest(new { error = "Answer required" });
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.ProfId == pid);
        if (q == null) return NotFound();
        q.Answer = dto.Answer;
        q.AnsweredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(q);
    }

    // Professor edits their own answer
    [HttpPut("{pid}/questions/{qid}/answer")]
    public async Task<IActionResult> UpdateProfessorAnswer(string pid, string qid, [FromBody] AnswerQuestionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Answer)) return BadRequest(new { error = "Answer required" });
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.ProfId == pid);
        if (q == null) return StatusCode(403, new { error = "Not your question" });
        q.Answer = dto.Answer.Trim();
        q.AnsweredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(q);
    }

    // Professor deletes their own answer
    [HttpDelete("{pid}/questions/{qid}/answer")]
    public async Task<IActionResult> DeleteProfessorAnswer(string pid, string qid)
    {
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.ProfId == pid);
        if (q == null) return StatusCode(403, new { error = "Not your question" });
        q.Answer = null;
        q.AnsweredAt = null;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Answer deleted" });
    }

    // Professor deletes the whole question
    [HttpDelete("{pid}/questions/{qid}")]
    public async Task<IActionResult> DeleteProfessorQuestion(string pid, string qid)
    {
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.ProfId == pid);
        if (q == null) return NotFound();
        _db.ProfessorQuestions.Remove(q);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // Student edits their question
    [HttpPut("questions/{qid}")]
    public async Task<IActionResult> UpdateStudentQuestion(string qid, [FromBody] CreateQuestionDto dto)
    {
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.StudentId == dto.StudentId);
        if (q == null) return StatusCode(403, new { error = "Not your question" });
        if (!string.IsNullOrWhiteSpace(dto.Question)) q.Question = dto.Question.Trim();
        await _db.SaveChangesAsync();
        return Ok(q);
    }

    // Student deletes their question
    [HttpDelete("questions/{qid}")]
    public async Task<IActionResult> DeleteStudentQuestion(string qid, [FromBody] DeleteSessionDto body)
    {
        var q = await _db.ProfessorQuestions.FirstOrDefaultAsync(x => x.Id == qid && x.StudentId == body.ActorId);
        if (q == null) return StatusCode(403, new { error = "Not your question" });
        _db.ProfessorQuestions.Remove(q);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ VIDEOS ============
    [HttpGet("{id}/videos")]
    public async Task<IActionResult> GetVideos(string id, [FromQuery] string? viewerId)
    {
        var rows = await _db.ProfessorVideos.Where(v => v.ProfId == id).OrderByDescending(v => v.CreatedAt).ToListAsync();
        var list = new List<object>();
        foreach (var v in rows)
        {
            var enrolled = !string.IsNullOrEmpty(viewerId)
                && await _db.CourseEnrollments.AnyAsync(e => e.VideoId == v.Id && e.StudentId == viewerId);
            var enrolledCount = await _db.CourseEnrollments.CountAsync(e => e.VideoId == v.Id);
            var impressions = await _db.ProfessorVideoImpressions.Where(i => i.VideoId == v.Id).ToListAsync();
            double avg = impressions.Where(i => i.Rating != null).Select(i => (double)i.Rating!).DefaultIfEmpty(0).Average();
            list.Add(new
            {
                id = v.Id, profId = v.ProfId, title = v.Title, description = v.Description,
                videoUrl = v.VideoUrl, thumbnailUrl = v.ThumbnailUrl,
                durationMinutes = v.DurationMinutes, tags = v.Tags ?? Array.Empty<string>(),
                views = v.Views, price = v.Price, currency = v.Currency ?? "LKR",
                avgRating = avg, enrolledCount, isEnrolled = enrolled,
                impressions = impressions.Select(i => new
                {
                    id = i.Id, studentId = i.StudentId, studentName = i.StudentName,
                    studentAvatar = i.StudentAvatar, rating = i.Rating, comment = i.Comment
                })
            });
        }
        return Ok(list);
    }

    [HttpPost("{id}/videos")]
    public async Task<IActionResult> CreateVideo(string id, [FromBody] VideoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.VideoUrl))
            return BadRequest(new { error = "Title and video URL required" });
        var vid = $"vid_{DateTime.UtcNow.Ticks}";
        _db.ProfessorVideos.Add(new ProfessorVideo
        {
            Id = vid, ProfId = id, Title = dto.Title, Description = dto.Description,
            VideoUrl = dto.VideoUrl, ThumbnailUrl = dto.ThumbnailUrl,
            DurationMinutes = dto.DurationMinutes, Tags = dto.Tags ?? Array.Empty<string>(),
            Price = dto.Price ?? 0, Currency = "LKR", Views = 0, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = vid, title = dto.Title });
    }

    [HttpPut("{pid}/videos/{vid}")]
    public async Task<IActionResult> UpdateVideo(string pid, string vid, [FromBody] VideoDto dto)
    {
        var v = await _db.ProfessorVideos.FirstOrDefaultAsync(x => x.Id == vid && x.ProfId == pid);
        if (v == null) return NotFound();
        if (dto.Title != null) v.Title = dto.Title;
        if (dto.Description != null) v.Description = dto.Description;
        if (dto.VideoUrl != null) v.VideoUrl = dto.VideoUrl;
        if (dto.ThumbnailUrl != null) v.ThumbnailUrl = dto.ThumbnailUrl;
        if (dto.DurationMinutes.HasValue) v.DurationMinutes = dto.DurationMinutes;
        if (dto.Tags != null) v.Tags = dto.Tags;
        if (dto.Price.HasValue) v.Price = dto.Price.Value;
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpDelete("{pid}/videos/{vid}")]
    public async Task<IActionResult> DeleteVideo(string pid, string vid)
    {
        var v = await _db.ProfessorVideos.FirstOrDefaultAsync(x => x.Id == vid && x.ProfId == pid);
        if (v == null) return NotFound();
        _db.ProfessorVideos.Remove(v);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    // ============ ENROLLMENT ============
    [HttpPost("videos/{vid}/enroll")]
    public async Task<IActionResult> EnrollVideo(string vid, [FromBody] EnrollVideoDto body)
    {
        var v = await _db.ProfessorVideos.FindAsync(vid);
        if (v == null) return NotFound(new { error = "Video not found" });
        if (v.Price > 0) return BadRequest(new { error = "This is a paid course — payment required" });
        var existing = await _db.CourseEnrollments.FirstOrDefaultAsync(e => e.StudentId == body.StudentId && e.VideoId == vid);
        if (existing != null) return Ok(new { message = "Already enrolled", enrollment = existing });
        var eid = $"enr_{DateTime.UtcNow.Ticks}";
        _db.CourseEnrollments.Add(new CourseEnrollment
        {
            Id = eid, StudentId = body.StudentId, VideoId = vid, ProfId = v.ProfId,
            Status = "Enrolled", IsPaid = false, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = eid, status = "Enrolled", isPaid = false });
    }

    [HttpPost("videos/{vid}/view")]
    public async Task<IActionResult> RecordView(string vid)
    {
        var v = await _db.ProfessorVideos.FindAsync(vid);
        if (v == null) return NotFound();
        v.Views += 1;
        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    [HttpPost("videos/{vid}/impressions")]
    public async Task<IActionResult> AddImpression(string vid, [FromBody] AddImpressionDto dto)
    {
        var student = await _db.Users.FindAsync(dto.StudentId);
        if (student == null) return BadRequest(new { error = "Invalid student" });
        var iid = $"imp_{DateTime.UtcNow.Ticks}";
        _db.ProfessorVideoImpressions.Add(new ProfessorVideoImpression
        {
            Id = iid, VideoId = vid, StudentId = student.Id, StudentName = student.Name,
            StudentAvatar = student.AvatarBase64, Rating = dto.Rating, Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return StatusCode(201, new { id = iid });
    }

    // ============ ADVISOR REQUESTS ============
    [HttpGet("{id}/advisor-requests")]
    public async Task<IActionResult> GetAdvisorRequests(string id)
    {
        var rows = await (
            from a in _db.ProjectAdvisors
            join p in _db.Projects on a.ProjectId equals p.Id
            where a.ProfId == id && a.Status == "Pending"
            orderby a.RequestedAt descending
            select new
            {
                projectId = a.ProjectId, projectTitle = p.Title, projectDescription = p.Description,
                ownerName = p.OwnerName, ownerAvatar = p.OwnerAvatarBase64,
                tractionScore = p.TractionScore, pitch = a.Pitch, requestedAt = a.RequestedAt
            }
        ).ToListAsync();
        return Ok(rows);
    }

    [HttpGet("{id}/advised-projects")]
    public async Task<IActionResult> GetAdvisedProjects(string id)
    {
        var rows = await (
            from a in _db.ProjectAdvisors
            join p in _db.Projects on a.ProjectId equals p.Id
            where a.ProfId == id && a.Status == "Active"
            orderby a.RequestedAt descending
            select new
            {
                id = p.Id, title = p.Title, description = p.Description,
                ownerName = p.OwnerName, ownerAvatar = p.OwnerAvatarBase64,
                tractionScore = p.TractionScore, visibility = p.Visibility, requestedAt = a.RequestedAt
            }
        ).ToListAsync();
        return Ok(rows);
    }
}
