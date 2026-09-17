using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/universities")]
public class UniversitiesController : ControllerBase
{
    private readonly UniYoDbContext _db;
    public UniversitiesController(UniYoDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rows = await _db.Universities
            .OrderBy(u => u.Category)
            .ThenBy(u => u.Name)
            .ToListAsync();
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] University dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { error = "Name required" });

        var code = !string.IsNullOrWhiteSpace(dto.Code)
            ? dto.Code
            : dto.Name.Substring(0, Math.Min(5, dto.Name.Length)).ToUpper().Replace(" ", "");
        var category = dto.Category ?? "Non-State/Private";
        var domain = dto.Domain ?? "edu.lk";
        var pattern = dto.Pattern ?? $"^{code}-\\d{{6}}$";

        var uni = new University
        {
            Name = dto.Name,
            Category = category,
            Code = code,
            Domain = domain,
            Pattern = pattern,
            CreatedAt = DateTime.UtcNow
        };
        _db.Universities.Add(uni);
        await _db.SaveChangesAsync();
        return StatusCode(201, uni);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] University dto)
    {
        var uni = await _db.Universities.FindAsync(id);
        if (uni == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Name)) uni.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Category)) uni.Category = dto.Category;
        if (!string.IsNullOrWhiteSpace(dto.Code)) uni.Code = dto.Code;
        if (!string.IsNullOrWhiteSpace(dto.Domain)) uni.Domain = dto.Domain;
        if (!string.IsNullOrWhiteSpace(dto.Pattern)) uni.Pattern = dto.Pattern;

        await _db.SaveChangesAsync();
        return Ok(uni);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var uni = await _db.Universities.FindAsync(id);
        if (uni == null) return NotFound();
        _db.Universities.Remove(uni);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }
}
