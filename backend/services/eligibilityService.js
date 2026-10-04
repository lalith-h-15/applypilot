const checkEligibility = (opportunity, student) => {
  const reasons = [];

  // Graduation year
  if (
    opportunity.eligibleGraduationYears.length > 0 &&
    !opportunity.eligibleGraduationYears.includes(student.graduationYear)
  ) {
    reasons.push("Graduation year not eligible");
  }

  // Branch
  if (
    opportunity.eligibleBranches.length > 0 &&
    !opportunity.eligibleBranches.includes(student.branch)
  ) {
    reasons.push("Branch not eligible");
  }

  // CGPA
  if (student.cgpa < opportunity.minimumCGPA) {
    reasons.push(`CGPA below minimum requirement of ${opportunity.minimumCGPA}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

module.exports = {
  checkEligibility,
};