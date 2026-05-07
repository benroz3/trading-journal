import type { TradingSession } from '../types';

/**
 * Maps trade entry instant to a session label using **UTC** clock hours (common forex-style bands).
 * Exclusive windows covering 24h: Asia → London → Overlap → New York → Off hours.
 */
export function inferTradingSessionFromEntryTime(
  iso: string | null | undefined
): TradingSession | null {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;

  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  const M = (h: number, m = 0) => h * 60 + m;

  if (mins >= M(0, 0) && mins < M(7, 0)) return 'ASIA';
  if (mins >= M(7, 0) && mins < M(12, 0)) return 'LONDON';
  if (mins >= M(12, 0) && mins < M(16, 0)) return 'OVERLAP';
  if (mins >= M(16, 0) && mins < M(21, 0)) return 'NEW_YORK';
  return 'OFF_HOURS';
}

/** When the client leaves session blank, derive from entry_time; otherwise keep their choice. */
export function applySessionFromEntryTimeIfUnset(
  merged: Record<string, unknown>,
  explicitSession: string | null | undefined
): void {
  const hasExplicit =
    explicitSession != null &&
    explicitSession !== '' &&
    typeof explicitSession === 'string';
  if (hasExplicit) {
    merged.session = explicitSession;
    return;
  }
  const inferred = inferTradingSessionFromEntryTime(merged.entry_time as string | null | undefined);
  if (inferred) merged.session = inferred;
}
