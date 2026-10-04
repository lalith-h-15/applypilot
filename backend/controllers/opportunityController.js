
const Opportunity = require("../models/Opportunity");
const { checkEligibility } = require("../services/eligibilityService");
const { calculateMatch } = require("../services/matchService");
const { calculatePriority } = require("../services/priorityService");

const getEligibleOpportunities = async (req, res) => {
  try {
    const student = {
      graduationYear: Number(req.query.graduationYear),
      branch: req.query.branch,
      cgpa: Number(req.query.cgpa),
      skills: req.query.skills
        ? req.query.skills.split(",")
        : [],
    };

    const opportunities = await Opportunity.find();

    const results = opportunities.map((opportunity) => {
      const eligibility = checkEligibility(opportunity, student);
      const match = calculateMatch(opportunity, student);
      const priority = calculatePriority(opportunity, match.matchScore);

      return {
        opportunity,
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        totalRequiredSkills: match.totalRequiredSkills,
        priorityScore: priority.priorityScore,
        priorityReasons: priority.priorityReasons,
      };
    });

    const eligible = results.filter((item) => item.eligible);
    eligible.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({
      success: true,
      totalOpportunities: opportunities.length,
      eligibleCount: eligible.length,
      eligibleOpportunities: eligible,
        opportunities: results,
    });
  } catch (error) {
    console.error("Eligibility check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to check eligibility",
    });
  }
};

module.exports = {
  getEligibleOpportunities,
};