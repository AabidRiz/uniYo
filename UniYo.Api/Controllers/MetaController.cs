using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;

namespace UniYo.Api.Controllers;

[ApiController]
public class MetaController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public MetaController(UniYoDbContext db) { _db = db; }

    // GET /api/meta/options
    [HttpGet("api/meta/options")]
    public async Task<IActionResult> GetOptions()
    {
        // 1. Unique skills across ALL students
        var studentSkillsRaw = await _db.Users
            .Where(u => u.Role == "student" && u.Skills != null && u.Skills != "")
            .Select(u => u.Skills!)
            .ToListAsync();

        var skills = studentSkillsRaw
            .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(s => s.Trim())
            .Where(s => s.Length > 1)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s)
            .ToList();

        // 2. Unique expertise tags across ALL professors
        var profSkillsRaw = await _db.Users
            .Where(u => u.Role == "professor" && u.Skills != null && u.Skills != "")
            .Select(u => u.Skills!)
            .ToListAsync();

        var expertise = profSkillsRaw
            .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(s => s.Trim())
            .Where(s => s.Length > 1)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s)
            .ToList();

        // 3. Unique thesis tags across ALL investors
        var invSkillsRaw = await _db.Users
            .Where(u => u.Role == "business" && u.Skills != null && u.Skills != "")
            .Select(u => u.Skills!)
            .ToListAsync();

        var investorTheses = invSkillsRaw
            .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(s => s.Trim())
            .Where(s => s.Length > 1)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s)
            .ToList();

        // 4. All universities from the universities table
        var universities = await _db.Universities
            .Select(u => u.Name)
            .OrderBy(n => n)
            .ToListAsync();

        // 5. Universities that students are actually enrolled at
        var studentUniversities = await _db.Users
            .Where(u => u.Role == "student" && u.UniversityName != null && u.UniversityName != "")
            .Select(u => u.UniversityName!)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();

        return Ok(new {
            skills,
            expertise,
            investorTheses,
            universities,
            studentUniversities
        });
    }
}
