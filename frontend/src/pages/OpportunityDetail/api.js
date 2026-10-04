import { mockOpportunity } from "./mock";

// Flip to false when the backend endpoint is live.
const USE_MOCK = true;
const BASE = import.meta.env.VITE_API_URL ?? "";

// Test-only variants, opened with /opportunities/unclear and /opportunities/blocked
const variants = {
  unclear: {
    eligibility: {
      status: "UNCLEAR",
      checks: [{ rule: "Final-year student", status: "UNCLEAR", quote: "final-year student" }],
    },
    matchScore: 50,
  },
  blocked: {
    eligibility: {
      status: "NOT_ELIGIBLE",
      checks: [{ rule: "Final-year student", status: "FAIL", quote: "final-year student" }],
    },
    matchScore: 20,
    canPrepare: false,
  },
};

// Returns the opportunity, or null if it doesn't exist.
export async function getOpportunity(id) {
  if (USE_MOCK) {
    if (id === "missing") return null;
    if (id === "error") throw new Error("Test error");
    return { ...mockOpportunity, ...variants[id], id };
  }
  const res = await fetch(`${BASE}/api/opportunities/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
