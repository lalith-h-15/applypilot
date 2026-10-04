import { useEffect, useState } from "react";
import {
  getTrackedApplications,
  updateTrackedApplication,
  deleteTrackedApplication,
} from "../api/applypilot";

const STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Rejected",
  "Offer",
];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await getTrackedApplications();
      setApplications(data);

      setNotes(
        Object.fromEntries(
          data.map((app) => [app._id, app.notes || ""])
        )
      );
    } catch (err) {
      setError(err.message || "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function updateApplication(app, changes) {
    try {
      setBusyId(app._id);
      setError("");

      const updated = await updateTrackedApplication(app._id, {
        status: changes.status ?? app.status,
        notes: changes.notes ?? notes[app._id] ?? app.notes ?? "",
      });

      setApplications((current) =>
        current.map((item) =>
          item._id === app._id
            ? { ...item, ...updated, opportunity: item.opportunity }
            : item
        )
      );

      setNotes((current) => ({
        ...current,
        [app._id]: updated.notes ?? changes.notes ?? current[app._id] ?? "",
      }));
    } catch (err) {
      setError(err.message || "Could not update application.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeApplication(app) {
    if (!window.confirm("Remove this application from your tracker?")) {
      return;
    }

    try {
      setBusyId(app._id);
      setError("");

      await deleteTrackedApplication(app._id);

      setApplications((current) =>
        current.filter((item) => item._id !== app._id)
      );
    } catch (err) {
      setError(err.message || "Could not remove application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          Applications
        </h1>
        <p className="mt-1 text-sm text-ap-gray-500">
          Track your saved opportunities and application progress.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-300 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ap-gray-500">Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="rounded-ap-lg border border-[var(--separator)] p-10 text-center">
          <h2 className="font-bold text-[var(--text-primary)]">
            No tracked applications yet
          </h2>
          <p className="mt-2 text-sm text-ap-gray-500">
            Save an opportunity from the dashboard to start tracking it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.opportunity || {};
            const busy = busyId === app._id;

            return (
              <article
                key={app._id}
                className="space-y-4 rounded-ap-lg border border-[var(--separator)] bg-[var(--bg-secondary)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-[var(--text-primary)]">
                      {job.title || "Opportunity unavailable"}
                    </h2>
                    <p className="mt-1 text-sm text-ap-gray-500">
                      {job.company || "Unknown company"}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>

                  <select
                    aria-label={`Status for ${job.title || "application"}`}
                    value={app.status}
                    disabled={busy}
                    onChange={(event) =>
                      updateApplication(app, {
                        status: event.target.value,
                      })
                    }
                    className="rounded-lg border border-[var(--separator)] bg-transparent p-2 text-sm"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`notes-${app._id}`}
                    className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Notes
                  </label>

                  <textarea
                    id={`notes-${app._id}`}
                    rows={2}
                    maxLength={2000}
                    value={notes[app._id] ?? app.notes ?? ""}
                    disabled={busy}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [app._id]: event.target.value,
                      }))
                    }
                    placeholder="Interview date, follow-up, preparation notes..."
                    className="w-full rounded-lg border border-[var(--separator)] bg-transparent p-3 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={busy}
                    onClick={() =>
                      updateApplication(app, {
                        notes: notes[app._id] ?? app.notes ?? "",
                      })
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Save notes"}
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => removeApplication(app)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}