const opportunities = [
  {
    title: "Full Stack Developer Intern",
    company: "TechNova",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 25000,
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-20"),
    description: "Build and maintain modern web applications."
  },

  {
    title: "Frontend Developer Intern",
    company: "PixelWorks",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 18000,
    requiredSkills: ["JavaScript", "React", "HTML", "CSS", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT", "ECE"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-18"),
    description: "Develop responsive interfaces using React."
  },

  {
    title: "Backend Developer Intern",
    company: "CloudCore",
    type: "Internship",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 22000,
    requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs", "Git"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-25"),
    description: "Work on backend APIs and database systems."
  },

  {
    title: "Software Engineer Intern",
    company: "CodeSphere",
    type: "Internship",
    location: "Hyderabad",
    workMode: "Hybrid",
    stipend: 30000,
    requiredSkills: ["Java", "Data Structures", "Algorithms", "Git", "SQL"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-11-01"),
    description: "Solve engineering problems and contribute to production systems."
  },

  {
    title: "AI/ML Intern",
    company: "NeuralEdge",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 28000,
    requiredSkills: ["Python", "Machine Learning", "Pandas", "NumPy", "Git"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT", "AI&ML"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-28"),
    description: "Assist with machine learning experiments and data pipelines."
  },

  {
    title: "React Developer Intern",
    company: "WebForge",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 15000,
    requiredSkills: ["React", "JavaScript", "CSS", "Git"],
    minimumCGPA: 6.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-15"),
    description: "Build reusable React components and frontend features."
  },

  {
    title: "Software Development Intern",
    company: "DevMatrix",
    type: "Internship",
    location: "Pune",
    workMode: "Hybrid",
    stipend: 20000,
    requiredSkills: ["JavaScript", "Node.js", "SQL", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-11-05"),
    description: "Develop software features across the product stack."
  },

  {
    title: "Web Developer Intern",
    company: "BrightApps",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 12000,
    requiredSkills: ["HTML", "CSS", "JavaScript", "Git"],
    minimumCGPA: 6,
    eligibleBranches: ["CSE", "ISE", "IT", "ECE"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-22"),
    description: "Create responsive websites and interactive web experiences."
  },

  {
    title: "Data Analyst Intern",
    company: "InsightLabs",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 20000,
    requiredSkills: ["Python", "SQL", "Excel", "Pandas"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT", "ECE"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-10-30"),
    description: "Analyze datasets and generate business insights."
  },

  {
    title: "Cloud Engineering Intern",
    company: "SkyStack",
    type: "Internship",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 25000,
    requiredSkills: ["AWS", "Docker", "Linux", "Git", "Networking"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-11-10"),
    description: "Learn and implement cloud infrastructure solutions."
  },

  {
    title: "DevOps Intern",
    company: "InfraWorks",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 22000,
    requiredSkills: ["Docker", "Linux", "Git", "CI/CD", "AWS"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-11-12"),
    description: "Assist with deployment automation and CI/CD pipelines."
  },

  {
    title: "Mobile App Developer Intern",
    company: "AppCraft",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 18000,
    requiredSkills: ["React Native", "JavaScript", "Git", "REST APIs"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-10-27"),
    description: "Develop cross-platform mobile applications."
  },

  {
    title: "Cybersecurity Intern",
    company: "SecureNet",
    type: "Internship",
    location: "Hyderabad",
    workMode: "On-site",
    stipend: 20000,
    requiredSkills: ["Networking", "Linux", "Cybersecurity", "Python"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-11-02"),
    description: "Assist with security analysis and vulnerability assessment."
  },

  {
    title: "NLP Research Intern",
    company: "LanguageAI",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 25000,
    requiredSkills: ["Python", "NLP", "Machine Learning", "PyTorch"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "AI&ML", "ISE"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-11-15"),
    description: "Research natural language processing models."
  },

  {
    title: "Generative AI Intern",
    company: "GenTech",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 30000,
    requiredSkills: ["Python", "LLMs", "APIs", "Git", "Machine Learning"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "AI&ML", "ISE"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-11-18"),
    description: "Build applications using modern generative AI systems."
  },

  {
    title: "Software Engineering Intern",
    company: "NextByte",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 26000,
    requiredSkills: ["C++", "Data Structures", "Algorithms", "Git"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "ISE"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-11-20"),
    description: "Solve algorithmic problems and build software systems."
  },

  {
    title: "Full Stack Engineering Intern",
    company: "StackLabs",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 24000,
    requiredSkills: ["React", "Node.js", "MongoDB", "Express", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-11-25"),
    description: "Work across frontend and backend systems."
  },

  {
    title: "Frontend Engineering Intern",
    company: "UIWorks",
    type: "Internship",
    location: "Chennai",
    workMode: "Hybrid",
    stipend: 16000,
    requiredSkills: ["React", "TypeScript", "CSS", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-11-28"),
    description: "Build modern user interfaces using React and TypeScript."
  },

  {
    title: "Backend Engineering Intern",
    company: "APIWorks",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 21000,
    requiredSkills: ["Node.js", "Express", "REST APIs", "MongoDB", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-12-01"),
    description: "Design and implement scalable backend APIs."
  },

  {
    title: "Cloud Developer Intern",
    company: "CloudNova",
    type: "Internship",
    location: "Pune",
    workMode: "Hybrid",
    stipend: 23000,
    requiredSkills: ["AWS", "Node.js", "Docker", "Git"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-03"),
    description: "Develop and deploy applications on cloud infrastructure."
  },

  {
    title: "Machine Learning Intern",
    company: "DataMind",
    type: "Internship",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 27000,
    requiredSkills: ["Python", "Machine Learning", "Scikit-learn", "Pandas"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "AI&ML", "ISE"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-05"),
    description: "Build and evaluate machine learning models."
  },

  {
    title: "Product Engineering Intern",
    company: "Buildly",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 25000,
    requiredSkills: ["JavaScript", "React", "Node.js", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-12-08"),
    description: "Contribute to product features from development to deployment."
  },

  {
    title: "Software Developer Intern",
    company: "LogicLabs",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 19000,
    requiredSkills: ["Java", "SQL", "Git", "Data Structures"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-10"),
    description: "Develop software modules and database-driven applications."
  },

  {
    title: "AI Engineering Intern",
    company: "CognitiveWorks",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 32000,
    requiredSkills: ["Python", "Machine Learning", "APIs", "Git"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "AI&ML"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-12"),
    description: "Build AI-powered software solutions."
  },

  {
    title: "Web Engineering Intern",
    company: "LaunchPad",
    type: "Internship",
    location: "Remote",
    workMode: "Remote",
    stipend: 14000,
    requiredSkills: ["JavaScript", "React", "HTML", "CSS", "Git"],
    minimumCGPA: 6.5,
    eligibleBranches: ["CSE", "ISE", "IT", "ECE"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-12-15"),
    description: "Build responsive web applications for startup products."
  },

  {
    title: "Data Science Intern",
    company: "AnalyticsHub",
    type: "Internship",
    location: "Mumbai",
    workMode: "Hybrid",
    stipend: 24000,
    requiredSkills: ["Python", "Pandas", "NumPy", "SQL", "Machine Learning"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT", "AI&ML"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-18"),
    description: "Analyze large datasets and build predictive models."
  },

  {
    title: "DevOps Engineering Intern",
    company: "DeployPro",
    type: "Internship",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 26000,
    requiredSkills: ["Docker", "Kubernetes", "Linux", "Git", "CI/CD"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2026-12-20"),
    description: "Automate deployment and infrastructure workflows."
  },

  {
    title: "Junior Software Engineer",
    company: "TechBridge",
    type: "Job",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 0,
    requiredSkills: ["JavaScript", "React", "Node.js", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2026-12-25"),
    description: "Entry-level software engineering position."
  },

  {
    title: "Associate Software Engineer",
    company: "EnterpriseSoft",
    type: "Job",
    location: "Hyderabad",
    workMode: "Hybrid",
    stipend: 0,
    requiredSkills: ["Java", "SQL", "Data Structures", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2026-12-28"),
    description: "Develop enterprise software applications."
  },

  {
    title: "Graduate Software Engineer",
    company: "InnovateX",
    type: "Job",
    location: "Pune",
    workMode: "Hybrid",
    stipend: 0,
    requiredSkills: ["Python", "SQL", "Git", "REST APIs"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2026-12-30"),
    description: "Build software solutions for business applications."
  },

  {
    title: "Frontend Engineer",
    company: "DesignTech",
    type: "Job",
    location: "Remote",
    workMode: "Remote",
    stipend: 0,
    requiredSkills: ["React", "TypeScript", "CSS", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-05"),
    description: "Build high-quality production frontend applications."
  },

  {
    title: "Backend Engineer",
    company: "ServerStack",
    type: "Job",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 0,
    requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs", "Docker"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-08"),
    description: "Develop scalable backend services."
  },

  {
    title: "Cloud Engineer Graduate",
    company: "CloudScale",
    type: "Job",
    location: "Bengaluru",
    workMode: "On-site",
    stipend: 0,
    requiredSkills: ["AWS", "Linux", "Docker", "Networking"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-10"),
    description: "Support cloud infrastructure and deployment systems."
  },

  {
    title: "AI Engineer Graduate",
    company: "AIVerse",
    type: "Job",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 0,
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Git"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "AI&ML"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-12"),
    description: "Develop machine learning powered applications."
  },

  {
    title: "Software Engineer Trainee",
    company: "CodeFirst",
    type: "Job",
    location: "Chennai",
    workMode: "On-site",
    stipend: 0,
    requiredSkills: ["C++", "Data Structures", "Algorithms", "SQL"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-15"),
    description: "Begin a software engineering career through structured training."
  },

  {
    title: "Full Stack Engineer",
    company: "ProductLabs",
    type: "Job",
    location: "Remote",
    workMode: "Remote",
    stipend: 0,
    requiredSkills: ["React", "Node.js", "MongoDB", "TypeScript", "Git"],
    minimumCGPA: 8,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027],
    deadline: new Date("2027-01-18"),
    description: "Build full-stack features for a SaaS platform."
  },

  {
    title: "Software Apprenticeship",
    company: "DigitalWorks",
    type: "Apprenticeship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 15000,
    requiredSkills: ["JavaScript", "Git", "HTML", "CSS"],
    minimumCGPA: 6.5,
    eligibleBranches: ["CSE", "ISE", "IT", "ECE"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-12-22"),
    description: "Six-month software development apprenticeship."
  },

  {
    title: "Cloud Apprenticeship",
    company: "InfraNext",
    type: "Apprenticeship",
    location: "Hyderabad",
    workMode: "On-site",
    stipend: 16000,
    requiredSkills: ["Linux", "AWS", "Networking", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2027-01-02"),
    description: "Practical cloud infrastructure apprenticeship."
  },

  {
    title: "Data Engineering Apprenticeship",
    company: "DataFlow",
    type: "Apprenticeship",
    location: "Pune",
    workMode: "Hybrid",
    stipend: 18000,
    requiredSkills: ["Python", "SQL", "Git", "ETL"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2027-01-07"),
    description: "Learn data engineering and pipeline development."
  },

  {
    title: "AI Engineering Apprenticeship",
    company: "SmartSystems",
    type: "Apprenticeship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 20000,
    requiredSkills: ["Python", "Machine Learning", "Pandas", "Git"],
    minimumCGPA: 7.5,
    eligibleBranches: ["CSE", "AI&ML", "ISE"],
    eligibleGraduationYears: [2027, 2028],
    deadline: new Date("2027-01-10"),
    description: "Hands-on apprenticeship in AI engineering."
  },

  {
    title: "Web Development Apprenticeship",
    company: "StartupForge",
    type: "Apprenticeship",
    location: "Remote",
    workMode: "Remote",
    stipend: 12000,
    requiredSkills: ["HTML", "CSS", "JavaScript", "React"],
    minimumCGPA: 6,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2027-01-15"),
    description: "Build real-world web applications with a startup team."
  },
  {
    title: "Mobile App Engineering Intern",
    company: "MobileLabs",
    type: "Internship",
    location: "Bengaluru",
    workMode: "Hybrid",
    stipend: 20000,
    requiredSkills: ["React Native", "JavaScript", "REST APIs", "Git"],
    minimumCGPA: 7,
    eligibleBranches: ["CSE", "ISE", "IT"],
    eligibleGraduationYears: [2027, 2028, 2029],
    deadline: new Date("2026-12-20"),
    description: "Build and improve cross-platform mobile applications."
  }
];

module.exports = opportunities;