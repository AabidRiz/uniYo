using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class MatchingService
{
    public int StudentProjectMatch(User student, Project project)
    {
        if (string.IsNullOrEmpty(student.Skills) || project.SkillsNeeded == null)
            return 0;

        var studentSkills = student.Skills
            .ToLowerInvariant()
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        var projectSkills = project.SkillsNeeded
            .Select(s => s.ToLowerInvariant().Trim())
            .ToArray();

        if (projectSkills.Length == 0) return 0;

        // Exact match count
        var matched = 0;
        foreach (var ps in projectSkills)
        {
            if (studentSkills.Any(ss => ss == ps || ss.Contains(ps) || ps.Contains(ss)))
            {
                matched++;
            }
        }

        var skillScore = (int)(100.0 * matched / projectSkills.Length);
        return Math.Min(100, skillScore + (student.Verified ? 5 : 0));
    }

    public int InvestorProjectMatch(User investor, Project project)
    {
        if (string.IsNullOrEmpty(investor.Skills) || project.SkillsNeeded == null)
            return 0;

        var thesis = investor.Skills
            .ToLowerInvariant()
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        var projectText = $"{project.Title} {project.Description}".ToLowerInvariant();
        var projectSkills = project.SkillsNeeded.Select(s => s.ToLowerInvariant().Trim()).ToArray();

        var matched = 0;
        foreach (var t in thesis)
        {
            // Check exact match with project skills
            if (projectSkills.Any(ps => ps == t || ps.Contains(t) || t.Contains(ps)))
            {
                matched++;
            }
            // Check if thesis matches title/description
            else if (projectText.Contains(t))
            {
                matched++;
            }
        }

        var thesisScore = (int)(100.0 * matched / thesis.Length);
        var seekingBonus = project.SeekingInvestment ? 15 : 0;
        
        return Math.Min(100, thesisScore + seekingBonus);
    }
}
