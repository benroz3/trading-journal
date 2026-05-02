import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type { Trade, TradeImage, Strategy, TradeDirection, TradeOutcome, AssetClass, TradingSession } from '../types';

export class StrategyNameConflictError extends Error {
  constructor() {
    super('A strategy with that name already exists');
    this.name = 'StrategyNameConflictError';
  }
}

export function timestampToIso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
}

export function numToApiString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  if (typeof v === 'string' && v !== '') return v;
  return null;
}

export function toContracts(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 1 : n;
  }
  return 1;
}

export function toFloat(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

export function tradeFromFirestore(
  id: string,
  data: DocumentData,
  strategyName?: string | null
): Trade {
  return {
    id,
    trade_date: String(data.trade_date ?? ''),
    entry_time: data.entry_time ?? null,
    exit_time: data.exit_time ?? null,
    symbol: String(data.symbol ?? ''),
    direction: data.direction as TradeDirection,
    outcome: data.outcome as TradeOutcome,
    entry_price: numToApiString(data.entry_price),
    exit_price: numToApiString(data.exit_price),
    stop_loss_price: numToApiString(data.stop_loss_price),
    take_profit_price: numToApiString(data.take_profit_price),
    contracts: toContracts(data.contracts),
    tick_size: numToApiString(data.tick_size),
    tick_value: numToApiString(data.tick_value),
    rr_planned: numToApiString(data.rr_planned),
    rr_actual: numToApiString(data.rr_actual),
    pnl_ticks: numToApiString(data.pnl_ticks),
    pnl_dollars: numToApiString(data.pnl_dollars),
    fees: numToApiString(data.fees) ?? '0',
    pnl_net: numToApiString(data.pnl_net),
    strategy_id: data.strategy_id ?? null,
    strategy_name: strategyName ?? undefined,
    asset_class: (data.asset_class ?? null) as AssetClass | null,
    session: (data.session ?? null) as TradingSession | null,
    setup_notes: data.setup_notes ?? null,
    execution_notes: data.execution_notes ?? null,
    review_notes: data.review_notes ?? null,
    rating: data.rating ?? null,
    emotional_state: data.emotional_state ?? null,
    followed_plan: data.followed_plan !== false,
    created_at: timestampToIso(data.created_at),
    updated_at: timestampToIso(data.updated_at),
  };
}

export function strategyFromFirestore(id: string, data: DocumentData): Strategy {
  return {
    id,
    name: String(data.name ?? ''),
    description: data.description ?? null,
    color: String(data.color ?? '#3B82F6'),
    created_at: timestampToIso(data.created_at),
    updated_at: timestampToIso(data.updated_at),
  };
}

export function tradeImageFromFirestore(id: string, data: DocumentData): TradeImage {
  return {
    id,
    trade_id: String(data.trade_id ?? ''),
    filename: String(data.filename ?? ''),
    original_name: String(data.original_name ?? ''),
    mime_type: String(data.mime_type ?? 'image/webp'),
    file_size: typeof data.file_size === 'number' ? data.file_size : 0,
    caption: data.caption ?? null,
    sort_order: typeof data.sort_order === 'number' ? data.sort_order : 0,
    created_at: timestampToIso(data.created_at),
  };
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}
