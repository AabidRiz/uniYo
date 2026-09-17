using Microsoft.EntityFrameworkCore;
using UniYo.Api.Entities;

namespace UniYo.Api.Data;

public class UniYoDbContext : DbContext
{
    public UniYoDbContext(DbContextOptions<UniYoDbContext> options) : base(options) { }

    public DbSet<University> Universities => Set<University>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserConnection> UserConnections => Set<UserConnection>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostComment> PostComments => Set<PostComment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<ProjectRequest> ProjectRequests => Set<ProjectRequest>();
    public DbSet<ProjectMessage> ProjectMessages => Set<ProjectMessage>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<ProjectRepo> ProjectRepos => Set<ProjectRepo>();
    public DbSet<ProjectDoc> ProjectDocs => Set<ProjectDoc>();
    public DbSet<ProjectMeeting> ProjectMeetings => Set<ProjectMeeting>();
    public DbSet<ProjectMeetingAttendee> ProjectMeetingAttendees => Set<ProjectMeetingAttendee>();
    public DbSet<ProjectActivity> ProjectActivities => Set<ProjectActivity>();
    public DbSet<ProjectAdvisor> ProjectAdvisors => Set<ProjectAdvisor>();
    public DbSet<ProfessorSession> ProfessorSessions => Set<ProfessorSession>();
    public DbSet<ProfessorAvailability> ProfessorAvailabilities => Set<ProfessorAvailability>();
    public DbSet<ProfessorQuestion> ProfessorQuestions => Set<ProfessorQuestion>();
    public DbSet<ProfessorVideo> ProfessorVideos => Set<ProfessorVideo>();
    public DbSet<ProfessorVideoImpression> ProfessorVideoImpressions => Set<ProfessorVideoImpression>();
    public DbSet<SessionReview> SessionReviews => Set<SessionReview>();
    public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
    public DbSet<Internship> Internships => Set<Internship>();
    public DbSet<InternshipApplication> InternshipApplications => Set<InternshipApplication>();
    public DbSet<InvestmentInterest> InvestmentInterests => Set<InvestmentInterest>();
    public DbSet<InvestmentMeeting> InvestmentMeetings => Set<InvestmentMeeting>();
    public DbSet<VerificationQueueItem> VerificationQueues => Set<VerificationQueueItem>();
    public DbSet<AdminComplaint> AdminComplaints => Set<AdminComplaint>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Composite keys
        b.Entity<PostLike>().HasKey(x => new { x.PostId, x.UserId });
        b.Entity<ProjectMember>().HasKey(x => new { x.ProjectId, x.UserId });
        b.Entity<ProjectMeetingAttendee>().HasKey(x => new { x.MeetingId, x.UserId });
        b.Entity<ProjectAdvisor>().HasKey(x => new { x.ProjectId, x.ProfId });

        // Postgres array columns
        b.Entity<Project>().Property(x => x.OpenUniversities).HasColumnType("text[]");
        b.Entity<Project>().Property(x => x.SkillsNeeded).HasColumnType("text[]");
        b.Entity<Post>().Property(x => x.Tags).HasColumnType("text[]");
        b.Entity<Post>().Property(x => x.TaggedUserIds).HasColumnType("text[]");
        b.Entity<ProfessorVideo>().Property(x => x.Tags).HasColumnType("text[]");

        // ============================================================
        // EXPLICIT RELATIONSHIPS — so EF inserts parents before children
        // ============================================================

        // Project -> Members / Messages / Requests / Tasks / Repos / Docs / Meetings / Activity / Advisors
        b.Entity<ProjectMember>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectMessage>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectRequest>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectTask>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectRepo>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectDoc>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectMeeting>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectActivity>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProjectAdvisor>()
            .HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Post -> Comments / Likes
        b.Entity<PostComment>()
            .HasOne<Post>().WithMany().HasForeignKey(x => x.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<PostLike>()
            .HasOne<Post>().WithMany().HasForeignKey(x => x.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        // Meeting -> Attendees
        b.Entity<ProjectMeetingAttendee>()
            .HasOne<ProjectMeeting>().WithMany().HasForeignKey(x => x.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        base.OnModelCreating(b);
    }
}
