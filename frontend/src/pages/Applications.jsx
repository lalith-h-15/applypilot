/**
 * Applications page — owned by teammate.
 * This is a placeholder. The teammate will build the full
 * Kanban / List view here.
 *
 * Data will come from: GET /api/applypilot/applications
 * (already available in src/api/applypilot.js → getApplications())
 */
const Applications = () => (
  <div className="p-6 space-y-4">
    <div>
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Applications</h1>
      <p className="text-sm text-ap-gray-500 mt-0.5">Kanban &amp; list view of all tracked applications</p>
    </div>

    <div className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] p-16 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="w-12 h-12 rounded-ap-lg bg-ap-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📋</span>
      </div>
      <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">Coming Soon</h2>
      <p className="text-sm text-ap-gray-400 max-w-xs mx-auto">
        This page is being built by your teammate. It will show the full
        Kanban board and list view for all tracked applications.
      </p>
      <p className="text-xs text-ap-gray-300 mt-4 font-mono">Route: /applications</p>
    </div>
  </div>
);

export default Applications;
