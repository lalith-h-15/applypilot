// Fake data in the proposed API shape. Delete once the backend endpoint is ready.
export const mockOpportunity = {
  id: "demo",
  title: "Frontend Developer Intern",
  company: "Acme Labs",
  priority: "HIGH",
  jdText:
    "We're looking for a Frontend Developer Intern to join our product team.\n\n" +
    "Required: JavaScript, React\n" +
    "Preferred: TypeScript, Docker\n\n" +
    "You must be a final-year student in Computer Science or a related field. " +
    "The internship lasts 3 months and is fully remote.",
  eligibility: {
    status: "ELIGIBLE",
    checks: [
      {
        rule: "Final-year student",
        status: "PASS",
        quote: "You must be a final-year student in Computer Science or a related field.",
      },
      { rule: "Remote friendly", status: "PASS", quote: "fully remote" },
    ],
  },
  matchScore: 66.7,
  skills: [
    { name: "JavaScript", type: "required", matched: true, quote: "Required: JavaScript, React" },
    { name: "React", type: "required", matched: true, quote: "Required: JavaScript, React" },
    { name: "TypeScript", type: "preferred", matched: false, quote: "Preferred: TypeScript, Docker" },
    { name: "Docker", type: "preferred", matched: false, quote: "Preferred: TypeScript, Docker" },
  ],
  verified: true,
  canPrepare: true,
};
