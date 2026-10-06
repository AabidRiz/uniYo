using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class MatchingService
{
    // Student <-> Project match score (0-100)
    public int StudentProjectMatch(User student, Project project)
    {
        if (string.IsNullOrEmpty(student.Skills) || project.SkillsNeeded == null || project.SkillsNeeded.Length == 0)
            return 0;

        var studentSkills = student.Skills
            .ToLowerInvariant()
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        var projectSkills = project.SkillsNeeded
            .Select(s => s.ToLowerInvariant())
            .ToArray();

        // Skill overlap
        var matched = projectSkills.Count(ps =>
            studentSkills.Any(ss => ss.Contains(ps) || ps.Contains(ss)));

        var skillScore = (int)(100.0 * matched / projectSkills.Length);

        // Verified bonus
        var verifiedBonus = student.Verified ? 5 : 0;

        return Math.Min(100, skillScore + verifiedBonus);
    }

    // Investor <-> Project match score (0-100)
    public int InvestorProjectMatch(User investor, Project project)
    {
        if (string.IsNullOrEmpty(investor.Skills) || project.SkillsNeeded == null)
            return 0;

        var thesis = investor.Skills
            .ToLowerInvariant()
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        var projectTech = project.SkillsNeeded.Select(s => s.ToLowerInvariant()).ToArray();
        var projectText = $"{project.Title} {project.Description}".ToLowerInvariant();

        // Thesis alignment
        var matched = thesis.Count(t =>
            projectTech.Any(pt => pt.Contains(t) || t.Contains(pt)) ||
            projectText.Contains(t));

        var thesisScore = (int)(100.0 * matched / Math.Max(1, thesis.Length));

        // Seeking investment bonus
        var seekingBonus = project.SeekingInvestment ? 15 : 0;

        // Amount fit
        var amountBonus = 0;
        if (!string.IsNullOrEmpty(project.InvestmentGoal))
        {
            var goal = project.InvestmentGoal.ToLowerInvariant();
            if (goal.Contains("500") || goal.Contains("750") || goal.Contains("1,000"))
                amountBonus = 10;
        }

        return Math.Min(100, thesisScore + seekingBonus + amountBonus);
    }
}
