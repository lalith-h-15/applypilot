import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, CheckCircle2, AlertTriangle, XCircle,
  ToggleLeft, ToggleRight, Pause, FileText, Zap,
  Calendar, Clock, Search, Flame,
  ArrowUpRight, RefreshCw, AlertCircle, MapPin,
} from 'lucide-react';
import { getDashboard, getApplications, togglePilot } from '../api/applypilot';

// ═════════════════════════════════════════════════════════════════════════════
// § 1  METRIC CARDS  (PRD §4.1 Executive Pipeline Intelligence)
// ═════════════════════════════════════════════════════════════════════════════

const MetricCard = ({ icon: Icon, iconColor, label, primary, secondary, badge, badgeColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] p-4 flex flex-col gap-3"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center justify-between">
      <div
        className="w-9 h-9 rounded-ap flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}15` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
      </div>
      {badge && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${badgeColor}12`, color: badgeColor }}
        >
          {badge}
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-black text-[var(--text-primary)] leading-none tabular-nums">{primary}</p>
      <p className="text-xs text-ap-gray-500 font-medium mt-1 leading-snug">{label}</p>
      {secondary && <p className="text-[11px] text-ap-gray-400 mt-0.5">{secondary}</p>}
    </div>
  </motion.div>
);

const MetricCardSkeleton = () => (
  <div className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] p-4 flex flex-col gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
    <div className="skeleton w-9 h-9 rounded-ap" />
    <div className="space-y-2">
      <div className="skeleton h-8 w-14 rounded" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  </div>
);

const MetricCardsRow = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <MetricCardSkeleton key={i} />)}
      </div>
    );
  }
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={TrendingUp}    iconColor="#007AFF"
        label="Total Pipeline"
        primary={stats.totalPipeline.count}
        secondary={`${stats.totalPipeline.weeklyDelta} · ${stats.totalPipeline.velocity}% velocity`}
        badge="↑ Active" badgeColor="#007AFF" delay={0.05}
      />
      <MetricCard
        icon={CheckCircle2}  iconColor="#34C759"
        label="Eligible & Approved"
        primary={stats.eligibleApproved.count}
        secondary={`${stats.eligibleApproved.sent} sent · ${stats.eligibleApproved.queued} queued`}
        badge="Approved" badgeColor="#34C759" delay={0.10}
      />
      <MetricCard
        icon={AlertTriangle} iconColor="#FF9500"
        label="Action Required"
        primary={stats.actionRequired.count}
        secondary="Needs manual review before dispatch"
        badge="Needs Input" badgeColor="#FF9500" delay={0.15}
      />
      <MetricCard
        icon={XCircle}       iconColor="#FF3B30"
        label="Excluded / Blocked"
        primary={stats.excluded.count}
        secondary="Filtered by autonomous screening rules"
        badge="Blocked" badgeColor="#FF3B30" delay={0.20}
      />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// § 2  PILOT ENGINE CONTROL STRIP  (PRD §4.2)
// ═════════════════════════════════════════════════════════════════════════════

const PilotEngineStrip = ({ pilot, loading, onToggle }) => {
  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] px-5 py-3.5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-5">
          <div className="skeleton w-12 h-7 rounded-full" />
          <div className="skeleton h-4 w-64 rounded" />
          <div className="flex-1 skeleton h-2 rounded-full" />
        </div>
      </div>
    );
  }
  if (!pilot) return null;

  const pct = Math.round((pilot.dailyQuota.used / pilot.dailyQuota.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.25 }}
      className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] px-5 py-3.5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-4 flex-wrap">

        {/* Master engine toggle */}
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-shrink-0 group"
        >
          {pilot.active
            ? <ToggleRight className="w-8 h-8 text-ap-green transition-transform group-hover:scale-105" />
            : <ToggleLeft  className="w-8 h-8 text-ap-gray-300 transition-transform group-hover:scale-105" />}
          <div>
            <p className={`text-[11px] font-black tracking-widest ${pilot.active ? 'text-ap-green' : 'text-ap-gray-400'}`}>
              AUTOPILOT {pilot.active ? 'ACTIVE' : 'PAUSED'}
            </p>
            <p className="text-[10px] text-ap-gray-400">Click to {pilot.active ? 'pause' : 'resume'}</p>
          </div>
        </button>

        <div className="hidden sm:block w-px h-8 bg-[var(--separator)]" />

        {/* Active targeting profile */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap className="w-3.5 h-3.5 text-ap-blue flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-ap-gray-400 font-medium uppercase tracking-wide">Active Profile</p>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{pilot.profile}</p>
          </div>
        </div>

        <div className="hidden lg:block w-px h-8 bg-[var(--separator)]" />

        {/* Daily quota bar */}
        <div className="flex-shrink-0">
          <p className="text-[10px] text-ap-gray-400 font-medium uppercase tracking-wide mb-1">Daily Quota</p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-ap-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-ap-blue rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
              {pilot.dailyQuota.used} / {pilot.dailyQuota.total}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <button className="btn-ghost">
            <Pause className="w-3 h-3" />
            Pause Queue
          </button>
          <button className="btn-ghost">
            <FileText className="w-3 h-3" />
            Logs
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// § 3  APPLICATION TABLE  (PRD §4.3)
// ═════════════════════════════════════════════════════════════════════════════

// Status badge display — maps backend status string to visual treatment
const STATUS = {
  'Eligible':            { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'Interview Scheduled': { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-800'     },
  'Submitted':           { bg: 'bg-teal-50 dark:bg-teal-900/20',       text: 'text-teal-700 dark:text-teal-400',       border: 'border-teal-200 dark:border-teal-800'     },
  'Needs Input':         { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800'   },
  'Not Eligible':        { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600 dark:text-red-400',         border: 'border-red-200 dark:border-red-800'       },
};

const WORK_MODE = {
  'Remote':  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Hybrid':  { bg: 'bg-violet-50',  text: 'text-violet-600'  },
  'On-site': { bg: 'bg-sky-50',     text: 'text-sky-600'     },
};

// Match score color — cosmetic only, value always from backend
const matchStyle = (s) =>
  s >= 90 ? 'bg-emerald-50 text-emerald-700' :
  s >= 75 ? 'bg-blue-50 text-blue-700' :
  s >= 60 ? 'bg-amber-50 text-amber-700' :
            'bg-ap-gray-100 text-ap-gray-500';

const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--separator)]">
    <div className="skeleton w-8 h-8 rounded-ap flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-2.5 w-1/5 rounded" />
    </div>
    <div className="skeleton h-3 w-24 rounded hidden lg:block" />
    <div className="skeleton h-6 w-10 rounded-lg" />
    <div className="skeleton h-5 w-24 rounded-full" />
    <div className="skeleton w-4 h-4 rounded" />
  </div>
);

const TABS = [
  { id: 'all',         label: 'All',          countKey: 'all'         },
  { id: 'eligible',    label: 'Eligible',     countKey: 'eligible'    },
  { id: 'needsInput',  label: 'Needs Input',  countKey: 'needsInput'  },
  { id: 'interviews',  label: 'Interviews',   countKey: 'interviews'  },
  { id: 'highPriority',label: 'High Priority',countKey: 'highPriority'},
];

const ApplicationTable = ({ applications, tabCounts, loading }) => {
  const [tab,    setTab]    = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = applications;
    if (tab === 'eligible')     list = list.filter(a => a.status === 'Eligible');
    if (tab === 'needsInput')   list = list.filter(a => a.status === 'Needs Input');
    if (tab === 'interviews')   list = list.filter(a => a.status === 'Interview Scheduled');
    if (tab === 'highPriority') list = list.filter(a => a.priority === 'HIGH');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) || a.company.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, tab, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.30 }}
      className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Table top bar */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--separator)]">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Candidate Pipeline</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ap-gray-300 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search role or company..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-ap border border-[var(--separator)] bg-ap-gray-100 dark:bg-white/5 text-[var(--text-primary)] placeholder:text-ap-gray-300 focus:outline-none focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10 transition-all"
            />
          </div>
        </div>

        {/* Segmented tabs (PRD §4.3) */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-ap text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t.id
                  ? 'bg-ap-blue text-white shadow-ap-sm'
                  : 'text-ap-gray-500 hover:bg-ap-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {t.label}
              {tabCounts && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.id
                    ? 'bg-white/25 text-white'
                    : 'bg-ap-gray-200 dark:bg-white/10 text-ap-gray-500'
                }`}>
                  {tabCounts[t.countKey] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--separator)] bg-ap-gray-50 dark:bg-white/[0.02]">
            {[
              { label: 'Company',     w: 'w-40 flex-shrink-0' },
              { label: 'Role',        w: 'flex-1' },
              { label: 'Comp',        w: 'w-28 flex-shrink-0 text-right hidden lg:block' },
              { label: 'Match',       w: 'w-14 flex-shrink-0' },
              { label: 'Status',      w: 'w-36 flex-shrink-0' },
              { label: '',            w: 'w-8 flex-shrink-0' },
            ].map((col, i) => (
              <div key={i} className={col.w}>
                <p className="text-[10px] font-bold text-ap-gray-400 uppercase tracking-wider">{col.label}</p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            : filtered.length === 0
              ? (
                <div className="py-14 text-center">
                  <p className="text-sm text-ap-gray-400">No applications match this filter.</p>
                </div>
              )
              : (
                <AnimatePresence>
                  {filtered.map((app, i) => {
                    const s  = STATUS[app.status]   ?? STATUS['Needs Input'];
                    const wm = WORK_MODE[app.workMode] ?? WORK_MODE['Remote'];
                    const detail = app.interviewDetail ?? app.inputReason ?? app.exclusionReason;

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.03 }}
                        className="flex items-center gap-4 px-4 py-3 border-b border-[var(--separator)] last:border-none hover:bg-ap-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-default group"
                      >
                        {/* Company */}
                        <div className="flex items-center gap-3 w-40 flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-ap flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                            style={{ background: app.company.color }}
                          >
                            {app.company.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{app.company.name}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${wm.bg} ${wm.text}`}>
                              {app.workMode}
                            </span>
                          </div>
                        </div>

                        {/* Role + location */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{app.title}</p>
                          <p className="text-[10px] text-ap-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{app.location}</span>
                          </p>
                        </div>

                        {/* Compensation */}
                        <div className="w-28 flex-shrink-0 text-right hidden lg:block">
                          <p className="text-xs font-bold text-[var(--text-primary)]">{app.compensation.base}</p>
                          <p className="text-[10px] text-ap-gray-400">{app.compensation.equity}</p>
                        </div>

                        {/* Match score */}
                        <div className="w-14 flex-shrink-0">
                          <span className={`text-xs font-black px-2 py-1 rounded-ap tabular-nums ${matchStyle(app.matchScore)}`}>
                            {app.matchScore}%
                          </span>
                        </div>

                        {/* Status */}
                        <div className="w-36 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                            {app.status}
                          </span>
                          {detail && (
                            <p className="text-[10px] text-ap-gray-400 mt-0.5 truncate">{detail}</p>
                          )}
                          {app.atsTarget && (
                            <p className="text-[10px] text-ap-gray-400 mt-0.5">via {app.atsTarget}</p>
                          )}
                        </div>

                        {/* Priority flame + arrow */}
                        <div className="w-8 flex-shrink-0 flex items-center justify-center gap-1">
                          {app.priority === 'HIGH' && (
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                          )}
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-3.5 h-3.5 text-ap-gray-400 hover:text-ap-blue" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )
          }
        </div>
      </div>
    </motion.div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// § 4  RIGHT CONTEXTUAL DRAWER  (PRD §4.4)
// ═════════════════════════════════════════════════════════════════════════════

const AUDIT_COLORS = {
  submitted: '#34C759',
  scraped:   '#007AFF',
  flagged:   '#FF9500',
  filtered:  '#8E8E93',
};

const MilestonesPanel = ({ milestones, loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.35 }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-ap-blue" />
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Upcoming Milestones</h3>
      </div>
      <button className="text-[10px] font-semibold text-ap-blue hover:opacity-70 transition-opacity">
        Sync Calendar →
      </button>
    </div>

    <div className="divide-y divide-[var(--separator)]">
      {loading
        ? [0,1,2].map(i => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="skeleton w-10 h-10 rounded-ap flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))
        : milestones?.map(m => (
            <div
              key={m.id}
              className="flex items-start gap-3 p-3 hover:bg-ap-gray-50 dark:hover:bg-white/[0.02] transition-colors group cursor-default"
            >
              {/* Date badge */}
              <div className="w-10 h-10 rounded-ap flex flex-col items-center justify-center flex-shrink-0 border border-[var(--separator)] bg-ap-gray-50 dark:bg-white/5">
                <span className="text-[8px] font-bold text-ap-gray-400 uppercase">{m.date.split(' ')[0]}</span>
                <span className="text-sm font-black text-[var(--text-primary)] leading-none">{m.date.split(' ')[1]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: m.companyColor }} />
                  <p className="text-[10px] font-bold text-ap-gray-400">{m.company}</p>
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{m.title}</p>
                <p className="text-[10px] text-ap-gray-400 mt-0.5 truncate">{m.host}</p>
                <p className="text-[10px] font-semibold text-ap-blue flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5" />
                  {m.time}
                </p>
              </div>

              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-ap bg-ap-blue flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
    </div>
  </motion.div>
);

const AuditFeedPanel = ({ feed, velocity, loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.42 }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-ap-green animate-pulse flex-shrink-0" />
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Live Audit Feed</h3>
      </div>
      <button className="text-[10px] font-semibold text-ap-blue hover:opacity-70 transition-opacity">
        View all logs →
      </button>
    </div>

    <div className="divide-y divide-[var(--separator)]">
      {loading
        ? [0,1,2,3].map(i => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
              <div className="skeleton w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-2.5 w-full rounded" />
                <div className="skeleton h-2 w-1/4 rounded" />
              </div>
            </div>
          ))
        : feed?.map(event => (
            <div key={event.id} className="flex items-start gap-2.5 px-4 py-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: AUDIT_COLORS[event.type] ?? '#8E8E93' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[var(--text-primary)] font-medium leading-snug">{event.text}</p>
                <p className="text-[10px] text-ap-gray-400 mt-0.5">{event.time}</p>
              </div>
            </div>
          ))}
    </div>

    {/* Weekly Dispatch Velocity */}
    {velocity && (
      <div className="px-4 py-3 border-t border-[var(--separator)] bg-ap-gray-50 dark:bg-white/[0.02]">
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] font-bold text-ap-gray-400 uppercase tracking-wide">Weekly Dispatch</p>
          <span className="text-[10px] font-bold text-[var(--text-primary)] tabular-nums">
            {velocity.dispatched} / {velocity.cap}
          </span>
        </div>
        <div className="h-1.5 bg-ap-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-ap-green rounded-full"
            style={{ width: `${Math.round((velocity.dispatched / velocity.cap) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-ap-gray-400 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-ap-green inline-block" />
          Safe cadence active · anti-bot pacing ON
        </p>
      </div>
    )}
  </motion.div>
);

// ═════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═════════════════════════════════════════════════════════════════════════════

const Dashboard = () => {
  const [dashData,     setDashData]     = useState(null);
  const [applications, setApplications] = useState([]);
  const [dashLoading,  setDashLoading]  = useState(true);
  const [appsLoading,  setAppsLoading]  = useState(true);
  const [error,        setError]        = useState(null);
  const [pilotActive,  setPilotActive]  = useState(true);

  const loadAll = async () => {
    try {
      const [dash, apps] = await Promise.all([getDashboard(), getApplications()]);
      setDashData(dash);
      setPilotActive(dash.pilot.active);
      setApplications(apps);
      setError(null);
    } catch {
      setError('Unable to load dashboard. Please try again.');
    } finally {
      setDashLoading(false);
      setAppsLoading(false);
    }
  };

  const retryLoad = () => {
    setDashLoading(true);
    setAppsLoading(true);
    setError(null);
    void loadAll();
  };

  useEffect(() => { void loadAll(); }, []);

  const handleTogglePilot = async () => {
    const next = !pilotActive;
    setPilotActive(next);               // optimistic
    try { await togglePilot(next); }
    catch { setPilotActive(!next); }   // revert on error
  };

  return (
    <div className="p-5 lg:p-6 space-y-5 pb-24 md:pb-8">

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-ap-lg p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">{error}</p>
          <button
            onClick={retryLoad}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:opacity-70"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* § 1 — Metric Cards */}
      <MetricCardsRow stats={dashData?.stats} loading={dashLoading} />

      {/* § 2 — Pilot Engine Strip */}
      <PilotEngineStrip
        pilot={dashData ? { ...dashData.pilot, active: pilotActive } : null}
        loading={dashLoading}
        onToggle={handleTogglePilot}
      />

      {/* § 3 + 4 — Table + Right Drawer */}
      <div className="flex gap-5 items-start">

        {/* Application Table (flex-1) */}
        <div className="flex-1 min-w-0">
          <ApplicationTable
            applications={applications}
            tabCounts={dashData?.tabCounts}
            loading={appsLoading}
          />
        </div>

        {/* Right Contextual Drawer — shown beside table on xl screens */}
        <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
          <MilestonesPanel milestones={dashData?.milestones} loading={dashLoading} />
          <AuditFeedPanel  feed={dashData?.auditFeed} velocity={dashData?.weeklyVelocity} loading={dashLoading} />
        </div>
      </div>

      {/* Drawer stacked below on smaller screens */}
      <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        <MilestonesPanel milestones={dashData?.milestones} loading={dashLoading} />
        <AuditFeedPanel  feed={dashData?.auditFeed} velocity={dashData?.weeklyVelocity} loading={dashLoading} />
      </div>

    </div>
  );
};

export default Dashboard;
