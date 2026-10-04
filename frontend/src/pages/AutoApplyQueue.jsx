
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getTrackedApplications,
  updateTrackedApplication,
} from '../api/applypilot';

export default function AutoApplyQueue() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setError('');
      setApplications(await getTrackedApplications());
    } catch (err) {
      setError(err.message || 'Could not load the review queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markApplied(app) {
    const confirmed = window.confirm(
      'Have you submitted this application through the employer’s process?'
    );

    if (!confirmed) return;

    try {
      setBusyId(app._id);
      setError('');
      setMessage('');

      const updated = await updateTrackedApplication(app._id, {
        status: 'Applied',
        notes: app.notes || '',
      });

      setApplications((current) =>
        current.map((item) =>
          item._id === app._id ? { ...item, ...updated } : item
        )
      );

      setMessage('Application status updated.');
    } catch (err) {
      setError(err.message || 'Could not update the application.');
    } finally {
      setBusyId(null);
    }
  }

  const queue = applications.filter((app) => app.status === 'Saved');
  const completed = applications.filter((app) => app.status !== 'Saved').length;

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          Application Review Queue
        </h1>
        <p className="mt-1 text-sm text-ap-gray-500">
          Review saved opportunities, prepare your materials, and track
          applications you submit yourself. Automatic submission is not enabled.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--separator)] p-4">
          <p className="text-sm text-ap-gray-500">Waiting for review</p>
          <p className="mt-2 text-3xl font-black">{queue.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--separator)] p-4">
          <p className="text-sm text-ap-gray-500">Already progressed</p>
          <p className="mt-2 text-3xl font-black">{completed}</p>
        </div>
        <div className="rounded-xl border border-[var(--separator)] p-4">
          <p className="text-sm text-ap-gray-500">Total tracked</p>
          <p className="mt-2 text-3xl font-black">{applications.length}</p>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
      {loading && <p className="text-sm text-ap-gray-500">Loading queue...</p>}

      {!loading && applications.length === 0 && (
        <div className="rounded-xl border border-[var(--separator)] p-8 text-center">
          <h2 className="font-bold">Your queue is empty</h2>
          <p className="mt-2 text-sm text-ap-gray-500">
            Save an opportunity from your dashboard or Match Feed first.
          </p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Browse opportunities
          </Link>
        </div>
      )}

      {!loading && queue.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Ready for your review</h2>

          {queue.map((app) => {
            const job = app.opportunity || {};

            return (
              <article
                key={app._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--separator)] p-5"
              >
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    {job.title || 'Opportunity unavailable'}
                  </h3>
                  <p className="mt-1 text-sm text-ap-gray-500">
                    {job.company || 'Unknown company'}
                  </p>
                  <p className="mt-2 text-xs text-ap-gray-500">
                    Check the employer's requirements, tailor your resume,
                    and submit through its official application process.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => markApplied(app)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busyId === app._id ? 'Updating...' : 'I submitted — mark Applied'}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}