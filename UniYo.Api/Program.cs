using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using UniYo.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=uniyo_db;Username=postgres;Password=1234";

builder.Services.AddDbContext<UniYoDbContext>(options =>
    options.UseNpgsql(connectionString));

// Services
builder.Services.AddScoped<UniYo.Api.Services.UserService>();
builder.Services.AddScoped<UniYo.Api.Services.PostService>();
builder.Services.AddScoped<UniYo.Api.Services.MembershipService>();
builder.Services.AddScoped<UniYo.Api.Services.ActivityService>();
builder.Services.AddScoped<UniYo.Api.Services.ProjectService>();
builder.Services.AddScoped<UniYo.Api.Services.RagService>();

// HttpClient for RagService (Groq + sidecar)
builder.Services.AddHttpClient<UniYo.Api.Services.RagService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
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

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

Console.WriteLine("UniYO ASP.NET Core backend on http://localhost:5000");
app.Run();
