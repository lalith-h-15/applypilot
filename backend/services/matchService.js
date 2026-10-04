const calculateMatch = (opportunity, student) => {
  const requiredSkills = opportunity.requiredSkills || [];

  const studentSkills = (student.skills || []).map((skill) =>
    skill.trim().toLowerCase()
  );

  const matchedSkills = requiredSkills.filter((skill) =>
    studentSkills.includes(skill.trim().toLowerCase())
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !studentSkills.includes(skill.trim().toLowerCase())
  );

  const matchScore =
    requiredSkills.length === 0
      ? 100
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    totalRequiredSkills: requiredSkills.length,
  };
};

module.exports = { calculateMatch };