/**
 * Auto-Apply Queue page — owned by teammate.
 * Will display the autonomous dispatch scheduler and staged applications.
 *
 * Data will come from: GET /api/applypilot/auto-apply/queue
 */
const AutoApplyQueue = () => (
  <div className="p-6 space-y-4">
    <div>
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Auto-Apply Queue</h1>
      <p className="text-sm text-ap-gray-500 mt-0.5">Staging area and dispatch scheduler for autonomous submissions</p>
    </div>

    <div className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] p-16 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="w-12 h-12 rounded-ap-lg bg-ap-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚡</span>
      </div>
      <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">Coming Soon</h2>
      <p className="text-sm text-ap-gray-400 max-w-xs mx-auto">
        Your teammate is building the Auto-Apply Queue — the staging area
        where applications wait before autonomous dispatch.
      </p>
      <p className="text-xs text-ap-gray-300 mt-4 font-mono">Route: /auto-apply</p>
    </div>
  </div>
);

export default AutoApplyQueue;
