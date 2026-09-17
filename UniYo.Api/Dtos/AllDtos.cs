namespace UniYo.Api.Dtos;

// ============ AUTH ============
public record LoginDto(string Email, string Password, string? Role);

public record RegisterDto(
    string Role,
    string Name,
    string Email,
    string? Password,
    string? StudentId,
    string? University,
    string? Faculty,
    string? Degree,
    string? Company,
    string? Industry,
    string? Title,
    string? Bio,
    string? Skills,
    string? AvatarBase64,
    string? IdCardBase64,
    System.Text.Json.JsonElement? EnterpriseProfile = null
);

// ============ USERS ============
public record ConnectDto(string TargetId);

public record UpdateUserDto(
    string? Name,
    string? Bio,
    string? Degree,
    string? Faculty,
    string? Company,
    string? Industry,
    string? Title,
    string? Skills,
    string? AvatarBase64,
    string? CoverBase64,
    int? ConsultationFee
);

// ============ POSTS ============
public record CreatePostDto(
    string? AuthorId,
    string? Content,
    string? ImageBase64,
    string? AttachmentBase64,
    string? AttachmentName,
    string[]? Tags,
    string[]? TaggedUserIds
);

public record UpdatePostDto(string? Content, string[]? Tags);

public record LikeDto(string UserId);

public record CommentDto(string AuthorId, string Content);

// ============ PROJECTS ============
public record CreateProjectDto(
    string OwnerId,
    string Title,
    string Description,
    string? BannerBase64,
    string[]? OpenUniversities,
    string[]? SkillsNeeded,
    bool SeekingInvestment,
    string? InvestmentGoal,
    string? Visibility
);

public record UpdateProjectDto(
    string? Title,
    string? Description,
    string[]? SkillsNeeded,
    bool? SeekingInvestment,
    string? InvestmentGoal,
    string? Visibility,
    string? UserId
);

public record JoinRequestDto(string ApplicantId, string? Skill, string? Pitch);
public record InviteDto(string InvitedUserId, string OwnerId, string? Skill, string? Pitch);
public record RequestStatusDto(string Status, string OwnerId);
public record InviteStatusDto(string Status, string UserId);
public record SendMessageDto(string SenderId, string Text);
public record AddRepoDto(string Name, string Url, int? Stars, string UserId);
public record AddDocDto(string Title, string? Size, string? Url, string UserId);
public record TaskDto(string Title, string? Description, string? Status, string? Priority,
    string? AssigneeId, string? DueDate, string UserId);
public record UpdateTaskDto(string? Title, string? Description, string? Status, string? Priority,
    string? AssigneeId, string? DueDate, string UserId);
public record MeetingDto(string Title, string? Description, string? Date, string? Time,
    int? DurationMinutes, string? Link, List<string>? AttendeeIds, string UserId);

// ============ PROFESSORS ============
public record AvailabilityDto(string Day, string Time);
public record BookSessionDto(string ProfId, string StudentId, string Date, string Time,
    string? Type, string? Topic);
public record UpdateSessionDto(string ActorId, string? Topic, string? Status, string? Date,
    string? Time, string? Notes, int? Rating, string? RatingComment, string? MeetingLink,
    string? ResponseMessage, string? RejectionReason);
public record CreateReviewDto(string StudentId, int Rating, string Comment);
public record CreateQuestionDto(string StudentId, string Question);
public record AnswerQuestionDto(string Answer);
public record VideoDto(string Title, string? Description, string? VideoUrl,
    string? ThumbnailUrl, int? DurationMinutes, string[]? Tags, int? Price);

// ============ INTERNSHIPS ============
public record CreateInternshipDto(string Title, string Company, string? Location,
    string? Stipend, string? Type, string? Description, string? OwnerId);
public record ApplyJobDto(string UserId, string Name, string Email, string Phone,
    string? University, string Degree, string? Faculty, string? Gpa, string Experience,
    string CvBase64, string CvName);
public record ApplicantStatusDto(string Status);

// ============ INVESTMENTS ============
public record CreateInvestmentDto(string? ProjectId, string ProjectTitle, string? StudentLead,
    string? InvestorId, string? InvestorName, string? TargetAmount, string? AiSummary,
    string? MeetingSlot);
public record CreateInvestmentMeetingDto(string InvestorId, string? StudentId, string Date,
    string Time, string? Link, string? Message);
public record UpdateInvestmentMeetingDto(string ActorId, string? Action, string? ChangeRequest,
    string? Date, string? Time, string? Link, string? Message);

// ============ ADMIN ============
public record VerifyDto(string Action);
public record ComplaintDto(string ReporterId, string TargetType, string TargetId, string Reason);
public record ModerateInvestmentDto(string Action);
public record ModerateComplaintDto(string Action);

// ============ AI ============
public record AiChatDto(string Role, string Message);
