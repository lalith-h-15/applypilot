
const calculatePriority = (opportunity, matchScore) => {
  let priorityScore = 0;
  const reasons = [];

  // 1. Skill match: up to 60 points
  priorityScore += matchScore * 0.6;

  if (matchScore >= 70) {
    reasons.push("Strong skill match");
  } else if (matchScore >= 40) {
    reasons.push("Moderate skill match");
  } else {
    reasons.push("Low skill match");
  }

  // 2. Deadline urgency: up to 25 points
  if (opportunity.deadline) {
    const daysLeft = Math.ceil(
      (new Date(opportunity.deadline) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft >= 0 && daysLeft <= 3) {
      priorityScore += 25;
      reasons.push("Deadline within 3 days");
    } else if (daysLeft <= 7 && daysLeft >= 0) {
      priorityScore += 15;
      reasons.push("Deadline within 7 days");
    } else if (daysLeft > 7) {
      priorityScore += 5;
      reasons.push("Time available to apply");
    } else {
      reasons.push("Deadline has passed");
    }
  }

  // 3. Stipend: up to 15 points
  const stipendText = String(opportunity.stipend || "");
  const stipendAmount = Number(stipendText.replace(/[^\d]/g, ""));

  if (stipendAmount >= 20000) {
    priorityScore += 15;
    reasons.push("High stipend");
  } else if (stipendAmount > 0) {
    priorityScore += 8;
    reasons.push("Paid opportunity");
  }

  return {
    priorityScore: Math.round(priorityScore),
    priorityReasons: reasons,
  };
};

module.exports = { calculatePriority };