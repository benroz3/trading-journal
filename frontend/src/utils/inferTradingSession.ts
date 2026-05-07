/** Same UTC bands as backend — keep in sync with `backend/src/utils/inferTradingSession.ts`. */
export type InferredSession = 'ASIA' | 'LONDON' | 'OVERLAP' | 'NEW_YORK' | 'OFF_HOURS';

export function inferTradingSessionFromEntryTime(iso: string | null | undefined): InferredSession | null {
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
