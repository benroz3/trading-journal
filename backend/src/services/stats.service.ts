import type { DocumentData } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import {
  StatFilters,
  TradeSummary,
  StrategyStats,
  SymbolStats,
  SessionStats,
  DayOfWeekStats,
  EquityCurvePoint,
  CalendarEntry,
  StreakStats,
  TradeOutcome,
  TradingSession,
} from '../types';
import { timestampToIso, toFloat } from '../utils/firestoreNormalize';

interface StatRow {
  id: string;
  trade_date: string;
  created_at: string;
  outcome: TradeOutcome;
  pnl_net: number;
  fees: number;
  rr_actual: number | null;
  rating: number | null;
  followed_plan: boolean;
  entry_time: string | null;
  exit_time: string | null;
  strategy_id: string | null;
  symbol: string;
  session: TradingSession | null;
}

function passesFilters(t: DocumentData, filters: StatFilters): boolean {
  const date = String(t.trade_date ?? '');
  if (filters.from && date < filters.from) return false;
  if (filters.to && date > filters.to) return false;
  if (filters.strategy_id && t.strategy_id !== filters.strategy_id) return false;
  if (
    filters.symbol &&
    String(t.symbol ?? '').toUpperCase() !== filters.symbol.toUpperCase()
  ) {
    return false;
  }
  return true;
}

async function loadStatRows(filters: StatFilters): Promise<StatRow[]> {
  const snap = await db.collection('trades').get();
  const rows: StatRow[] = [];
  for (const doc of snap.docs) {
    const t = doc.data();
    if (!passesFilters(t, filters)) continue;
    rows.push({
      id: doc.id,
      trade_date: String(t.trade_date ?? ''),
      created_at: timestampToIso(t.created_at),
      outcome: t.outcome as TradeOutcome,
      pnl_net: toFloat(t.pnl_net),
      fees: toFloat(t.fees),
      rr_actual: t.rr_actual != null ? toFloat(t.rr_actual) : null,
      rating: t.rating ?? null,
      followed_plan: t.followed_plan !== false,
      entry_time: t.entry_time ?? null,
      exit_time: t.exit_time ?? null,
      strategy_id: t.strategy_id ?? null,
      symbol: String(t.symbol ?? ''),
      session: (t.session ?? null) as TradingSession | null,
    });
  }
  return rows;
}

function durationMinutes(entry: string | null, exit: string | null): number | null {
  if (!entry || !exit) return null;
  const a = new Date(entry).getTime();
  const b = new Date(exit).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (b - a) / 60000;
}

function isoDayMeta(tradeDate: string): { day_number: number; day_name: string } {
  const d = new Date(`${tradeDate}T12:00:00Z`);
  const js = d.getUTCDay();
  const isoDow = js === 0 ? 7 : js;
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return { day_number: isoDow, day_name: names[isoDow - 1] };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getSummary(filters: StatFilters = {}): Promise<TradeSummary> {
  const rows = await loadStatRows(filters);
  const n = rows.length;
  const tpSl = rows.filter((r) => r.outcome === 'TP' || r.outcome === 'SL');
  const tp = rows.filter((r) => r.outcome === 'TP');
  const sl = rows.filter((r) => r.outcome === 'SL');
  const be = rows.filter((r) => r.outcome === 'BE');

  const winRate =
    tpSl.length === 0 ? 0 : round2((tp.length / tpSl.length) * 100);
  const lossRate =
    tpSl.length === 0 ? 0 : round2((sl.length / tpSl.length) * 100);
  const beRate = n === 0 ? 0 : round2((be.length / n) * 100);

  const totalPnl = rows.reduce((s, r) => s + r.pnl_net, 0);
  const tpPnls = tp.map((r) => r.pnl_net);
  const slPnls = sl.map((r) => r.pnl_net);
  const avgWinner = tp.length === 0 ? 0 : tpPnls.reduce((a, b) => a + b, 0) / tp.length;
  const avgLoser = sl.length === 0 ? 0 : slPnls.reduce((a, b) => a + b, 0) / sl.length;
  const largestWinner = tpPnls.length === 0 ? 0 : Math.max(...tpPnls);
  const largestLoser = slPnls.length === 0 ? 0 : Math.min(...slPnls);

  const rrVals = rows.map((r) => r.rr_actual).filter((v): v is number => v != null && !Number.isNaN(v));
  const avgRr = rrVals.length === 0 ? 0 : rrVals.reduce((a, b) => a + b, 0) / rrVals.length;

  const sumTp = tp.reduce((s, r) => s + r.pnl_net, 0);
  const sumSlAbs = Math.abs(sl.reduce((s, r) => s + r.pnl_net, 0));
  const profitFactor = sumSlAbs === 0 ? 0 : round2(sumTp / sumSlAbs);

  const expectancy = n === 0 ? 0 : totalPnl / n;

  const durs = rows
    .map((r) => durationMinutes(r.entry_time, r.exit_time))
    .filter((v): v is number => v != null && !Number.isNaN(v));
  const avgTradeDuration =
    durs.length === 0 ? null : durs.reduce((a, b) => a + b, 0) / durs.length;

  const planAdherence =
    n === 0 ? 0 : round2((rows.filter((r) => r.followed_plan).length / n) * 100);

  const ratings = rows.map((r) => r.rating).filter((v): v is number => v != null);
  const avgRating = ratings.length === 0 ? null : ratings.reduce((a, b) => a + b, 0) / ratings.length;

  const totalFees = rows.reduce((s, r) => s + r.fees, 0);

  // Max drawdown from daily cumulative P&L
  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    dailyMap.set(r.trade_date, (dailyMap.get(r.trade_date) ?? 0) + r.pnl_net);
  }
  const dates = Array.from(dailyMap.keys()).sort();
  let cum = 0;
  let peak = 0;
  let maxDd = 0;
  for (const dt of dates) {
    cum += dailyMap.get(dt) ?? 0;
    peak = Math.max(peak, cum);
    maxDd = Math.min(maxDd, cum - peak);
  }

  return {
    total_trades: n,
    win_rate: winRate,
    loss_rate: lossRate,
    be_rate: beRate,
    total_pnl: round2(totalPnl),
    avg_winner: round2(avgWinner),
    avg_loser: round2(avgLoser),
    largest_winner: round2(largestWinner),
    largest_loser: round2(largestLoser),
    avg_rr: round2(avgRr),
    profit_factor: profitFactor,
    expectancy: round2(expectancy),
    max_drawdown: round2(maxDd),
    avg_trade_duration: avgTradeDuration == null ? null : round2(avgTradeDuration),
    plan_adherence: planAdherence,
    avg_rating: avgRating == null ? null : round2(avgRating),
    total_fees: round2(totalFees),
  };
}

export async function getByStrategy(filters: StatFilters = {}): Promise<StrategyStats[]> {
  const rows = await loadStatRows(filters);
  const stratSnap = await db.collection('strategies').get();
  const nameById = new Map(stratSnap.docs.map((d) => [d.id, String(d.data().name ?? '')]));
  const colorById = new Map(stratSnap.docs.map((d) => [d.id, String(d.data().color ?? '#3B82F6')]));

  const groups = new Map<string | null, StatRow[]>();
  for (const r of rows) {
    const k = r.strategy_id;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const out: StrategyStats[] = [];
  for (const [strategyId, list] of groups) {
    const tpSl = list.filter((r) => r.outcome === 'TP' || r.outcome === 'SL');
    const tp = list.filter((r) => r.outcome === 'TP');
    const sl = list.filter((r) => r.outcome === 'SL');
    const winRate =
      tpSl.length === 0 ? 0 : round2((tp.length / tpSl.length) * 100);
    const totalPnl = list.reduce((s, r) => s + r.pnl_net, 0);
    const rrVals = list.map((r) => r.rr_actual).filter((v): v is number => v != null);
    const avgRr = rrVals.length === 0 ? 0 : rrVals.reduce((a, b) => a + b, 0) / rrVals.length;
    const sumTp = tp.reduce((s, r) => s + r.pnl_net, 0);
    const sumSlAbs = Math.abs(sl.reduce((s, r) => s + r.pnl_net, 0));
    const profitFactor = sumSlAbs === 0 ? 0 : round2(sumTp / sumSlAbs);

    out.push({
      strategy_id: strategyId,
      strategy_name: strategyId ? nameById.get(strategyId) ?? null : null,
      color: strategyId ? colorById.get(strategyId) ?? null : null,
      total_trades: list.length,
      win_rate: winRate,
      total_pnl: round2(totalPnl),
      avg_rr: round2(avgRr),
      profit_factor: profitFactor,
    });
  }

  out.sort((a, b) => b.total_pnl - a.total_pnl);
  return out;
}

export async function getBySymbol(filters: StatFilters = {}): Promise<SymbolStats[]> {
  const rows = await loadStatRows(filters);
  const groups = new Map<string, StatRow[]>();
  for (const r of rows) {
    if (!groups.has(r.symbol)) groups.set(r.symbol, []);
    groups.get(r.symbol)!.push(r);
  }

  const out: SymbolStats[] = [];
  for (const [symbol, list] of groups) {
    const tpSl = list.filter((x) => x.outcome === 'TP' || x.outcome === 'SL');
    const tp = list.filter((x) => x.outcome === 'TP');
    const sl = list.filter((x) => x.outcome === 'SL');
    const winRate =
      tpSl.length === 0 ? 0 : round2((tp.length / tpSl.length) * 100);
    const totalPnl = list.reduce((s, r) => s + r.pnl_net, 0);
    const rrVals = list.map((r) => r.rr_actual).filter((v): v is number => v != null);
    const avgRr = rrVals.length === 0 ? 0 : rrVals.reduce((a, b) => a + b, 0) / rrVals.length;
    const sumTp = tp.reduce((s, r) => s + r.pnl_net, 0);
    const sumSlAbs = Math.abs(sl.reduce((s, r) => s + r.pnl_net, 0));
    const profitFactor = sumSlAbs === 0 ? 0 : round2(sumTp / sumSlAbs);
    out.push({
      symbol,
      total_trades: list.length,
      win_rate: winRate,
      total_pnl: round2(totalPnl),
      avg_rr: round2(avgRr),
      profit_factor: profitFactor,
    });
  }
  out.sort((a, b) => b.total_pnl - a.total_pnl);
  return out;
}

export async function getBySession(filters: StatFilters = {}): Promise<SessionStats[]> {
  const rows = await loadStatRows(filters);
  const groups = new Map<string, StatRow[]>();
  for (const r of rows) {
    const key = r.session ?? 'null';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const out: SessionStats[] = [];
  for (const [key, list] of groups) {
    const session = key === 'null' ? null : (key as TradingSession);
    const tpSl = list.filter((x) => x.outcome === 'TP' || x.outcome === 'SL');
    const tp = list.filter((x) => x.outcome === 'TP');
    const sl = list.filter((x) => x.outcome === 'SL');
    const winRate =
      tpSl.length === 0 ? 0 : round2((tp.length / tpSl.length) * 100);
    const totalPnl = list.reduce((s, r) => s + r.pnl_net, 0);
    const rrVals = list.map((r) => r.rr_actual).filter((v): v is number => v != null);
    const avgRr = rrVals.length === 0 ? 0 : rrVals.reduce((a, b) => a + b, 0) / rrVals.length;
    const sumTp = tp.reduce((s, r) => s + r.pnl_net, 0);
    const sumSlAbs = Math.abs(sl.reduce((s, r) => s + r.pnl_net, 0));
    const profitFactor = sumSlAbs === 0 ? 0 : round2(sumTp / sumSlAbs);
    out.push({
      session,
      total_trades: list.length,
      win_rate: winRate,
      total_pnl: round2(totalPnl),
      avg_rr: round2(avgRr),
      profit_factor: profitFactor,
    });
  }
  out.sort((a, b) => b.total_pnl - a.total_pnl);
  return out;
}

export async function getByDayOfWeek(filters: StatFilters = {}): Promise<DayOfWeekStats[]> {
  const rows = await loadStatRows(filters);
  const groups = new Map<number, { day_name: string; list: StatRow[] }>();
  for (const r of rows) {
    const { day_number, day_name } = isoDayMeta(r.trade_date);
    if (!groups.has(day_number)) groups.set(day_number, { day_name, list: [] });
    groups.get(day_number)!.list.push(r);
  }

  const out: DayOfWeekStats[] = [];
  for (const [day_number, { day_name, list }] of groups) {
    const tpSl = list.filter((x) => x.outcome === 'TP' || x.outcome === 'SL');
    const tp = list.filter((x) => x.outcome === 'TP');
    const winRate =
      tpSl.length === 0 ? 0 : round2((tp.length / tpSl.length) * 100);
    const totalPnl = list.reduce((s, r) => s + r.pnl_net, 0);
    out.push({
      day_name,
      day_number,
      total_trades: list.length,
      win_rate: winRate,
      total_pnl: round2(totalPnl),
    });
  }
  out.sort((a, b) => a.day_number - b.day_number);
  return out;
}

export async function getEquityCurve(filters: StatFilters = {}): Promise<EquityCurvePoint[]> {
  const rows = await loadStatRows(filters);
  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    dailyMap.set(r.trade_date, (dailyMap.get(r.trade_date) ?? 0) + r.pnl_net);
  }
  const dates = Array.from(dailyMap.keys()).sort();
  let cum = 0;
  let peak = 0;
  const pts: EquityCurvePoint[] = [];
  for (const dt of dates) {
    cum += dailyMap.get(dt) ?? 0;
    peak = Math.max(peak, cum);
    const drawdown = cum - peak;
    pts.push({
      date: dt,
      cumulative_pnl: round2(cum),
      drawdown: round2(drawdown),
    });
  }
  return pts;
}

export async function getCalendar(filters: StatFilters = {}): Promise<CalendarEntry[]> {
  const rows = await loadStatRows(filters);
  const dailyMap = new Map<string, { pnl: number; count: number }>();
  for (const r of rows) {
    const cur = dailyMap.get(r.trade_date) ?? { pnl: 0, count: 0 };
    cur.pnl += r.pnl_net;
    cur.count += 1;
    dailyMap.set(r.trade_date, cur);
  }
  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      pnl_net: round2(v.pnl),
      trade_count: v.count,
    }));
}

export async function getStreaks(filters: StatFilters = {}): Promise<StreakStats> {
  const rows = await loadStatRows(filters);
  const ordered = rows
    .filter((r) => r.outcome !== 'BE')
    .sort((a, b) => {
      const d = a.trade_date.localeCompare(b.trade_date);
      if (d !== 0) return d;
      return a.created_at.localeCompare(b.created_at);
    })
    .map((r) => ({
      result: r.outcome === 'TP' ? ('WIN' as const) : ('LOSS' as const),
    }));

  if (ordered.length === 0) {
    return {
      max_win_streak: 0,
      max_loss_streak: 0,
      current_streak_type: 'NONE',
      current_streak_count: 0,
    };
  }

  let maxWin = 0;
  let maxLoss = 0;
  let cur: 'WIN' | 'LOSS' = ordered[0].result;
  let len = 1;

  const flush = () => {
    if (cur === 'WIN') maxWin = Math.max(maxWin, len);
    else maxLoss = Math.max(maxLoss, len);
  };

  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].result === cur) {
      len++;
    } else {
      flush();
      cur = ordered[i].result;
      len = 1;
    }
  }
  flush();

  const last = ordered[ordered.length - 1].result;
  let currentLen = 1;
  for (let i = ordered.length - 2; i >= 0; i--) {
    if (ordered[i].result === last) currentLen++;
    else break;
  }

  return {
    max_win_streak: maxWin,
    max_loss_streak: maxLoss,
    current_streak_type: last,
    current_streak_count: currentLen,
  };
}
