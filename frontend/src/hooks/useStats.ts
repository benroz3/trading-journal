import { useQuery } from '@tanstack/react-query';
import * as statsApi from '../api/stats.api';
import type { TradeFilters } from '../types';

type StatsFilters = Pick<TradeFilters, 'from' | 'to' | 'symbol' | 'strategy_id'>;

export function useStatsSummary(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'summary', filters],
    queryFn: () => statsApi.getSummary(filters),
    staleTime: 30 * 1000,
  });
}

export function useStatsByStrategy(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'by-strategy', filters],
    queryFn: () => statsApi.getByStrategy(filters),
    staleTime: 30 * 1000,
  });
}

export function useStatsBySymbol(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'by-symbol', filters],
    queryFn: () => statsApi.getBySymbol(filters),
    staleTime: 30 * 1000,
  });
}

export function useStatsBySession(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'by-session', filters],
    queryFn: () => statsApi.getBySession(filters),
    staleTime: 30 * 1000,
  });
}

export function useStatsByDayOfWeek(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'by-day-of-week', filters],
    queryFn: () => statsApi.getByDayOfWeek(filters),
    staleTime: 30 * 1000,
  });
}

export function useEquityCurve(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'equity-curve', filters],
    queryFn: () => statsApi.getEquityCurve(filters),
    staleTime: 30 * 1000,
  });
}

export function useCalendar(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'calendar', filters],
    queryFn: () => statsApi.getCalendar(filters),
    staleTime: 30 * 1000,
  });
}

export function useStreaks(filters?: StatsFilters) {
  return useQuery({
    queryKey: ['stats', 'streaks', filters],
    queryFn: () => statsApi.getStreaks(filters),
    staleTime: 30 * 1000,
  });
}
