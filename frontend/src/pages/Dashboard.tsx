import { useState, useMemo, useCallback } from 'react';
import {
  useStatsSummary,
  useEquityCurve,
  useStatsByStrategy,
  useStatsBySymbol,
  useCalendar,
  useStreaks,
} from '../hooks/useStats';
import { useStrategies } from '../hooks/useStrategies';
import StatsCards from '../components/StatsCards/StatsCards';
import {
  EquityCurve,
  WinLossBar,
  CalendarHeatmap,
  DistributionChart,
} from '../components/Charts';
import styles from './Dashboard.module.scss';

interface Filters {
  from?: string;
  to?: string;
  symbol?: string;
  strategy_id?: string;
}

function Dashboard() {
  const [filters, setFilters] = useState<Filters>({});

  const queryFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.from) f.from = filters.from;
    if (filters.to) f.to = filters.to;
    if (filters.symbol) f.symbol = filters.symbol;
    if (filters.strategy_id) f.strategy_id = filters.strategy_id;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [filters]);

  const { data: summary, isLoading: summaryLoading } = useStatsSummary(queryFilters);
  const { data: equityCurve, isLoading: equityLoading } = useEquityCurve(queryFilters);
  const { data: strategyData, isLoading: strategyLoading } = useStatsByStrategy(queryFilters);
  const { data: symbolData, isLoading: symbolLoading } = useStatsBySymbol(queryFilters);
  const { data: calendarData, isLoading: calendarLoading } = useCalendar(queryFilters);
  const { data: streaks, isLoading: streaksLoading } = useStreaks(queryFilters);
  const { data: strategies } = useStrategies();

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value || undefined,
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const isAllLoaded = !summaryLoading && !equityLoading;
  const hasNoTrades = isAllLoaded && summary && summary.total_trades === 0;
  const hasFilters = !!(filters.from || filters.to || filters.symbol || filters.strategy_id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Performance overview and analytics</p>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From</label>
          <input
            type="date"
            className={styles.filterInput}
            value={filters.from || ''}
            onChange={(e) => handleFilterChange('from', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To</label>
          <input
            type="date"
            className={styles.filterInput}
            value={filters.to || ''}
            onChange={(e) => handleFilterChange('to', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Symbol</label>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="e.g. ES, NQ"
            value={filters.symbol || ''}
            onChange={(e) => handleFilterChange('symbol', e.target.value.toUpperCase())}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Strategy</label>
          <select
            className={styles.filterSelect}
            value={filters.strategy_id ?? ''}
            onChange={(e) =>
              handleFilterChange(
                'strategy_id',
                e.target.value || undefined,
              )
            }
          >
            <option value="">All Strategies</option>
            {strategies?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterActions}>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {hasNoTrades && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#x1F4C8;</div>
          <div className={styles.emptyTitle}>No trades yet</div>
          <div className={styles.emptyText}>
            Start logging your trades to see performance analytics, equity curves,
            and detailed statistics on this dashboard.
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!hasNoTrades && (
        <>
          <StatsCards data={summary} isLoading={summaryLoading} />

          {/* Streaks */}
          {streaks && !streaksLoading && (
            <div className={styles.streaksRow}>
              <div className={styles.streakBadge}>
                <span className={styles.streakLabel}>Current Streak:</span>
                <span
                  className={`${styles.streakValue} ${
                    streaks.current_streak_type === 'WIN'
                      ? styles.streakWin
                      : streaks.current_streak_type === 'LOSS'
                        ? styles.streakLoss
                        : ''
                  }`}
                >
                  {streaks.current_streak_count}{' '}
                  {streaks.current_streak_type === 'WIN'
                    ? 'wins'
                    : streaks.current_streak_type === 'LOSS'
                      ? 'losses'
                      : '--'}
                </span>
              </div>
              <div className={styles.streakBadge}>
                <span className={styles.streakLabel}>Best Win Streak:</span>
                <span className={`${styles.streakValue} ${styles.streakWin}`}>
                  {streaks.max_win_streak}
                </span>
              </div>
              <div className={styles.streakBadge}>
                <span className={styles.streakLabel}>Worst Loss Streak:</span>
                <span className={`${styles.streakValue} ${styles.streakLoss}`}>
                  {streaks.max_loss_streak}
                </span>
              </div>
            </div>
          )}

          {/* Charts Row 1: Equity Curve + Win/Loss Breakdown */}
          <div className={styles.chartRow}>
            <EquityCurve data={equityCurve} isLoading={equityLoading} />
            <WinLossBar
              strategyData={strategyData}
              symbolData={symbolData}
              isLoading={strategyLoading || symbolLoading}
            />
          </div>

          {/* Charts Row 2: Calendar Heatmap + Distribution */}
          <div className={styles.chartRow}>
            <CalendarHeatmap data={calendarData} isLoading={calendarLoading} />
            <DistributionChart equityCurveData={equityCurve} isLoading={equityLoading} />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
