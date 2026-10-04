
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getApplications,
  getTrackedApplications,
  saveOpportunityToTracker,
} from '../api/applypilot';

const isDatabaseId = (id) => /^[a-f\d]{24}$/i.test(String(id));

export default function MatchFeed() {
  const [opportunities, setOpportunities] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [matches, tracked] = await Promise.all([
          getApplications(),
          getTrackedApplications(),
        ]);

        if (!active) return;

        setOpportunities(matches);
        setSavedIds(
          new Set(
            tracked
              .map((app) => app.opportunity?._id)
              .filter(Boolean)
              .map(String)
          )
        );
      } catch (err) {
        if (active) setError(err.message || 'Could not load matches.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  async function save(item) {
    if (!isDatabaseId(item.id)) {
      setMessage('This opportunity does not have a valid database ID.');
      return;
    }

    try {
      setSavingId(item.id);
      setMessage('');
      await saveOpportunityToTracker(item.id);
      setSavedIds((current) => new Set([...current, item.id]));
      setMessage(`${item.title} saved to Applications.`);
    } catch (err) {
      setMessage(err.message || 'Could not save this opportunity.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          Match Feed
        </h1>
        <p className="mt-1 text-sm text-ap-gray-500">
          Opportunities ranked against your configured demo profile.
          These are backend matches, not a live scraped feed.
        </p>
      </header>

      {message && <p role="status" className="text-sm text-blue-600">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-ap-gray-500">Loading matches...</p>}

      {!loading && !error && opportunities.length === 0 && (
        <p className="rounded-xl border border-[var(--separator)] p-8 text-sm text-ap-gray-500">
          No matching opportunities were returned by the backend.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {opportunities.map((item) => {
          const realId = isDatabaseId(item.id);
          const saved = savedIds.has(item.id);

          return (
            <article
              key={item.id}
              className="space-y-4 rounded-xl border border-[var(--separator)] bg-[var(--bg-secondary)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-[var(--text-primary)]">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm text-ap-gray-500">
                    {item.company?.name || 'Unknown company'}
                  </p>
                  <p className="mt-1 text-xs text-ap-gray-400">
                    {item.location} · {item.workMode}
                  </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                  {item.matchScore}% match
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[var(--separator)] px-3 py-1">
                  {item.status}
                </span>
                <span className="rounded-full border border-[var(--separator)] px-3 py-1">
                  {item.priority} priority
                </span>
              </div>

              {item.matchedSkills?.length > 0 && (
                <p className="text-sm text-ap-gray-500">
                  <strong>Matched:</strong> {item.matchedSkills.join(', ')}
                </p>
              )}

              {item.missingSkills?.length > 0 && (
                <p className="text-sm text-ap-gray-500">
                  <strong>Skills to learn:</strong> {item.missingSkills.join(', ')}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {realId && (
                  <Link
                    to={`/opportunities/${item.id}`}
                    className="rounded-lg border border-[var(--separator)] px-4 py-2 text-sm font-semibold"
                  >
                    View details
                  </Link>
                )}

                <button
                  type="button"
                  disabled={!realId || saved || savingId === item.id}
                  onClick={() => save(item)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saved ? 'Saved' : savingId === item.id ? 'Saving...' : 'Save opportunity'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}