import client from './client';
import type {
  StatSummary,
  StrategyStats,
  SymbolStats,
  SessionStats,
  DayOfWeekStats,
  EquityCurvePoint,
  CalendarEntry,
  StreakData,
  TradeFilters,
} from '../types';

type StatsFilters = Pick<TradeFilters, 'from' | 'to' | 'symbol' | 'strategy_id'>;

export async function getSummary(filters?: StatsFilters): Promise<StatSummary> {
  const { data } = await client.get<StatSummary>('/stats/summary', { params: filters });
  return data;
}

export async function getByStrategy(filters?: StatsFilters): Promise<StrategyStats[]> {
  const { data } = await client.get<StrategyStats[]>('/stats/by-strategy', { params: filters });
  return data;
}

export async function getBySymbol(filters?: StatsFilters): Promise<SymbolStats[]> {
  const { data } = await client.get<SymbolStats[]>('/stats/by-symbol', { params: filters });
  return data;
}

export async function getBySession(filters?: StatsFilters): Promise<SessionStats[]> {
  const { data } = await client.get<SessionStats[]>('/stats/by-session', { params: filters });
  return data;
}

export async function getByDayOfWeek(filters?: StatsFilters): Promise<DayOfWeekStats[]> {
  const { data } = await client.get<DayOfWeekStats[]>('/stats/by-day-of-week', { params: filters });
  return data;
}

export async function getEquityCurve(filters?: StatsFilters): Promise<EquityCurvePoint[]> {
  const { data } = await client.get<EquityCurvePoint[]>('/stats/equity-curve', { params: filters });
  return data;
}

export async function getCalendar(filters?: StatsFilters): Promise<CalendarEntry[]> {
  const { data } = await client.get<CalendarEntry[]>('/stats/calendar', { params: filters });
  return data;
}

export async function getStreaks(filters?: StatsFilters): Promise<StreakData> {
  const { data } = await client.get<StreakData>('/stats/streaks', { params: filters });
  return data;
}
