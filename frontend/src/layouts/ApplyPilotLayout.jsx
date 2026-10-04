import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Rss,
  Zap,
  BarChart2,
  Settings,
  Bell,
  Sun,
  Moon,
  Plus,
  Search,
  ChevronRight,
  X,
  Command,
} from 'lucide-react';
import useStore from '../store/useStore';

// ─── Navigation (PRD §3.1) ────────────────────────────────────────────────────
const NAV = [
  { path: '/',             label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { path: '/applications', label: 'Applications',     icon: Briefcase  },
  { path: '/match-feed',   label: 'Match Feed',       icon: Rss        },
  { path: '/auto-apply',   label: 'Auto-Apply Queue', icon: Zap        },
  { path: '/analytics',    label: 'Analytics',        icon: BarChart2  },
];

// macOS Sonoma traffic-light colors (PRD §3.1 Window control cues)
const TrafficLights = () => (
  <div className="flex items-center gap-1.5 flex-shrink-0 select-none group">
    <span className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10 group-hover:opacity-100 transition-opacity" />
    <span className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10 group-hover:opacity-100 transition-opacity" />
    <span className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10 group-hover:opacity-100 transition-opacity" />
  </div>
);

// ─── Layout ───────────────────────────────────────────────────────────────────
const ApplyPilotLayout = () => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const theme       = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const user        = useStore((s) => s.user);

  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen,   setCmdOpen]   = useState(false);

  const isActive = ({ path, exact }) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">

      {/* ── Command Bar (PRD §3.1 Top Command Bar) ──────────────── */}
      <header className="h-12 flex-shrink-0 flex items-center px-4 gap-3 bg-[var(--bg-secondary)] border-b border-[var(--separator)] z-40 select-none">

        {/* macOS dots + Brand */}
        <div className="flex items-center gap-3 min-w-[216px]">
          <TrafficLights />
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-ap-blue flex items-center justify-center flex-shrink-0 shadow-ap-glow-blue">
              <span className="text-white text-[10px] font-black tracking-tight">AP</span>
            </div>
            <span className="font-black text-sm text-[var(--text-primary)] tracking-tight">ApplyPilot</span>
          </Link>
        </div>

        {/* Campaign switcher (center) */}
        <div className="flex-1 flex items-center justify-center">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ap-gray-100 dark:bg-white/5 hover:bg-ap-gray-200 dark:hover:bg-white/10 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-ap-green animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Design Lead Search</span>
            <span className="text-[10px] font-medium text-ap-gray-500 border border-ap-gray-300 dark:border-ap-gray-700 rounded px-1.5 py-0.5">
              Active Campaign
            </span>
            <ChevronRight className="w-3 h-3 text-ap-gray-400" />
          </button>
        </div>

        {/* Right utilities */}
        <div className="flex items-center gap-2 min-w-[216px] justify-end">

          {/* ⌘K hint */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ap-gray-100 dark:bg-white/5 text-ap-gray-500 text-xs hover:bg-ap-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <Command className="w-3 h-3" />
            <span className="font-semibold">K</span>
            <span className="text-ap-gray-400 ml-1">Search anything...</span>
          </button>

          {/* + New Application */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/applications')}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Application</span>
          </motion.button>

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="w-8 h-8 rounded-lg bg-ap-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-ap-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={{   opacity: 0, scale: 0.95, y: -4  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="absolute right-0 top-10 w-72 bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] shadow-ap-xl z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Notifications</p>
                    <button onClick={() => setNotifOpen(false)}>
                      <X className="w-4 h-4 text-ap-gray-400" />
                    </button>
                  </div>
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-ap-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-ap-gray-500">No new notifications</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-ap-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-ap-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark'
              ? <Sun  className="w-4 h-4 text-ap-orange" />
              : <Moon className="w-4 h-4 text-ap-indigo" />}
          </button>

          {/* Avatar */}
          <button className="w-8 h-8 rounded-full bg-ap-blue flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'V'}
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (PRD §3.1 Persistent Left Workspace Sidebar) ── */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--separator)] overflow-y-auto">
          <div className="flex-1 px-3 py-5">
            <p className="text-[10px] font-bold text-ap-gray-400 uppercase tracking-widest px-2 mb-2">
              Workspace
            </p>
            <nav className="space-y-0.5">
              {NAV.map(({ path, label, icon: Icon, exact }) => {
                const active = isActive({ path, exact });
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-ap text-sm font-medium transition-all ${
                      active
                        ? 'bg-ap-blue text-white shadow-ap-sm'
                        : 'text-[var(--text-tertiary)] hover:bg-ap-gray-100 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Account + API Quota */}
          <div className="px-3 py-4 border-t border-[var(--separator)] space-y-3">
            <p className="text-[10px] font-bold text-ap-gray-400 uppercase tracking-widest px-2">
              Account
            </p>
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-ap text-sm font-medium text-[var(--text-tertiary)] hover:bg-ap-gray-100 dark:hover:bg-white/5 hover:text-[var(--text-primary)] transition-all"
            >
              <Settings className="w-4 h-4" strokeWidth={1.8} />
              Preferences
            </Link>

            {/* API Quota telemetry (PRD §3.1) */}
            <div className="px-2.5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ap-gray-500 font-medium">API Quota</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">84%</span>
              </div>
              <div className="h-1.5 bg-ap-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-ap-blue rounded-full" style={{ width: '84%' }} />
              </div>
              <p className="text-[10px] text-ap-gray-400">4,200 / 5,000 runs</p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── ⌘K Palette ──────────────────────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1,    y: 0   }}
              exit={{   opacity: 0, scale: 0.95, y: -10  }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-[var(--bg-secondary)] rounded-ap-xl border border-[var(--separator)] shadow-ap-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--separator)]">
                <Search className="w-4 h-4 text-ap-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search roles, companies, audit events..."
                  className="flex-1 text-sm bg-transparent text-[var(--text-primary)] outline-none placeholder:text-ap-gray-300"
                />
                <button
                  onClick={() => setCmdOpen(false)}
                  className="text-[10px] font-bold text-ap-gray-400 border border-ap-gray-300 dark:border-ap-gray-700 rounded px-1.5 py-0.5"
                >
                  ESC
                </button>
              </div>
              <div className="py-10 text-center">
                <p className="text-sm text-ap-gray-400">Start typing to search the pipeline...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] border-t border-[var(--separator)] pb-safe">
        <div className="grid grid-cols-5 h-14">
          {NAV.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive({ path, exact });
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-ap-blue' : 'text-ap-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[9px] font-medium truncate px-0.5">
                  {label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ApplyPilotLayout;
