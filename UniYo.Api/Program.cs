using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using UniYo.Api.Data;
using UniYo.Api.Entities;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=uniyo_db;Username=postgres;Password=1234";

builder.Services.AddDbContext<UniYoDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<UniYo.Api.Services.UserService>();
builder.Services.AddScoped<UniYo.Api.Services.PostService>();
builder.Services.AddScoped<UniYo.Api.Services.MembershipService>();
builder.Services.AddScoped<UniYo.Api.Services.ActivityService>();
builder.Services.AddScoped<UniYo.Api.Services.ProjectService>();
builder.Services.AddScoped<UniYo.Api.Services.RagService>();

builder.Services.AddHttpClient<UniYo.Api.Services.RagService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://uniyo.vercel.app",
            "https://uniyo-eight.vercel.app",
            "https://uniyo-aabidriz.vercel.app"
        ).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ============================================================
// AUTO-CREATE SCHEMA + SEED (idempotent, parallel-safe)
// ============================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UniYoDbContext>();
    try
    {
        db.Database.EnsureCreated();

        if (!db.Universities.Any())
        {
            db.Universities.AddRange(
                new University { Name = "SLIIT",                    Category = "Non-State/Private", Code = "SLIIT", Domain = "sliit.lk", Pattern = @"^IT-\d{8}$" },
                new University { Name = "University of Colombo",    Category = "UGC State",         Code = "UOC",   Domain = "cmb.ac.lk", Pattern = @"^UOC-\d{6}$" },
                new University { Name = "University of Moratuwa",   Category = "UGC State",         Code = "UOM",   Domain = "uom.lk",    Pattern = @"^UOM-\d{6}$" },
                new University { Name = "University of Peradeniya", Category = "UGC State",         Code = "UOP",   Domain = "pdn.ac.lk", Pattern = @"^UOP-\d{6}$" },
                new University { Name = "NSBM Green University",    Category = "Non-State/Private", Code = "NSBM",  Domain = "nsbm.ac.lk", Pattern = @"^NSBM-\d{6}$" }
            );
            db.SaveChanges();
        }

        if (!db.Users.Any(u => u.Id == "usr_student_demo"))
        {
            db.Users.Add(new User
            {
                Id = "usr_student_demo",
                Role = "student",
                Name = "Kusal Perera",
                Email = "kusal.p@sliit.lk",
                Password = "1234",
                StudentId = "IT-20260001",
                UniversityName = "SLIIT",
                Faculty = "Computing",
                Degree = "B.Sc (Hons) Software Engineering",
                Bio = "Demo student for testing.",
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Demo seed account.",
                AvatarBase64 = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"50\" fill=\"%230A66C2\"/></svg>",
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        // Parallel test hosts may race — ignore duplicate key errors
        Console.WriteLine($"[seed] skipped: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

Console.WriteLine($"UniYO ASP.NET Core backend on http://localhost:{port}");
app.Run();

public partial class Program { }
