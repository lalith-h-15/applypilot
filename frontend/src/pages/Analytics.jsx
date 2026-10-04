
import { useEffect, useState } from 'react';
import {
  getDashboard,
  getApplications,
  getTrackedApplications,
} from '../api/applypilot';

const STAGES = ['Saved', 'Applied', 'Interview', 'Rejected', 'Offer'];

function Metric({ label, value, detail }) {
  return (
    <article className="rounded-xl border border-[var(--separator)] bg-[var(--bg-secondary)] p-5">
      <p className="text-sm text-ap-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-ap-gray-500">{detail}</p>}
    </article>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [dashboard, opportunities, tracked] = await Promise.all([
          getDashboard(),
          getApplications(),
          getTrackedApplications(),
        ]);

        if (active) {
          setData({ dashboard, opportunities, tracked });
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load analytics.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="p-6 text-sm text-ap-gray-500">Loading analytics...</main>;
  }

  if (error) {
    return <main className="p-6 text-sm text-red-500">{error}</main>;
  }

  const stats = data.dashboard.stats;
  const opportunities = data.opportunities;
  const tracked = data.tracked;

  const averageMatch = opportunities.length
    ? Math.round(
        opportunities.reduce((sum, item) => sum + (Number(item.matchScore) || 0), 0)
        / opportunities.length
      )
    : 0;

  const counts = Object.fromEntries(
    STAGES.map((status) => [
      status,
      tracked.filter((app) => app.status === status).length,
    ])
  );

  const maxCount = Math.max(1, ...STAGES.map((status) => counts[status]));

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-ap-gray-500">
          Metrics derived from your connected opportunity dataset and saved
          application tracker. The profile is currently configured demo data.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Opportunities in dataset"
          value={stats.totalPipeline.count}
          detail="Returned by the connected backend"
        />
        <Metric
          label="Eligible opportunities"
          value={stats.eligibleOpportunities.count}
          detail="Based on configured eligibility rules"
        />
        <Metric
          label="Tracked applications"
          value={tracked.length}
          detail="Saved to your application tracker"
        />
        <Metric
          label="Average match score"
          value={`${averageMatch}%`}
          detail={`${opportunities.length} matched results`}
        />
      </section>

      <section className="rounded-xl border border-[var(--separator)] bg-[var(--bg-secondary)] p-5">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Application stages
        </h2>
        <p className="mt-1 text-sm text-ap-gray-500">
          Counts reflect the current status stored for each tracked application.
        </p>

        <div className="mt-6 space-y-5">
          {STAGES.map((status) => (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[var(--text-primary)]">{status}</span>
                <strong>{counts[status]}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${(counts[status] / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-ap-gray-500">
        These are current record counts, not historical conversion rates.
        Historical trends require timestamped status-change events.
      </p>
    </main>
  );
}