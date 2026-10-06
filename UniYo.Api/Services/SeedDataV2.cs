using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class SeedDataV2
{
    public static List<User> GenerateProfessors()
    {
        var data = new (string Name, string Uni, string Faculty, string Title, string Skills)[]
        {
            ("Prof. Rohan Abeyaratne", "University of Colombo - Colombo", "Science", "Chair Professor of Computer Science", "AI,Machine Learning,Data Science,Research Methods"),
            ("Prof. Ananda Jayawardane", "University of Moratuwa - Moratuwa", "Engineering", "Senior Professor of Tech Management", "Innovation,Entrepreneurship,Tech Transfer"),
            ("Prof. Kumari Wickramasinghe", "University of Peradeniya - Peradeniya", "Science", "Professor of Bioinformatics", "BioTech,Genomics,Python,R"),
            ("Prof. Sarath Ratnayake", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Robotics", "Robotics,ROS2,Control Systems,Embedded"),
            ("Prof. Dilrukshi Fernando", "SLIIT - Malabe", "Computing", "Professor of AI", "AI,Deep Learning,NLP,Transformers"),
            ("Prof. Jayantha Wijesinghe", "University of Colombo - Colombo", "Science", "Professor of Physics", "Physics,Simulation,MATLAB,Quantum"),
            ("Prof. Malini Gunawardena", "SLIIT - Malabe", "Computing", "Professor of Software Eng", "Software Architecture,DevOps,Cloud,Kubernetes"),
            ("Prof. Nihal Perera", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Electrical Eng", "Embedded Systems,Power Electronics,IoT,PCB"),
            ("Prof. Chandrika Silva", "University of Peradeniya - Peradeniya", "Science", "Professor of Chemistry", "Chemistry,Materials Science,Sustainability"),
            ("Prof. Upul Dissanayake", "SLIIT - Malabe", "Computing", "Professor of Cybersecurity", "CyberSecurity,Cryptography,Penetration Testing"),
            ("Prof. Priyanka Bandara", "NSBM Green University", "Business", "Professor of Finance", "Finance,FinTech,Investment Analysis"),
            ("Prof. Asoka Ranatunga", "University of Peradeniya - Peradeniya", "Science", "Professor of Environmental Sci", "Climate Science,AgriTech,Sustainability"),
            ("Prof. Nilmini Rajapaksa", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Civil Eng", "Infrastructure,BIM,Smart Cities"),
            ("Prof. Mohan Dassanayake", "SLIIT - Malabe", "Computing", "Professor of Data Eng", "Big Data,MLOps,Apache Spark,Kafka"),
            ("Prof. Kalyani Weeratunga", "University of Colombo - Colombo", "Science", "Professor of Health Informatics", "HealthTech,Medical Imaging,EHR"),
            ("Prof. Ravindra Amarasuriya", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Mechanical Eng", "Mechatronics,CAD,CFD,Robotics"),
            ("Prof. Sunethra Dharmasena", "SLIIT - Malabe", "Computing", "Professor of HCI", "UI/UX,Accessibility,Design Systems"),
            ("Prof. Chulani Wijenayake", "NSBM Green University", "Business", "Professor of Marketing", "Marketing,Branding,Consumer Behaviour"),
            ("Prof. Buddhika Samarasinghe", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Telecommunication", "Networking,5G,SDN,IoT"),
            ("Prof. Renuka Kumarasiri", "University of Colombo - Colombo", "Science", "Professor of Applied Math", "Optimization,Cryptography,Linear Algebra"),
            ("Prof. Wasantha Gamage", "SLIIT - Malabe", "Computing", "Professor of Distributed Systems", "Distributed Systems,Cloud Native,Kubernetes"),
            ("Prof. Chandima Herath", "University of Peradeniya - Peradeniya", "Science", "Professor of Biotechnology", "Fermentation,Process BioTech,Industrial Bio"),
            ("Prof. Aruna Samaraweera", "NSBM Green University", "Business", "Professor of Operations", "Logistics,Supply Chain,Ecommerce"),
            ("Prof. Nadeesha Kumari", "SLIIT - Malabe", "Computing", "Professor of Web Technologies", "React,Node.js,TypeScript,GraphQL"),
            ("Prof. Harsha Wimalasuriya", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Electronics", "Signal Processing,FPGA,ASIC Design"),
            ("Prof. Iresha Gunasekara", "University of Peradeniya - Peradeniya", "Science", "Professor of Microbiology", "Microbiology,Research,Medical Bio"),
            ("Prof. Upali Ekanayake", "SLIIT - Malabe", "Computing", "Professor of Operating Systems", "Linux Kernel,Systems Programming,Rust"),
            ("Prof. Dilhani Weerakoon", "University of Colombo - Colombo", "Science", "Professor of Statistics", "Statistics,Bayesian,R,Data Science"),
            ("Prof. Sanjeewa Peiris", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Automotive Eng", "EV Tech,Battery Systems,Embedded"),
            ("Prof. Thilini Wijeratne", "SLIIT - Malabe", "Computing", "Professor of Mobile Computing", "Flutter,Android,iOS,Cross Platform"),
            ("Prof. Ravindu Senaratne", "NSBM Green University", "Business", "Professor of Analytics", "Business Analytics,Data Viz,SaaS"),
            ("Prof. Yasodhara Weerasinghe", "University of Peradeniya - Peradeniya", "Science", "Professor of Material Science", "Nanotech,Advanced Materials,Sustainability"),
            ("Prof. Dulanjaya Perera", "SLIIT - Malabe", "Computing", "Professor of Information Systems", "Enterprise Architecture,ERP,BPM"),
            ("Prof. Nilanthi Silva", "University of Colombo - Colombo", "Science", "Professor of Neuroscience", "Computational Neuro,Brain Computer Interfaces"),
            ("Prof. Sumith Rajapaksa", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Energy Systems", "Renewable Energy,Solar,Grid Systems"),
            ("Prof. Ama Wijenayake", "SLIIT - Malabe", "Computing", "Professor of Formal Methods", "Formal Verification,Theorem Proving,Coq"),
            ("Prof. Shiyamala Krishnan", "University of Peradeniya - Peradeniya", "Science", "Professor of Bioinformatics", "BioTech,Structural Bio,AI,Python"),
            ("Prof. Ranil Gunawardena", "NSBM Green University", "Business", "Professor of International Business", "Trade,Strategy,Global Markets"),
            ("Prof. Hiruni Fernando", "SLIIT - Malabe", "Computing", "Professor of NLP", "NLP,LLMs,Transformers,Prompt Engineering"),
            ("Prof. Gamini Alwis", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Building Tech", "Construction,BIM,Digital Twins"),
            ("Prof. Neelamani Rajah", "University of Colombo - Colombo", "Science", "Professor of Health Sciences", "Public Health,Epidemiology,Analytics"),
            ("Prof. Dilhan Kariyawasam", "SLIIT - Malabe", "Computing", "Professor of Database Systems", "PostgreSQL,Distributed DB,Big Data"),
            ("Prof. Sudath Wijesuriya", "University of Peradeniya - Peradeniya", "Science", "Professor of Food Science", "Food Tech,AgriTech,Sustainability"),
            ("Prof. Indrani Kodagoda", "NSBM Green University", "Business", "Professor of HR", "HR,People Analytics,Org Behavior"),
            ("Prof. Prasad Wickramarachchi", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Signal Processing", "Signal Processing,Audio,Embedded AI"),
            ("Prof. Muditha Dassanayake", "SLIIT - Malabe", "Computing", "Professor of Game Dev", "Unity,Unreal,3D Graphics,Game Design"),
            ("Prof. Sadun Perera", "University of Peradeniya - Peradeniya", "Science", "Professor of Climate Science", "Climate Modeling,Remote Sensing,Data"),
            ("Prof. Ayesha Fonseka", "SLIIT - Malabe", "Computing", "Professor of DevOps", "DevOps,Terraform,AWS,Kubernetes"),
            ("Prof. Nimal Wijesinghe", "University of Moratuwa - Moratuwa", "Engineering", "Professor of Mechatronics", "Mechatronics,Robotics,Automation"),
            ("Prof. Tamara De Silva", "University of Peradeniya - Peradeniya", "Science", "Professor of Environmental Analytics", "Environmental Data,Climate,GIS")
        };

        var list = new List<User>();
        for (int i = 0; i < data.Length; i++)
        {
            var d = data[i];
            list.Add(new User
            {
                Id = $"usr_prof_{i + 100:D3}",
                Role = "professor",
                Name = d.Name,
                Email = $"prof{i + 100}@uniyo.lk",
                Password = "1234",
                UniversityName = d.Uni,
                Faculty = $"Faculty of {d.Faculty}",
                Title = d.Title,
                Bio = $"{d.Title}. Research: {d.Skills.Replace(",", ", ")}.",
                Skills = d.Skills,
                AvatarBase64 = MakeAvatar(i + 200),
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Seed data",
                CreatedAt = DateTime.UtcNow
            });
        }
        return list;
    }

    public static List<User> GenerateStudents()
    {
        var data = new (string Name, string Uni, string Skills)[]
        {
            ("Ayodhya Abeysinghe", "SLIIT - Malabe", "React,Node.js,MongoDB,GraphQL"),
            ("Bhagya Bandaranayake", "University of Moratuwa - Moratuwa", "C++,ROS2,Embedded Systems,Robotics"),
            ("Chamari Chandrasiri", "University of Colombo - Colombo", "Python,PyTorch,TensorFlow,NLP"),
            ("Dasun Dharmapala", "University of Peradeniya - Peradeniya", "Flutter,Dart,Kotlin,Mobile Dev"),
            ("Eraj Ekanayake", "NSBM Green University", "Blockchain,Solidity,Web3,Rust"),
            ("Fathima Fonseka", "SLIIT - Malabe", "Data Science,MLOps,Apache Spark,Python"),
            ("Gayashan Gunathilake", "University of Moratuwa - Moratuwa", "UI/UX,Figma,Product Design,Prototyping"),
            ("Hasini Hettiarachchi", "University of Colombo - Colombo", "CyberSecurity,Penetration Testing,Kali"),
            ("Ishari Ilangakoon", "SLIIT - Malabe", "AWS,Docker,Kubernetes,DevOps"),
            ("Janaka Jayatilaka", "University of Peradeniya - Peradeniya", "Unity,3D Modeling,Game Design,AR"),
            ("Kavishka Kariyawasam", "NSBM Green University", "React,Next.js,TypeScript,Tailwind"),
            ("Lakmini Liyanage", "SLIIT - Malabe", "Python,Django,PostgreSQL,REST APIs"),
            ("Mahesh Munasinghe", "University of Moratuwa - Moratuwa", "ROS2,C++,Computer Vision,OpenCV"),
            ("Nadun Nanayakkara", "University of Colombo - Colombo", "PyTorch,Computer Vision,Deep Learning"),
            ("Oshini Obeyesekere", "SLIIT - Malabe", "Flutter,Firebase,Cloud Functions"),
            ("Pasan Pathirana", "University of Peradeniya - Peradeniya", "Data Science,R,Statistics,Visualization"),
            ("Rashmi Rajapaksa", "NSBM Green University", "Marketing,SEO,Content Strategy"),
            ("Sachith Samarakoon", "SLIIT - Malabe", "Node.js,Express,MongoDB,GraphQL"),
            ("Thilina Tennakoon", "University of Moratuwa - Moratuwa", "Embedded C,STM32,FreeRTOS"),
            ("Udeshika Udalagama", "University of Colombo - Colombo", "FinTech,Payments,Java,Spring Boot"),
            ("Vishwa Perera", "SLIIT - Malabe", "NLP,Transformers,Hugging Face"),
            ("Waruni Silva", "University of Peradeniya - Peradeniya", "Blockchain,Hyperledger,Smart Contracts"),
            ("Yohan Fernando", "NSBM Green University", "Product Management,Agile,Scrum"),
            ("Zahra Mansoor", "SLIIT - Malabe", "Python,FastAPI,PostgreSQL,Docker"),
            ("Amaya Rajapaksa", "University of Moratuwa - Moratuwa", "Robotics,Control Theory,MATLAB"),
            ("Bimsara Wickramasinghe", "University of Colombo - Colombo", "React Native,Redux,TypeScript"),
            ("Chathura Jayawardena", "SLIIT - Malabe", "IoT,Embedded Systems,MQTT"),
            ("Dulanjali Alwis", "University of Peradeniya - Peradeniya", "AgriTech,Remote Sensing,GIS"),
            ("Eranga Gunasekara", "NSBM Green University", "HR Analytics,Tableau,Power BI"),
            ("Fazna Rizwan", "SLIIT - Malabe", "Kotlin,Android,Jetpack Compose")
        };

        var list = new List<User>();
        for (int i = 0; i < data.Length; i++)
        {
            var d = data[i];
            list.Add(new User
            {
                Id = $"usr_std_v2_{i + 1:D2}",
                Role = "student",
                Name = d.Name,
                Email = $"studentv2_{i + 1}@uniyo.lk",
                Password = "1234",
                StudentId = $"V2-2026{i + 100:D4}",
                UniversityName = d.Uni,
                Faculty = "Computing",
                Degree = "B.Sc (Hons) Computing",
                Skills = d.Skills,
                Bio = $"Student at {d.Uni}. Skills: {d.Skills.Replace(",", ", ")}.",
                AvatarBase64 = MakeAvatar(i + 300),
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Seed data",
                CreatedAt = DateTime.UtcNow
            });
        }
        return list;
    }

    public static List<User> GenerateInvestors()
    {
        var data = new (string Name, string Company, string Thesis)[]
        {
            ("Ravi Chandran", "Vertex Capital", "AI,ML,Deep Learning,NLP"),
            ("Shalini Gupta", "Horizon Ventures", "FinTech,Payments,Digital Banking"),
            ("Ajith Kumar", "Summit Partners", "Enterprise SaaS,B2B,Cloud"),
            ("Priya Menon", "Coral Capital", "Climate Tech,Sustainability,AgriTech"),
            ("Sanjay Patel", "Emerald Fund", "HealthTech,Medical Devices,BioTech"),
            ("Meera Iyer", "Nova Ventures", "EdTech,Learning Platforms,AI Tutors"),
            ("Rahul Reddy", "Bluestone Capital", "B2B SaaS,Analytics,Workflow Automation"),
            ("Anjali Sharma", "Aurora Partners", "Consumer Tech,Mobile Apps,Social"),
            ("Vikram Nair", "Titan Capital", "Robotics,Hardware,IoT"),
            ("Deepa Rao", "Lighthouse Fund", "Social Impact,Education,Health"),
            ("Arjun Mehta", "Peak Ventures", "AI Infrastructure,Data Platforms,MLOps"),
            ("Sunita Reddy", "Compass Capital", "Logistics,Supply Chain,E-commerce"),
            ("Karan Chopra", "Genesis Fund", "CyberSecurity,Infrastructure,Cloud"),
            ("Neha Kapoor", "Silverline Capital", "IoT,Embedded Systems,Automation"),
            ("Rajesh Verma", "Pioneer Ventures", "Blockchain,Web3,Crypto"),
            ("Aishwarya Nair", "Harmony Fund", "BioTech,Genomics,Medical Imaging"),
            ("Sameer Khan", "Vanguard Capital", "Enterprise Software,SaaS,Data"),
            ("Divya Iyer", "Orion Partners", "AgriTech,Food Tech,Climate"),
            ("Nikhil Sinha", "Matrix Capital", "Data Science,Analytics,ML"),
            ("Kavya Reddy", "Fusion Ventures", "DeepTech,AI,Robotics"),
            ("Harsh Agarwal", "Beacon Capital", "E-commerce,Retail,Logistics"),
            ("Pooja Bhatt", "Crystal Fund", "FinTech,Payments,SaaS"),
            ("Manish Joshi", "Apex Ventures", "SaaS,Cloud,Enterprise"),
            ("Shruti Kumar", "Zenith Capital", "HealthTech,Medical,Analytics"),
            ("Aman Singh", "Legacy Partners", "Blockchain,Web3,FinTech"),
            ("Ananya Das", "Cascade Fund", "Climate,Energy,Renewables"),
            ("Rohan Malhotra", "Beacon Hill", "AI,ML,Data Science"),
            ("Tanya Kapoor", "Vivid Ventures", "EdTech,Learning,Mobile"),
            ("Vivek Chopra", "Skyline Capital", "IoT,Embedded,Industrial Automation"),
            ("Sarita Menon", "Ocean Fund", "HealthTech,BioTech,AI"),
            ("Sameera Fernando", "Ceylon Equity", "SaaS,AI,Enterprise"),
            ("Ranjith Perera", "Lanka Capital", "AgriTech,Climate,Food"),
            ("Dilani Silva", "Serendib Fund", "HealthTech,BioTech,Medical"),
            ("Chaminda Rajapaksa", "Ruhunu Ventures", "FinTech,Payments,Banking"),
            ("Nimal Jayawardena", "Ceylon Ventures", "AI,Robotics,Hardware"),
            ("Priyanka Weerasinghe", "Sigiriya Capital", "ClimateTech,Renewable Energy"),
            ("Roshan De Silva", "Colombo Capital", "SaaS,Enterprise,Cloud Native"),
            ("Ayesha Rasheed", "Mount Lavinia Fund", "EdTech,Learning,AI Tutors"),
            ("Lahiru Silva", "Galle Ventures", "IoT,Embedded,Automation"),
            ("Dilhara Perera", "Kandy Capital", "HealthTech,Medical Devices"),
            ("Sanjaya Fernando", "Jaffna Ventures", "Blockchain,Web3,Crypto"),
            ("Rashmi Jayawardena", "Negombo Fund", "Consumer,Mobile,Social"),
            ("Thilak Gunasekara", "Matara Capital", "Logistics,Supply Chain"),
            ("Shanika Wijeratne", "Anuradhapura Ventures", "SaaS,Analytics,BI"),
            ("Ashan Bandara", "Polonnaruwa Fund", "Robotics,Hardware"),
            ("Kalpana Sundaram", "Trinco Capital", "Data Science,Analytics,ML"),
            ("Mohamed Farouk", "Batticaloa Ventures", "FinTech,Payments,Blockchain"),
            ("Prasanna Wickramasekara", "Kurunegala Fund", "AgriTech,Food Tech"),
            ("Rangana Herath", "Ratnapura Capital", "AI,ML,Deep Learning"),
            ("Niluka Perera", "Badulla Fund", "HealthTech,Medical,BioTech")
        };

        var list = new List<User>();
        for (int i = 0; i < data.Length; i++)
        {
            var d = data[i];
            list.Add(new User
            {
                Id = $"usr_inv_v2_{i + 1:D2}",
                Role = "business",
                Name = d.Name,
                Email = $"investorv2_{i + 1}@uniyo.lk",
                Password = "1234",
                Company = d.Company,
                Industry = "Investment",
                Title = "Investment Partner",
                Bio = $"Invests in {d.Thesis.Replace(",", ", ")}.",
                Skills = d.Thesis,
                AvatarBase64 = MakeAvatar(i + 400),
                Verified = true,
                VerificationStatus = "verified",
                VerificationReason = "Seed data",
                CreatedAt = DateTime.UtcNow
            });
        }
        return list;
    }

    private static string MakeAvatar(int seed)
    {
        var hue = (seed * 37) % 360;
        var svg = $"<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='hsl({hue},60%,50%)'/></svg>";
        return $"data:image/svg+xml;utf8,{svg}";
    }
}
