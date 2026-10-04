/**
 * applypilot.js — ApplyPilot API data access.
 *
 * Opportunity eligibility, matching and priority come from the backend.
 * This file does not fabricate applications, interviews or activity logs.
 *
 * Current limitation:
 * The student profile below is a configured demo profile, not a
 * profile loaded dynamically from a user's account.
 */

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STUDENT_PROFILE = {
  graduationYear: '2029',
  branch: 'CSE',
  cgpa: '9.2',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
};

const STUDENT_QUERY = new URLSearchParams({
  graduationYear: STUDENT_PROFILE.graduationYear,
  branch: STUDENT_PROFILE.branch,
  cgpa: STUDENT_PROFILE.cgpa,
  skills: STUDENT_PROFILE.skills.join(','),
}).toString();

const COMPANY_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#EA580C',
  '#DB2777',
  '#0891B2',
];

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('ap_token');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;

    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // Keep the HTTP status message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Fetch eligibility and matching results from the backend.
 */
async function fetchOpportunityResults() {
  const data = await apiFetch(
    `/api/opportunities/eligible?${STUDENT_QUERY}`
  );

  if (!data || data.success !== true) {
    throw new Error(
      data?.message || 'Unable to load opportunity results.'
    );
  }

  return data;
}

/**
 * Read the complete result list returned by the backend.
 * The current API returns all results in `opportunities`.
 */
function getResultsList(data) {
  if (Array.isArray(data.opportunities)) {
    return data.opportunities;
  }

  if (Array.isArray(data.eligibleOpportunities)) {
    return data.eligibleOpportunities;
  }

  return [];
}

function getEligibleCount(data, results) {
  if (Number.isFinite(data.eligibleCount)) {
    return data.eligibleCount;
  }

  return results.filter(result => result.eligible).length;
}

function getCompanyName(opportunity) {
  return (
    opportunity.company ||
    opportunity.companyName ||
    'Unknown company'
  );
}

/**
 * Convert one backend result into the shape expected by the UI.
 */
function mapOpportunityResult(result, index) {
  const opportunity = result.opportunity || {};
  const companyName = getCompanyName(opportunity);

  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  const stipend = Number(opportunity.stipend);
  const hasStipend = Number.isFinite(stipend) && stipend > 0;
  const eligible = result.eligible === true;

  const reasons = Array.isArray(result.reasons)
    ? result.reasons.filter(reason => typeof reason === 'string')
    : [];

  return {
    id: String(opportunity._id || `opportunity-${index}`),

    title: opportunity.title || 'Untitled opportunity',

    company: {
      name: companyName,
      initials: initials || 'UC',
      color: COMPANY_COLORS[index % COMPANY_COLORS.length],
    },

    location: opportunity.location || 'Location not specified',

    // Missing work-mode information must not be presented as Remote.
    workMode: opportunity.workMode || 'Not specified',

    compensation: {
      base: hasStipend
        ? new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(stipend)
        : 'Not listed',

      equity: hasStipend
        ? 'Listed stipend'
        : 'Compensation not listed',
    },

    matchScore: Number.isFinite(Number(result.matchScore))
      ? Number(result.matchScore)
      : 0,

    status: eligible ? 'Eligible' : 'Not Eligible',

    priority:
      Number(result.priorityScore) >= 70
        ? 'HIGH'
        : Number(result.priorityScore) >= 40
          ? 'MEDIUM'
          : 'LOW',

    matchedSkills: Array.isArray(result.matchedSkills)
      ? result.matchedSkills
      : [],

    missingSkills: Array.isArray(result.missingSkills)
      ? result.missingSkills
      : [],

    exclusionReason: !eligible
      ? (
          reasons.length
            ? reasons.join(' · ')
            : 'Does not meet current eligibility criteria'
        )
      : undefined,
  };
}

/**
 * Dashboard statistics derived from the backend response.
 *
 * These are opportunity counts, not application submissions.
 */
export const getDashboard = async () => {
  const data = await fetchOpportunityResults();
  const results = getResultsList(data);

  const totalCount = Number.isFinite(data.totalOpportunities)
    ? data.totalOpportunities
    : results.length;

  const eligibleCount = getEligibleCount(data, results);

  const excludedCount = Math.max(0, totalCount - eligibleCount);

  const highPriorityCount = results.filter(
    result => Number(result.priorityScore) >= 70
  ).length;

  const eligibleRate = totalCount > 0
    ? Math.round((eligibleCount / totalCount) * 100)
    : 0;

  return {
    stats: {
      totalPipeline: {
        count: totalCount,
        velocity: eligibleRate,
      },

      // Accurate name: these are eligible opportunities,
      // not approved applications.
      eligibleOpportunities: {
        count: eligibleCount,
      },

      excluded: {
        count: excludedCount,
      },
    },

    tabCounts: {
      all: results.length,
      eligible: results.filter(result => result.eligible).length,
      highPriority: highPriorityCount,
    },
  };
};

/**
 * Return opportunity-matching results for the existing table.
 * This does not mean applications have been submitted.
 */
export const getApplications = async () => {
  const data = await fetchOpportunityResults();
  const results = getResultsList(data);

  return results.map(mapOpportunityResult);
};