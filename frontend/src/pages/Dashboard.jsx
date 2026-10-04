import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Zap,
  Calendar,
  Search,
  Flame,
  RefreshCw,
  AlertCircle,
  MapPin,
} from 'lucide-react';

import {
  getDashboard,
  getApplications,
  getTrackedApplications,
  saveOpportunityToTracker,
} from '../api/applypilot';
// ─────────────────────────────────────────────────────────────────────────────
// Metric cards
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard = ({
  icon: Icon,
  iconColor,
  label,
  primary,
  secondary,
  badge,
  badgeColor,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 28,
      delay,
    }}
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
          style={{
            background: `${badgeColor}12`,
            color: badgeColor,
          }}
        >
          {badge}
        </span>
      )}
    </div>

    <div>
      <p className="text-3xl font-black text-[var(--text-primary)] leading-none tabular-nums">
        {primary}
      </p>

      <p className="text-xs text-ap-gray-500 font-medium mt-1 leading-snug">
        {label}
      </p>

      {secondary && (
        <p className="text-[11px] text-ap-gray-400 mt-0.5">
          {secondary}
        </p>
      )}
    </div>
  </motion.div>
);

const MetricCardSkeleton = () => (
  <div
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] p-4 flex flex-col gap-3"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
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
        {[0, 1, 2, 3].map(index => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={TrendingUp}
        iconColor="#007AFF"
        label="Total Opportunities"
        primary={stats.totalPipeline.count}
        secondary="Opportunities in the connected dataset"
        badge="Local dataset"
        badgeColor="#007AFF"
        delay={0.05}
      />

      <MetricCard
        icon={CheckCircle2}
        iconColor="#34C759"
        label="Eligible Opportunities"
        primary={stats.eligibleOpportunities.count}
        secondary="Based on the configured demo profile"
        badge="Eligible"
        badgeColor="#34C759"
        delay={0.1}
      />

      <MetricCard
        icon={AlertTriangle}
        iconColor="#8E8E93"
        label="Application Tracking"
        primary="—"
        secondary="Application submission and tracking are not implemented"
        badge="Not available"
        badgeColor="#8E8E93"
        delay={0.15}
      />

      <MetricCard
        icon={XCircle}
        iconColor="#FF3B30"
        label="Not Eligible"
        primary={stats.excluded.count}
        secondary="Does not meet current eligibility criteria"
        badge="Ineligible"
        badgeColor="#FF3B30"
        delay={0.2}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Opportunity matching information
// ─────────────────────────────────────────────────────────────────────────────

const MatchingEnginePanel = ({ loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 28,
      delay: 0.25,
    }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] px-5 py-4"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-ap flex items-center justify-center bg-blue-500/10">
        <Zap className="w-4 h-4 text-ap-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[var(--text-primary)]">
          Opportunity Matching Engine
        </p>

        <p className="text-[11px] text-ap-gray-400 mt-1">
          {loading
            ? 'Loading eligibility and skill-match results...'
            : 'Eligibility, match scores, and priority are calculated by the backend using the configured demo profile.'}
        </p>
      </div>

      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-500/10 text-ap-gray-500 whitespace-nowrap">
        MVP Preview
      </span>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Opportunity table
// ─────────────────────────────────────────────────────────────────────────────

const STATUS = {
  Eligible: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'Not Eligible': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
};

const WORK_MODE = {
  Remote: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  Hybrid: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  'On-site': {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
  },
};

const matchStyle = score =>
  score >= 90
    ? 'bg-emerald-50 text-emerald-700'
    : score >= 75
      ? 'bg-blue-50 text-blue-700'
      : score >= 60
        ? 'bg-amber-50 text-amber-700'
        : 'bg-ap-gray-100 text-ap-gray-500';

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
  </div>
);

const TABS = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'eligible', label: 'Eligible', countKey: 'eligible' },
  {
    id: 'highPriority',
    label: 'High Priority',
    countKey: 'highPriority',
  },
];

const ApplicationTable = ({ applications, tabCounts, loading }) => {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState(new Set());
const [savingId, setSavingId] = useState(null);
const [saveMessage, setSaveMessage] = useState('');

useEffect(() => {
  let active = true;

  getTrackedApplications()
    .then((tracked) => {
      if (!active) return;

      setSavedIds(
        new Set(
          tracked
            .map((app) => app.opportunity?._id)
            .filter(Boolean)
            .map(String)
        )
      );
    })
    .catch((error) => {
      console.error('Could not load saved applications:', error);
    });

  return () => {
    active = false;
  };
}, []);

async function handleSave(item) {
  if (!/^[a-f\d]{24}$/i.test(item.id)) {
    setSaveMessage('This opportunity has no valid database ID.');
    return;
  }

  setSavingId(item.id);
  setSaveMessage('');

  try {
    await saveOpportunityToTracker(item.id);
    setSavedIds((current) => new Set([...current, item.id]));
    setSaveMessage(`${item.title} saved successfully.`);
  } catch (error) {
    setSaveMessage(error.message || 'Could not save this opportunity.');
  } finally {
    setSavingId(null);
  }
}

  const filtered = useMemo(() => {
    let list = applications;

    if (tab === 'eligible') {
      list = list.filter(item => item.status === 'Eligible');
    }

    if (tab === 'highPriority') {
      list = list.filter(item => item.priority === 'HIGH');
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      list = list.filter(item => {
        const title = (item.title || '').toLowerCase();
        const company = (item.company?.name || '').toLowerCase();

        return title.includes(query) || company.includes(query);
      });
    }

    return list;
  }, [applications, tab, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28,
        delay: 0.3,
      }}
      className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Table heading and search */}
      {saveMessage && (
  <p role="status" className="px-4 pt-3 text-xs text-[var(--text-primary)]">
    {saveMessage}
  </p>
)}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--separator)]">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Opportunity Matches
          </h2>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ap-gray-300 pointer-events-none" />

            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search role or company..."
              aria-label="Search opportunities by role or company"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-ap border border-[var(--separator)] bg-ap-gray-100 dark:bg-white/5 text-[var(--text-primary)] placeholder:text-ap-gray-300 focus:outline-none focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10 transition-all"
            />
          </div>
        </div>

        {/* Working filters */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-ap text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === item.id
                  ? 'bg-ap-blue text-white shadow-ap-sm'
                  : 'text-ap-gray-500 hover:bg-ap-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {item.label}

              {tabCounts && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab === item.id
                      ? 'bg-white/25 text-white'
                      : 'bg-ap-gray-200 dark:bg-white/10 text-ap-gray-500'
                  }`}
                >
                  {tabCounts[item.countKey] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity table */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--separator)] bg-ap-gray-50 dark:bg-white/[0.02]">
            {[
              { label: 'Company', width: 'w-40 flex-shrink-0' },
              { label: 'Role', width: 'flex-1' },
              {
                label: 'Compensation',
                width: 'w-28 flex-shrink-0 text-right hidden lg:block',
              },
              { label: 'Match', width: 'w-14 flex-shrink-0' },
              { label: 'Eligibility', width: 'w-36 flex-shrink-0' },
              { label: '', width: 'w-8 flex-shrink-0' },
            ].map((column, index) => (
              <div key={index} className={column.width}>
                <p className="text-[10px] font-bold text-ap-gray-400 uppercase tracking-wider">
                  {column.label}
                </p>
              </div>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-14 px-4 text-center">
              <p className="text-sm text-ap-gray-400">
                No opportunities match this filter.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((item, index) => {
                const statusStyle =
                  STATUS[item.status] || STATUS['Not Eligible'];

                const workModeStyle = WORK_MODE[item.workMode] || {
                  bg: 'bg-ap-gray-100',
                  text: 'text-ap-gray-500',
                };

                const detail = item.exclusionReason;
                const matchedSkills = item.matchedSkills || [];
                const missingSkills = item.missingSkills || [];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 28,
                      delay: index * 0.03,
                    }}
                    className="flex items-center gap-4 px-4 py-3 border-b border-[var(--separator)] last:border-none hover:bg-ap-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Company */}
                    <div className="flex items-center gap-3 w-40 flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-ap flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background: item.company.color }}
                      >
                        {item.company.initials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {item.company.name}
                        </p>

                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${workModeStyle.bg} ${workModeStyle.text}`}
                        >
                          {item.workMode}
                        </span>
                      </div>
                    </div>

                    {/* Role, location and skill comparison */}
                    <div className="flex-1 min-w-0">
                      {/^[a-f\d]{24}$/i.test(item.id) ? (
  <Link
    to={`/opportunities/${item.id}`}
    className="block text-xs font-semibold text-[var(--text-primary)] truncate hover:text-ap-blue"
  >
    {item.title}
  </Link>
) : (
  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
    {item.title}
  </p>
)}

                      <p className="text-[10px] text-ap-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>

                      {(matchedSkills.length > 0 ||
                        missingSkills.length > 0) && (
                        <p
                          className="text-[10px] text-ap-gray-400 mt-1 truncate"
                          title={[
                            matchedSkills.length
                              ? `Matched: ${matchedSkills.join(', ')}`
                              : '',
                            missingSkills.length
                              ? `Missing: ${missingSkills.join(', ')}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        >
                          {matchedSkills.length > 0
                            ? `Matched: ${matchedSkills.slice(0, 3).join(', ')}`
                            : 'No matched skills'}

                          {missingSkills.length > 0
                            ? ` · Missing: ${missingSkills.slice(0, 3).join(', ')}`
                            : ''}
                        </p>
                      )}
                    </div>

                    {/* Compensation */}
                    <div className="w-28 flex-shrink-0 text-right hidden lg:block">
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {item.compensation.base}
                      </p>

                      <p className="text-[10px] text-ap-gray-400">
                        {item.compensation.equity}
                      </p>
                    </div>

                    {/* Backend match score */}
                    <div className="w-14 flex-shrink-0">
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-ap tabular-nums ${matchStyle(item.matchScore)}`}
                      >
                        {item.matchScore}%
                      </span>
                    </div>

                    {/* Eligibility */}
                    <div className="w-36 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {item.status}
                      </span>

                      {detail && (
                        <p
                          className="text-[10px] text-ap-gray-400 mt-0.5 truncate"
                          title={detail}
                        >
                          {detail}
                        </p>
                      )}
                    </div>

                   {/* Priority and application tracking */}
<div className="w-28 flex-shrink-0 flex items-center justify-end gap-2">
  {item.priority === 'HIGH' && (
    <Flame
      className="w-3.5 h-3.5 text-orange-500"
      aria-label="High priority"
    />
  )}

  <button
    type="button"
    disabled={savingId === item.id || savedIds.has(item.id)}
    onClick={() => handleSave(item)}
    className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50"
  >
    {savedIds.has(item.id)
      ? 'Saved'
      : savingId === item.id
        ? 'Saving...'
        : 'Save'}
  </button>
</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Unimplemented integrations — transparently labelled
// ─────────────────────────────────────────────────────────────────────────────

const MilestonesPanel = ({ loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 28,
      delay: 0.35,
    }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-ap-blue" />

        <h3 className="text-xs font-bold text-[var(--text-primary)]">
          Milestones
        </h3>
      </div>

      <span className="text-[10px] text-ap-gray-400">
        MVP preview
      </span>
    </div>

    <div className="p-4">
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Calendar integration is not available yet.
          </p>

          <p className="text-[11px] text-ap-gray-400 mt-1">
            No scheduled milestones are connected to the demo.
          </p>
        </>
      )}
    </div>
  </motion.div>
);

const AuditFeedPanel = ({ loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 28,
      delay: 0.42,
    }}
    className="bg-[var(--bg-secondary)] rounded-ap-lg border border-[var(--separator)] overflow-hidden"
    style={{ boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-ap-blue" />

        <h3 className="text-xs font-bold text-[var(--text-primary)]">
          Activity &amp; Audit Log
        </h3>
      </div>

      <span className="text-[10px] text-ap-gray-400">
        MVP preview
      </span>
    </div>

    <div className="p-4">
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Activity logging is not implemented yet.
          </p>

          <p className="text-[11px] text-ap-gray-400 mt-1">
            This panel will display recorded events once an audit log is connected.
          </p>
        </>
      )}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard root
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    try {
      const [dashboard, opportunities] = await Promise.all([
        getDashboard(),
        getApplications(),
      ]);

      setDashData(dashboard);
      setApplications(opportunities);
      setError(null);
    } catch (err) {
      console.error('Failed to load ApplyPilot dashboard:', err);

      setError(
        'Unable to load dashboard data. Check that the backend is running and try again.'
      );
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

  useEffect(() => {
    void loadAll();
  }, []);

  return (
    <div className="p-5 lg:p-6 space-y-5 pb-24 md:pb-8">
      {/* Error and retry */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-ap-lg p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />

          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">
            {error}
          </p>

          <button
            type="button"
            onClick={retryLoad}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:opacity-70"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Metric cards */}
      <MetricCardsRow
        stats={dashData?.stats}
        loading={dashLoading}
      />

      {/* Matching engine */}
      <MatchingEnginePanel loading={dashLoading} />

      {/* Opportunity table and contextual panels */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full">
          <ApplicationTable
            applications={applications}
            tabCounts={dashData?.tabCounts}
            loading={appsLoading}
          />
        </div>

        <div className="flex flex-col gap-4 w-full xl:w-72 xl:flex-shrink-0">
          <MilestonesPanel loading={dashLoading} />
          <AuditFeedPanel loading={dashLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;