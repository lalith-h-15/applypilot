import { mockOpportunity } from "./mock";

// Flip to false when the backend endpoint is live.
const USE_MOCK = true;
const BASE = import.meta.env.VITE_API_URL ?? "";

// Returns the opportunity, or null if it doesn't exist.
export async function getOpportunity(id) {
  if (USE_MOCK) return { ...mockOpportunity, id };
  const res = await fetch(`${BASE}/api/opportunities/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
