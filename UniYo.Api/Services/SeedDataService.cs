using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class SeedDataService
{
    public static List<User> GenerateStudents()
    {
        var universities = new[]
        {
            "Sri Lanka Institute of Information Technology (SLIIT) – Malabe",
            "University of Colombo – Colombo",
            "University of Moratuwa – Moratuwa",
            "University of Peradeniya – Peradeniya",
            "NSBM Green University"
        };

        var faculties = new[] { "Computing", "Engineering", "Science", "Business" };

        var allSkills = new[]
        {
            "React","Node.js","Python","PyTorch","TensorFlow","PostgreSQL","Docker",
            "Kubernetes","AWS","Flutter","Kotlin","Swift","C++","ROS2","Embedded Systems",
            "Computer Vision","NLP","Blockchain","Solidity","Data Science","MLOps",
            "DevOps","UI/UX","Figma","Product Management","Marketing","Finance"
        };

        var firstNames = new[] {
            "Kavindu","Nimal","Dilani","Ruwan","Sachini","Tharindu","Amaya",
            "Pasindu","Dinithi","Kanishka","Ishara","Nadeesha","Sahan","Hiruni",
            "Chamath","Dilshan","Nethmi","Kavishka","Dulanjaya","Anjali",
            "Ravindu","Sanduni","Janith","Thilini","Supuni","Lasith","Vindya",
            "Yasiru","Dilini","Bimsara","Ravini","Pamoda","Kasun","Nimasha",
            "Nuwan","Sithara","Ashan","Malsha","Thimira","Nadeeka"
        };
        var lastNames = new[] {
            "Perera","Silva","Fernando","Jayasuriya","Wickramasinghe","Bandara",
            "Rathnayake","Madushan","Weerasinghe","Alwis","Gunawardena","Ranasuriya"
        };

        var rand = new Random(42);
        var students = new List<User>();

        for (int i = 0; i < 40; i++)
        {
            var first = firstNames[i % firstNames.Length];
            var last = lastNames[(i / 2) % lastNames.Length];
            var uni = universities[i % universities.Length];
            var faculty = faculties[i % faculties.Length];

            var skillCount = 3 + rand.Next(3);
            var skills = allSkills.OrderBy(_ => rand.Next()).Take(skillCount).ToArray();

            students.Add(new User
            {
                Id = $"usr_std_{i + 1:D2}",
                Role = "student",
                Name = $"{first} {last}",
                Email = $"student{i + 1}@uniyo.lk",
                Password = "1234",
                StudentId = $"{uni.Split(' ')[0].ToUpper()}-2026{i + 1:D4}",
                UniversityName = uni,
                Faculty = faculty,
                Degree = $"B.Sc (Hons) {faculty}",
                Skills = string.Join(",", skills),
                Bio = $"{faculty} student at {uni}. Interested in {skills[0]} and {skills[1]}.",
                AvatarBase64 = GenerateAvatar(first + last, i),
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Seed data",
                CreatedAt = DateTime.UtcNow
            });
        }

        return students;
    }

    public static List<User> GenerateInvestors()
    {
        var investors = new[]
        {
            ("Dinesh Gunawardena", "Lanka Venture Partners & Labs", "Early Stage Tech VC", new[] { "AI", "ML", "SaaS" }),
            ("Shanil Fernando", "Apex Capital", "DeepTech & Robotics", new[] { "Robotics", "Hardware", "IoT" }),
            ("Nadeesha Silva", "Ceylon Angels", "FinTech & Blockchain", new[] { "FinTech", "Blockchain", "Payments" }),
            ("Roshan Perera", "Blue Ocean Ventures", "ClimateTech", new[] { "Climate", "Sustainability", "AgriTech" }),
            ("Ishara Jayawardena", "Frontier Fund", "HealthTech", new[] { "Health", "BioTech", "Medical" }),
            ("Mahesh Rajapaksa", "Orion Capital", "AI & Data", new[] { "AI", "ML", "Data" }),
            ("Ayesha Weerakoon", "Serendib Ventures", "SaaS & Cloud", new[] { "SaaS", "Cloud", "B2B" }),
            ("Pradeep Chandran", "Nexus Investments", "E-commerce", new[] { "ECommerce", "Retail", "Logistics" }),
            ("Shivani Nadaraja", "Meridian Capital", "EdTech", new[] { "EdTech", "Learning", "AI" }),
            ("Thilan Wickramasinghe", "Summit Partners", "Cybersecurity", new[] { "Security", "Infrastructure", "Cloud" }),
            ("Rashmi De Silva", "Coral Ventures", "Consumer Tech", new[] { "Consumer", "Mobile", "Social" }),
            ("Anil Fernando", "Ambition Capital", "B2B SaaS", new[] { "SaaS", "Enterprise", "AI" }),
            ("Nirasha Kotelawala", "Aurora Fund", "Sustainability", new[] { "Climate", "Energy", "Sustainability" }),
            ("Chandima Perera", "Solstice Ventures", "Deep Tech", new[] { "Robotics", "AI", "Hardware" }),
            ("Dilini Jayatilaka", "Lighthouse Capital", "Impact Investing", new[] { "Social Impact", "Education", "Health" })
        };

        var list = new List<User>();
        for (int i = 0; i < investors.Length; i++)
        {
            var (name, company, industry, thesis) = investors[i];

            list.Add(new User
            {
                Id = $"usr_inv_{i + 1:D2}",
                Role = "business",
                Name = name,
                Email = $"investor{i + 1}@uniyo.lk",
                Password = "1234",
                Company = company,
                Industry = industry,
                Title = "Investment Partner",
                Bio = $"Investing in {industry} across Sri Lanka and South Asia.",
                Skills = string.Join(",", thesis),
                AvatarBase64 = GenerateAvatar(name, i + 100),
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Seed data",
                CreatedAt = DateTime.UtcNow
            });
        }

        return list;
    }

    private static string GenerateAvatar(string name, int seed)
    {
        var hue = (seed * 37) % 360;
        var initial = string.IsNullOrEmpty(name) ? "?" : name.Substring(0, 1).ToUpper();
        var svg = $"<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='hsl({hue},60%,50%)'/><text x='50' y='65' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif'>{initial}</text></svg>";
        return $"data:image/svg+xml;utf8,{svg}";
    }
}
