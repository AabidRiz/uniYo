using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniYo.Api.Entities;

// ============================================================
// UNIVERSITIES
// ============================================================
[Table("universities")]
public class University
{
    [Key][Column("id")] public int Id { get; set; }
    [Column("name")] public string Name { get; set; } = "";
    [Column("category")] public string? Category { get; set; }
    [Column("code")] public string? Code { get; set; }
    [Column("domain")] public string? Domain { get; set; }
    [Column("pattern")] public string? Pattern { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

// ============================================================
// USERS
// ============================================================
[Table("users")]
public class User
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("role")] public string Role { get; set; } = "student";
    [Column("name")] public string Name { get; set; } = "";
    [Column("email")] public string Email { get; set; } = "";
    [Column("password")] public string? Password { get; set; }
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("university_name")] public string? UniversityName { get; set; }
    [Column("faculty")] public string? Faculty { get; set; }
    [Column("degree")] public string? Degree { get; set; }
    [Column("company")] public string? Company { get; set; }
    [Column("industry")] public string? Industry { get; set; }
    [Column("title")] public string? Title { get; set; }
    [Column("bio")] public string? Bio { get; set; }
    [Column("avatar_base64")] public string? AvatarBase64 { get; set; }
    [Column("cover_base64")] public string? CoverBase64 { get; set; }
    [Column("skills")] public string? Skills { get; set; }
    [Column("verified")] public bool Verified { get; set; }
    [Column("verification_status")] public string? VerificationStatus { get; set; }
    [Column("verification_reason")] public string? VerificationReason { get; set; }
    [Column("hourly_rate")] public string? HourlyRate { get; set; }
    [Column("consultation_type")] public string? ConsultationType { get; set; }
    [Column("consultation_fee")] public int ConsultationFee { get; set; }
    [Column("consultation_currency")] public string? ConsultationCurrency { get; set; }
    
        [Column("enterprise_profile", TypeName = "jsonb")] public string? EnterpriseProfile { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

// ============================================================
// USER CONNECTIONS (the table Antigravity forgot)
// ============================================================
[Table("user_connections")]
public class UserConnection
{
    [Key][Column("id")] public int Id { get; set; }
    [Column("user_id")] public string UserId { get; set; } = "";
    [Column("connected_user_id")] public string ConnectedUserId { get; set; } = "";
    [Column("status")] public string? Status { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

// ============================================================
// POSTS + COMMENTS + LIKES
// ============================================================
[Table("posts")]
public class Post
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("author_id")] public string? AuthorId { get; set; }
    [Column("author_name")] public string? AuthorName { get; set; }
    [Column("author_university")] public string? AuthorUniversity { get; set; }
    [Column("author_avatar_base64")] public string? AuthorAvatarBase64 { get; set; }
    [Column("author_role")] public string? AuthorRole { get; set; }
    [Column("author_verified")] public bool AuthorVerified { get; set; }
    [Column("content")] public string Content { get; set; } = "";
    [Column("image_base64")] public string? ImageBase64 { get; set; }
    [Column("attachment_base64")] public string? AttachmentBase64 { get; set; }
    [Column("attachment_name")] public string? AttachmentName { get; set; }
    [Column("likes_count")] public int LikesCount { get; set; }
    [Column("comments_count")] public int CommentsCount { get; set; }
    [Column("tags")] public string[]? Tags { get; set; }
    [Column("tagged_user_ids")] public string[]? TaggedUserIds { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("post_comments")]
public class PostComment
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("post_id")] public string PostId { get; set; } = "";
    [Column("author_id")] public string? AuthorId { get; set; }
    [Column("author_name")] public string? AuthorName { get; set; }
    [Column("author_avatar_base64")] public string? AuthorAvatarBase64 { get; set; }
    [Column("content")] public string Content { get; set; } = "";
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("post_likes")]
public class PostLike
{
    [Column("post_id")] public string PostId { get; set; } = "";
    [Column("user_id")] public string UserId { get; set; } = "";
}

// ============================================================
// PROJECTS + EVERYTHING UNDER PROJECTS
// ============================================================
[Table("projects")]
public class Project
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("owner_id")] public string? OwnerId { get; set; }
    [Column("owner_name")] public string? OwnerName { get; set; }
    [Column("owner_university")] public string? OwnerUniversity { get; set; }
    [Column("owner_avatar_base64")] public string? OwnerAvatarBase64 { get; set; }
    [Column("title")] public string Title { get; set; } = "";
    [Column("description")] public string Description { get; set; } = "";
    [Column("banner_base64")] public string? BannerBase64 { get; set; }
    [Column("open_universities")] public string[]? OpenUniversities { get; set; }
    [Column("skills_needed")] public string[]? SkillsNeeded { get; set; }
    [Column("seeking_investment")] public bool SeekingInvestment { get; set; }
    [Column("investment_goal")] public string? InvestmentGoal { get; set; }
    [Column("traction_score")] public int TractionScore { get; set; }
    [Column("visibility")] public string? Visibility { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

[Table("project_members")]
public class ProjectMember
{
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("user_id")] public string UserId { get; set; } = "";
    [Column("role")] public string? Role { get; set; }
    }

[Table("project_requests")]
public class ProjectRequest
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("applicant_id")] public string? ApplicantId { get; set; }
    [Column("applicant_name")] public string? ApplicantName { get; set; }
    [Column("university")] public string? University { get; set; }
    [Column("skill")] public string? Skill { get; set; }
    [Column("pitch")] public string? Pitch { get; set; }
    [Column("status")] public string Status { get; set; } = "Pending";
    [Column("type")] public string? Type { get; set; }
    [Column("invited_by_id")] public string? InvitedById { get; set; }
    [Column("responded_at")] public DateTime? RespondedAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("project_messages")]
public class ProjectMessage
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("sender_id")] public string? SenderId { get; set; }
    [Column("sender")] public string? Sender { get; set; }
    [Column("avatar_base64")] public string? AvatarBase64 { get; set; }
    [Column("text")] public string? Text { get; set; }
    [Column("message_type")] public string? MessageType { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("project_tasks")]
public class ProjectTask
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("title")] public string Title { get; set; } = "";
    [Column("description")] public string? Description { get; set; }
    [Column("status")] public string Status { get; set; } = "todo";
    [Column("priority")] public string Priority { get; set; } = "medium";
    [Column("assignee_id")] public string? AssigneeId { get; set; }
    [Column("assignee_name")] public string? AssigneeName { get; set; }
    [Column("due_date")] public string? DueDate { get; set; }
    [Column("created_by_id")] public string? CreatedById { get; set; }
    [Column("created_by_name")] public string? CreatedByName { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

[Table("project_repos")]
public class ProjectRepo
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("name")] public string Name { get; set; } = "";
    [Column("url")] public string Url { get; set; } = "";
    [Column("stars")] public int Stars { get; set; }
}

[Table("project_docs")]
public class ProjectDoc
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("title")] public string Title { get; set; } = "";
    [Column("size")] public string? Size { get; set; }
    [Column("url")] public string? Url { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("project_meetings")]
public class ProjectMeeting
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("title")] public string Title { get; set; } = "";
    [Column("description")] public string? Description { get; set; }
    [Column("meeting_date")] public string? MeetingDate { get; set; }
    [Column("meeting_time")] public string? MeetingTime { get; set; }
    [Column("duration_minutes")] public int DurationMinutes { get; set; }
    [Column("link")] public string? Link { get; set; }
    [Column("status")] public string? Status { get; set; }
    [Column("created_by_id")] public string? CreatedById { get; set; }
    [Column("created_by_name")] public string? CreatedByName { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("project_meeting_attendees")]
public class ProjectMeetingAttendee
{
    [Column("meeting_id")] public string MeetingId { get; set; } = "";
    [Column("user_id")] public string UserId { get; set; } = "";
}

[Table("project_activity")]
public class ProjectActivity
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("actor_id")] public string? ActorId { get; set; }
    [Column("actor_name")] public string? ActorName { get; set; }
    [Column("action")] public string Action { get; set; } = "";
    [Column("target_type")] public string? TargetType { get; set; }
    [Column("target_id")] public string? TargetId { get; set; }
    [Column("message")] public string? Message { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("project_advisors")]
public class ProjectAdvisor
{
    [Column("project_id")] public string ProjectId { get; set; } = "";
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("status")] public string Status { get; set; } = "Pending";
    [Column("pitch")] public string? Pitch { get; set; }
    [Column("requested_by")] public string? RequestedBy { get; set; }
    [Column("requested_at")] public DateTime RequestedAt { get; set; }
    [Column("responded_at")] public DateTime? RespondedAt { get; set; }
}

// ============================================================
// PROFESSORS
// ============================================================
[Table("professor_sessions")]
public class ProfessorSession
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("prof_id")] public string? ProfId { get; set; }
    [Column("prof_name")] public string? ProfName { get; set; }
    [Column("university")] public string? University { get; set; }
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("student_name")] public string? StudentName { get; set; }
    [Column("date")] public string? Date { get; set; }
    [Column("time")] public string? Time { get; set; }
    [Column("type")] public string? Type { get; set; }
    [Column("topic")] public string? Topic { get; set; }
    [Column("status")] public string Status { get; set; } = "Confirmed";
    [Column("notes")] public string? Notes { get; set; }
    [Column("meeting_link")] public string? MeetingLink { get; set; }
    [Column("response_message")] public string? ResponseMessage { get; set; }
    [Column("rejection_reason")] public string? RejectionReason { get; set; }
    [Column("completed_at")] public DateTime? CompletedAt { get; set; }
    [Column("rating")] public int? Rating { get; set; }
    [Column("rating_comment")] public string? RatingComment { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("professor_availability")]
public class ProfessorAvailability
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("day")] public string? Day { get; set; }
    [Column("time")] public string? Time { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("professor_questions")]
public class ProfessorQuestion
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("student_name")] public string? StudentName { get; set; }
    [Column("student_avatar")] public string? StudentAvatar { get; set; }
    [Column("question")] public string Question { get; set; } = "";
    [Column("answer")] public string? Answer { get; set; }
    [Column("answered_at")] public DateTime? AnsweredAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("professor_videos")]
public class ProfessorVideo
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("title")] public string Title { get; set; } = "";
    [Column("description")] public string? Description { get; set; }
    [Column("video_url")] public string? VideoUrl { get; set; }
    [Column("thumbnail_url")] public string? ThumbnailUrl { get; set; }
    [Column("duration_minutes")] public int? DurationMinutes { get; set; }
    [Column("tags")] public string[]? Tags { get; set; }
    [Column("views")] public int Views { get; set; }
    [Column("price")] public int Price { get; set; }
    [Column("currency")] public string? Currency { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("professor_video_impressions")]
public class ProfessorVideoImpression
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("video_id")] public string VideoId { get; set; } = "";
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("student_name")] public string? StudentName { get; set; }
    [Column("student_avatar")] public string? StudentAvatar { get; set; }
    [Column("rating")] public int? Rating { get; set; }
    [Column("comment")] public string? Comment { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("session_reviews")]
public class SessionReview
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("session_id")] public string? SessionId { get; set; }
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("student_id")] public string StudentId { get; set; } = "";
    [Column("student_name")] public string? StudentName { get; set; }
    [Column("student_avatar")] public string? StudentAvatar { get; set; }
    [Column("rating")] public int Rating { get; set; }
    [Column("comment")] public string? Comment { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("course_enrollments")]
public class CourseEnrollment
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("student_id")] public string StudentId { get; set; } = "";
    [Column("video_id")] public string VideoId { get; set; } = "";
    [Column("prof_id")] public string ProfId { get; set; } = "";
    [Column("status")] public string? Status { get; set; }
    [Column("is_paid")] public bool IsPaid { get; set; }
    [Column("amount_paid")] public string? AmountPaid { get; set; }
    [Column("transaction_id")] public string? TransactionId { get; set; }
    [Column("paid_at")] public DateTime? PaidAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

// ============================================================
// INTERNSHIPS
// ============================================================
[Table("internships")]
public class Internship
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("owner_id")] public string? OwnerId { get; set; }
    [Column("title")] public string Title { get; set; } = "";
    [Column("company")] public string Company { get; set; } = "";
    [Column("location")] public string? Location { get; set; }
    [Column("stipend")] public string? Stipend { get; set; }
    [Column("type")] public string? Type { get; set; }
    [Column("description")] public string? Description { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("internship_applications")]
public class InternshipApplication
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("internship_id")] public string? InternshipId { get; set; }
    [Column("user_id")] public string? UserId { get; set; }
    [Column("name")] public string? Name { get; set; }
    [Column("email")] public string? Email { get; set; }
    [Column("phone")] public string? Phone { get; set; }
    [Column("university")] public string? University { get; set; }
    [Column("degree")] public string? Degree { get; set; }
    [Column("faculty")] public string? Faculty { get; set; }
    [Column("gpa")] public string? Gpa { get; set; }
    [Column("experience")] public string? Experience { get; set; }
    [Column("cv_base64")] public string? CvBase64 { get; set; }
    [Column("cv_name")] public string? CvName { get; set; }
    [Column("status")] public string Status { get; set; } = "Applied";
}

// ============================================================
// INVESTMENTS
// ============================================================
[Table("investment_interests")]
public class InvestmentInterest
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("project_id")] public string? ProjectId { get; set; }
    [Column("project_title")] public string? ProjectTitle { get; set; }
    [Column("student_lead")] public string? StudentLead { get; set; }
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("investor_id")] public string? InvestorId { get; set; }
    [Column("investor_name")] public string? InvestorName { get; set; }
    [Column("target_amount")] public string? TargetAmount { get; set; }
    [Column("status")] public string? Status { get; set; }
    [Column("ai_summary")] public string? AiSummary { get; set; }
    [Column("meeting_slot")] public string? MeetingSlot { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("investment_meetings")]
public class InvestmentMeeting
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("investment_id")] public string InvestmentId { get; set; } = "";
    [Column("investor_id")] public string? InvestorId { get; set; }
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("date")] public string? Date { get; set; }
    [Column("time")] public string? Time { get; set; }
    [Column("link")] public string? Link { get; set; }
    [Column("message")] public string? Message { get; set; }
    [Column("status")] public string Status { get; set; } = "Proposed";
    [Column("change_request")] public string? ChangeRequest { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

// ============================================================
// ADMIN / VERIFICATION
// ============================================================
[Table("verification_queue")]
public class VerificationQueueItem
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("user_id")] public string? UserId { get; set; }
    [Column("name")] public string? Name { get; set; }
    [Column("email")] public string? Email { get; set; }
    [Column("student_id")] public string? StudentId { get; set; }
    [Column("university")] public string? University { get; set; }
    [Column("submitted_at")] public string? SubmittedAt { get; set; }
    [Column("id_format_match")] public bool IdFormatMatch { get; set; }
    [Column("otp_verified")] public bool OtpVerified { get; set; }
    [Column("ai_confidence")] public string? AiConfidence { get; set; }
    [Column("flag_reason")] public string? FlagReason { get; set; }
    [Column("id_card_base64")] public string? IdCardBase64 { get; set; }
    [Column("status")] public string Status { get; set; } = "Pending";
}

[Table("admin_complaints")]
public class AdminComplaint
{
    [Key][Column("id")] public string Id { get; set; } = "";
    [Column("reporter_id")] public string? ReporterId { get; set; }
    [Column("target_type")] public string? TargetType { get; set; }
    [Column("target_id")] public string? TargetId { get; set; }
    [Column("reason")] public string? Reason { get; set; }
    [Column("status")] public string Status { get; set; } = "Pending";
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}


