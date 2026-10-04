import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import ApplyPilotLayout from './layouts/ApplyPilotLayout';

// ── Pages ────────────────────────────────────────────────────────────────────
import Dashboard      from './pages/Dashboard';
import Applications   from './pages/Applications';
import MatchFeed      from './pages/MatchFeed';
import AutoApplyQueue from './pages/AutoApplyQueue';
import Analytics      from './pages/Analytics';

/**
 * App — root router for ApplyPilot.
 *
 * All routes share the ApplyPilotLayout shell (top command bar + sidebar).
 * Route ownership:
 *   /               → Dashboard (Executive Command Center)
 *   /applications   → Applications (Kanban + List — teammate's page)
 *   /match-feed     → Match Feed (Scraped recommendations — teammate's page)
 *   /auto-apply     → Auto-Apply Queue (Scheduler — teammate's page)
 *   /analytics      → Analytics (Funnel telemetry — teammate's page)
 */
const App = () => {
  const initTheme = useStore((s) => s.initTheme);

  // Restore saved theme on first load
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ApplyPilotLayout />}>
          <Route index                   element={<Dashboard />}      />
          <Route path="/applications"    element={<Applications />}   />
          <Route path="/match-feed"      element={<MatchFeed />}      />
          <Route path="/auto-apply"      element={<AutoApplyQueue />} />
          <Route path="/analytics"       element={<Analytics />}      />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
