import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { Trade, TradeWithImages, TradeFilters, PaginatedResult } from '../types';
import { CreateTradeInput, UpdateTradeInput } from '../schemas/trade.schema';
import {
  tradeFromFirestore,
  tradeImageFromFirestore,
  stripUndefined,
} from '../utils/firestoreNormalize';
import * as imagesService from './images.service';

const COL = 'trades';

const ALLOWED_SORT_COLUMNS = [
  'trade_date',
  'symbol',
  'direction',
  'outcome',
  'pnl_net',
  'pnl_dollars',
  'entry_price',
  'created_at',
  'updated_at',
];

function computeFields(data: Record<string, unknown>): void {
  const contracts = (data.contracts as number) ?? 1;

  if (data.fees === undefined || data.fees === null) {
    data.fees = 2.5 * 2 * contracts;
  }

  const tickValue = data.tick_value as number | null | undefined;

  const pnlDollars = data.pnl_dollars as number | null | undefined;
  if (pnlDollars != null && tickValue != null && tickValue > 0 && contracts > 0) {
    if (data.pnl_ticks === undefined || data.pnl_ticks === null) {
      data.pnl_ticks = parseFloat((pnlDollars / (tickValue * contracts)).toFixed(2));
    }
  }

  const fees = data.fees as number;
  if (pnlDollars != null) {
    data.pnl_net = parseFloat((pnlDollars - fees).toFixed(2));
  }
}

function mergedToFirestore(merged: Record<string, unknown>): Record<string, unknown> {
  return stripUndefined({
    trade_date: merged.trade_date,
    entry_time: merged.entry_time ?? null,
    exit_time: merged.exit_time ?? null,
    symbol: merged.symbol,
    direction: merged.direction,
    outcome: merged.outcome,
    entry_price: merged.entry_price ?? null,
    exit_price: merged.exit_price ?? null,
    stop_loss_price: merged.stop_loss_price ?? null,
    take_profit_price: merged.take_profit_price ?? null,
    contracts: merged.contracts ?? 1,
    tick_size: merged.tick_size ?? null,
    tick_value: merged.tick_value ?? null,
    rr_planned: merged.rr_planned ?? null,
    rr_actual: merged.rr_actual ?? null,
    pnl_ticks: merged.pnl_ticks ?? null,
    pnl_dollars: merged.pnl_dollars ?? null,
    fees: merged.fees ?? null,
    pnl_net: merged.pnl_net ?? null,
    strategy_id: merged.strategy_id ?? null,
    asset_class: merged.asset_class ?? null,
    session: merged.session ?? null,
    setup_notes: merged.setup_notes ?? null,
    execution_notes: merged.execution_notes ?? null,
    review_notes: merged.review_notes ?? null,
    rating: merged.rating ?? null,
    emotional_state: merged.emotional_state ?? null,
    followed_plan: merged.followed_plan !== false,
  });
}

async function strategyNameMap(): Promise<Map<string, string>> {
  const s = await db.collection('strategies').get();
  return new Map(s.docs.map((d) => [d.id, String(d.data().name ?? '')]));
}

function compareTrades(a: Trade, b: Trade, sort: string, order: 'ASC' | 'DESC'): number {
  const inv = order === 'ASC' ? 1 : -1;
  let cmp = 0;
  switch (sort) {
    case 'trade_date':
      cmp = a.trade_date.localeCompare(b.trade_date);
      break;
    case 'symbol':
      cmp = a.symbol.localeCompare(b.symbol);
      break;
    case 'direction':
      cmp = a.direction.localeCompare(b.direction);
      break;
    case 'outcome':
      cmp = a.outcome.localeCompare(b.outcome);
      break;
    case 'pnl_net':
      cmp = parseFloat(a.pnl_net ?? '0') - parseFloat(b.pnl_net ?? '0');
      break;
    case 'pnl_dollars':
      cmp = parseFloat(a.pnl_dollars ?? '0') - parseFloat(b.pnl_dollars ?? '0');
      break;
    case 'entry_price':
      cmp = parseFloat(a.entry_price ?? '0') - parseFloat(b.entry_price ?? '0');
      break;
    case 'created_at':
      cmp = a.created_at.localeCompare(b.created_at);
      break;
    case 'updated_at':
      cmp = a.updated_at.localeCompare(b.updated_at);
      break;
    default:
      cmp = a.trade_date.localeCompare(b.trade_date);
  }
  if (cmp !== 0) return cmp * inv;
  return b.created_at.localeCompare(a.created_at);
}

export async function getAll(filters: TradeFilters): Promise<PaginatedResult<Trade>> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  const sort = ALLOWED_SORT_COLUMNS.includes(filters.sort ?? '')
    ? filters.sort!
    : 'trade_date';
  const order = filters.order === 'ASC' ? 'ASC' : 'DESC';

  const nameMap = await strategyNameMap();
  const snap = await db.collection(COL).get();

  let rows: Trade[] = snap.docs.map((d) => {
    const data = d.data();
    const sid = data.strategy_id as string | undefined | null;
    return tradeFromFirestore(d.id, data, sid ? nameMap.get(sid) : undefined);
  });

  if (filters.symbol) {
    const sym = filters.symbol.toUpperCase();
    rows = rows.filter((t) => t.symbol.toUpperCase() === sym);
  }
  if (filters.outcome) {
    rows = rows.filter((t) => t.outcome === filters.outcome);
  }
  if (filters.strategy_id) {
    rows = rows.filter((t) => t.strategy_id === filters.strategy_id);
  }
  if (filters.from) {
    rows = rows.filter((t) => t.trade_date >= filters.from!);
  }
  if (filters.to) {
    rows = rows.filter((t) => t.trade_date <= filters.to!);
  }

  rows.sort((a, b) => compareTrades(a, b, sort, order));

  const total = rows.length;
  const slice = rows.slice(offset, offset + limit);

  return {
    data: slice,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

export async function getById(id: string): Promise<TradeWithImages | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  let strategyName: string | undefined;
  const sid = data.strategy_id as string | undefined | null;
  if (sid) {
    const sdoc = await db.collection('strategies').doc(sid).get();
    if (sdoc.exists) strategyName = String(sdoc.data()!.name ?? '');
  }

  const trade = tradeFromFirestore(doc.id, data, strategyName);

  const imgsSnap = await db.collection('trade_images').where('trade_id', '==', id).get();
  const images = imgsSnap.docs
    .map((d) => tradeImageFromFirestore(d.id, d.data()))
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.created_at.localeCompare(b.created_at);
    });

  return { ...trade, images };
}

export async function create(data: CreateTradeInput): Promise<Trade> {
  const id = crypto.randomUUID();
  const mutableData: Record<string, unknown> = { ...data };
  computeFields(mutableData);

  const payload = mergedToFirestore(mutableData);

  await db
    .collection(COL)
    .doc(id)
    .set({
      ...payload,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

  const created = await db.collection(COL).doc(id).get();
  const createdData = created.data()!;
  let strategyName: string | undefined;
  const strategyId = createdData.strategy_id as string | undefined | null;
  if (strategyId) {
    const sdoc = await db.collection('strategies').doc(strategyId).get();
    if (sdoc.exists) strategyName = String(sdoc.data()!.name ?? '');
  }

  return tradeFromFirestore(created.id, createdData, strategyName);
}

export async function update(id: string, data: UpdateTradeInput): Promise<Trade | null> {
  const ref = db.collection(COL).doc(id);
  const existingSnap = await ref.get();
  if (!existingSnap.exists) return null;

  const merged: Record<string, unknown> = { ...existingSnap.data(), ...data };

  for (const key of [
    'entry_price',
    'exit_price',
    'tick_size',
    'tick_value',
    'pnl_ticks',
    'pnl_dollars',
    'fees',
  ]) {
    const v = merged[key];
    if (v !== null && v !== undefined && typeof v === 'string') {
      merged[key] = parseFloat(v as string);
    }
  }
  if (typeof merged.contracts === 'string') {
    merged.contracts = parseFloat(merged.contracts as string);
  }

  if (
    data.contracts !== undefined ||
    data.entry_price !== undefined ||
    data.exit_price !== undefined ||
    data.tick_size !== undefined ||
    data.tick_value !== undefined
  ) {
    if (data.fees === undefined) merged.fees = undefined as unknown;
    merged.pnl_ticks = undefined as unknown;
    merged.pnl_net = undefined as unknown;
  }

  computeFields(merged);

  const payload = mergedToFirestore(merged);

  await ref.update({
    ...payload,
    updated_at: FieldValue.serverTimestamp(),
  });

  const next = await ref.get();
  const nextData = next.data()!;
  let strategyName: string | undefined;
  const strategyId = nextData.strategy_id as string | undefined | null;
  if (strategyId) {
    const sdoc = await db.collection('strategies').doc(strategyId).get();
    if (sdoc.exists) strategyName = String(sdoc.data()!.name ?? '');
  }

  return tradeFromFirestore(next.id, nextData, strategyName);
}

export async function remove(id: string): Promise<boolean> {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  await imagesService.deleteAllForTrade(id);
  await ref.delete();
  return true;
}
