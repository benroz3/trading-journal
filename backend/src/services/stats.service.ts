import { query } from '../config/database';
import {
  StatFilters, TradeSummary, StrategyStats, SymbolStats,
  SessionStats, DayOfWeekStats, EquityCurvePoint, CalendarEntry, StreakStats,
} from '../types';

function buildWhereClause(filters: StatFilters): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.from) {
    conditions.push(`t.trade_date >= $${idx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`t.trade_date <= $${idx++}`);
    params.push(filters.to);
  }
  if (filters.strategy_id) {
    conditions.push(`t.strategy_id = $${idx++}`);
    params.push(filters.strategy_id);
  }
  if (filters.symbol) {
    conditions.push(`t.symbol = $${idx++}`);
    params.push(filters.symbol.toUpperCase());
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

export async function getSummary(filters: StatFilters = {}): Promise<TradeSummary> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      COUNT(*)::int AS total_trades,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'TP')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS win_rate,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'SL')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS loss_rate,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'BE')::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS be_rate,
      COALESCE(SUM(t.pnl_net), 0) AS total_pnl,
      COALESCE(AVG(t.pnl_net) FILTER (WHERE t.outcome = 'TP'), 0) AS avg_winner,
      COALESCE(AVG(t.pnl_net) FILTER (WHERE t.outcome = 'SL'), 0) AS avg_loser,
      COALESCE(MAX(t.pnl_net), 0) AS largest_winner,
      COALESCE(MIN(t.pnl_net), 0) AS largest_loser,
      COALESCE(AVG(t.rr_actual), 0) AS avg_rr,
      CASE
        WHEN COALESCE(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 0) = 0 THEN 0
        ELSE ROUND(
          COALESCE(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'TP'), 0)::numeric /
          NULLIF(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 1), 2
        )
      END AS profit_factor,
      COALESCE(AVG(t.pnl_net), 0) AS expectancy,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.exit_time - t.entry_time)) / 60) FILTER (WHERE t.exit_time IS NOT NULL AND t.entry_time IS NOT NULL), NULL) AS avg_trade_duration,
      ROUND(COUNT(*) FILTER (WHERE t.followed_plan = TRUE)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS plan_adherence,
      AVG(t.rating) AS avg_rating,
      COALESCE(SUM(t.fees), 0) AS total_fees
    FROM trades t
    ${where}`,
    params
  );

  const row = result.rows[0];

  // Compute max drawdown separately
  const ddResult = await query<{ max_drawdown: string | null }>(
    `WITH cumulative AS (
      SELECT
        t.trade_date,
        SUM(t.pnl_net) OVER (ORDER BY t.trade_date, t.created_at) AS cum_pnl
      FROM trades t
      ${where}
    ),
    peaks AS (
      SELECT
        trade_date,
        cum_pnl,
        MAX(cum_pnl) OVER (ORDER BY trade_date) AS peak
      FROM cumulative
    )
    SELECT COALESCE(MIN(cum_pnl - peak), 0) AS max_drawdown FROM peaks`,
    params
  );

  return {
    total_trades: parseFloat(row.total_trades ?? '0'),
    win_rate: parseFloat(row.win_rate ?? '0'),
    loss_rate: parseFloat(row.loss_rate ?? '0'),
    be_rate: parseFloat(row.be_rate ?? '0'),
    total_pnl: parseFloat(row.total_pnl ?? '0'),
    avg_winner: parseFloat(row.avg_winner ?? '0'),
    avg_loser: parseFloat(row.avg_loser ?? '0'),
    largest_winner: parseFloat(row.largest_winner ?? '0'),
    largest_loser: parseFloat(row.largest_loser ?? '0'),
    avg_rr: parseFloat(row.avg_rr ?? '0'),
    profit_factor: parseFloat(row.profit_factor ?? '0'),
    expectancy: parseFloat(row.expectancy ?? '0'),
    max_drawdown: parseFloat(ddResult.rows[0]?.max_drawdown ?? '0'),
    avg_trade_duration: row.avg_trade_duration ? parseFloat(row.avg_trade_duration) : null,
    plan_adherence: parseFloat(row.plan_adherence ?? '0'),
    avg_rating: row.avg_rating ? parseFloat(row.avg_rating) : null,
    total_fees: parseFloat(row.total_fees ?? '0'),
  };
}

export async function getByStrategy(filters: StatFilters = {}): Promise<StrategyStats[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      t.strategy_id,
      s.name AS strategy_name,
      s.color,
      COUNT(*)::int AS total_trades,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'TP')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS win_rate,
      COALESCE(SUM(t.pnl_net), 0) AS total_pnl,
      COALESCE(AVG(t.rr_actual), 0) AS avg_rr,
      CASE
        WHEN COALESCE(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 0) = 0 THEN 0
        ELSE ROUND(
          COALESCE(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'TP'), 0)::numeric /
          NULLIF(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 1), 2
        )
      END AS profit_factor
    FROM trades t
    LEFT JOIN strategies s ON t.strategy_id = s.id
    ${where}
    GROUP BY t.strategy_id, s.name, s.color
    ORDER BY total_pnl DESC`,
    params
  );

  return result.rows.map((r) => ({
    strategy_id: r.strategy_id,
    strategy_name: r.strategy_name,
    color: r.color,
    total_trades: parseInt(r.total_trades ?? '0', 10),
    win_rate: parseFloat(r.win_rate ?? '0'),
    total_pnl: parseFloat(r.total_pnl ?? '0'),
    avg_rr: parseFloat(r.avg_rr ?? '0'),
    profit_factor: parseFloat(r.profit_factor ?? '0'),
  }));
}

export async function getBySymbol(filters: StatFilters = {}): Promise<SymbolStats[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      t.symbol,
      COUNT(*)::int AS total_trades,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'TP')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS win_rate,
      COALESCE(SUM(t.pnl_net), 0) AS total_pnl,
      COALESCE(AVG(t.rr_actual), 0) AS avg_rr,
      CASE
        WHEN COALESCE(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 0) = 0 THEN 0
        ELSE ROUND(
          COALESCE(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'TP'), 0)::numeric /
          NULLIF(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 1), 2
        )
      END AS profit_factor
    FROM trades t
    ${where}
    GROUP BY t.symbol
    ORDER BY total_pnl DESC`,
    params
  );

  return result.rows.map((r) => ({
    symbol: r.symbol!,
    total_trades: parseInt(r.total_trades ?? '0', 10),
    win_rate: parseFloat(r.win_rate ?? '0'),
    total_pnl: parseFloat(r.total_pnl ?? '0'),
    avg_rr: parseFloat(r.avg_rr ?? '0'),
    profit_factor: parseFloat(r.profit_factor ?? '0'),
  }));
}

export async function getBySession(filters: StatFilters = {}): Promise<SessionStats[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      t.session,
      COUNT(*)::int AS total_trades,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'TP')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS win_rate,
      COALESCE(SUM(t.pnl_net), 0) AS total_pnl,
      COALESCE(AVG(t.rr_actual), 0) AS avg_rr,
      CASE
        WHEN COALESCE(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 0) = 0 THEN 0
        ELSE ROUND(
          COALESCE(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'TP'), 0)::numeric /
          NULLIF(ABS(SUM(t.pnl_net) FILTER (WHERE t.outcome = 'SL')), 1), 2
        )
      END AS profit_factor
    FROM trades t
    ${where}
    GROUP BY t.session
    ORDER BY total_pnl DESC`,
    params
  );

  return result.rows.map((r) => ({
    session: r.session as SessionStats['session'],
    total_trades: parseInt(r.total_trades ?? '0', 10),
    win_rate: parseFloat(r.win_rate ?? '0'),
    total_pnl: parseFloat(r.total_pnl ?? '0'),
    avg_rr: parseFloat(r.avg_rr ?? '0'),
    profit_factor: parseFloat(r.profit_factor ?? '0'),
  }));
}

export async function getByDayOfWeek(filters: StatFilters = {}): Promise<DayOfWeekStats[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      TO_CHAR(t.trade_date, 'Day') AS day_name,
      EXTRACT(ISODOW FROM t.trade_date)::int AS day_number,
      COUNT(*)::int AS total_trades,
      ROUND(COUNT(*) FILTER (WHERE t.outcome = 'TP')::numeric / NULLIF(COUNT(*) FILTER (WHERE t.outcome IN ('TP', 'SL')), 0) * 100, 2) AS win_rate,
      COALESCE(SUM(t.pnl_net), 0) AS total_pnl
    FROM trades t
    ${where}
    GROUP BY day_name, day_number
    ORDER BY day_number`,
    params
  );

  return result.rows.map((r) => ({
    day_name: (r.day_name ?? '').trim(),
    day_number: parseInt(r.day_number ?? '0', 10),
    total_trades: parseInt(r.total_trades ?? '0', 10),
    win_rate: parseFloat(r.win_rate ?? '0'),
    total_pnl: parseFloat(r.total_pnl ?? '0'),
  }));
}

export async function getEquityCurve(filters: StatFilters = {}): Promise<EquityCurvePoint[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `WITH daily AS (
      SELECT
        t.trade_date AS date,
        SUM(t.pnl_net) AS daily_pnl
      FROM trades t
      ${where}
      GROUP BY t.trade_date
      ORDER BY t.trade_date
    ),
    cumulative AS (
      SELECT
        date,
        SUM(daily_pnl) OVER (ORDER BY date) AS cumulative_pnl
      FROM daily
    ),
    with_dd AS (
      SELECT
        date,
        cumulative_pnl,
        cumulative_pnl - MAX(cumulative_pnl) OVER (ORDER BY date) AS drawdown
      FROM cumulative
    )
    SELECT * FROM with_dd ORDER BY date`,
    params
  );

  return result.rows.map((r) => ({
    date: r.date!,
    cumulative_pnl: parseFloat(r.cumulative_pnl ?? '0'),
    drawdown: parseFloat(r.drawdown ?? '0'),
  }));
}

export async function getCalendar(filters: StatFilters = {}): Promise<CalendarEntry[]> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `SELECT
      t.trade_date AS date,
      COALESCE(SUM(t.pnl_net), 0) AS pnl_net,
      COUNT(*)::int AS trade_count
    FROM trades t
    ${where}
    GROUP BY t.trade_date
    ORDER BY t.trade_date`,
    params
  );

  return result.rows.map((r) => ({
    date: r.date!,
    pnl_net: parseFloat(r.pnl_net ?? '0'),
    trade_count: parseInt(r.trade_count ?? '0', 10),
  }));
}

export async function getStreaks(filters: StatFilters = {}): Promise<StreakStats> {
  const { where, params } = buildWhereClause(filters);

  const result = await query<Record<string, string | null>>(
    `WITH ordered AS (
      SELECT
        t.id,
        t.trade_date,
        t.created_at,
        CASE WHEN t.outcome = 'TP' THEN 'WIN' ELSE 'LOSS' END AS result,
        ROW_NUMBER() OVER (ORDER BY t.trade_date, t.created_at) AS rn
      FROM trades t
      ${where ? where + " AND t.outcome != 'BE'" : "WHERE t.outcome != 'BE'"}
    ),
    grouped AS (
      SELECT
        *,
        rn - ROW_NUMBER() OVER (PARTITION BY result ORDER BY trade_date, created_at) AS grp
      FROM ordered
    ),
    streaks AS (
      SELECT
        result,
        grp,
        COUNT(*) AS streak_len,
        MAX(rn) AS last_rn
      FROM grouped
      GROUP BY result, grp
    ),
    max_streaks AS (
      SELECT
        COALESCE(MAX(streak_len) FILTER (WHERE result = 'WIN'), 0) AS max_win_streak,
        COALESCE(MAX(streak_len) FILTER (WHERE result = 'LOSS'), 0) AS max_loss_streak
      FROM streaks
    ),
    current AS (
      SELECT result, streak_len
      FROM streaks
      ORDER BY last_rn DESC
      LIMIT 1
    )
    SELECT
      ms.max_win_streak,
      ms.max_loss_streak,
      COALESCE(c.result, 'NONE') AS current_streak_type,
      COALESCE(c.streak_len, 0) AS current_streak_count
    FROM max_streaks ms
    LEFT JOIN current c ON TRUE`,
    params
  );

  if (result.rows.length === 0) {
    return {
      max_win_streak: 0,
      max_loss_streak: 0,
      current_streak_type: 'NONE',
      current_streak_count: 0,
    };
  }

  const row = result.rows[0];
  return {
    max_win_streak: parseInt(row.max_win_streak ?? '0', 10),
    max_loss_streak: parseInt(row.max_loss_streak ?? '0', 10),
    current_streak_type: (row.current_streak_type as StreakStats['current_streak_type']) ?? 'NONE',
    current_streak_count: parseInt(row.current_streak_count ?? '0', 10),
  };
}
