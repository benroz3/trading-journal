import { query } from '../config/database';
import { Trade, TradeWithImages, TradeImage, TradeFilters, PaginatedResult } from '../types';
import { CreateTradeInput, UpdateTradeInput } from '../schemas/trade.schema';

const ALLOWED_SORT_COLUMNS = [
  'trade_date', 'symbol', 'direction', 'outcome', 'pnl_net',
  'pnl_dollars', 'entry_price', 'created_at', 'updated_at',
];

function computeFields(data: Record<string, unknown>): void {
  const contracts = (data.contracts as number) ?? 1;

  // Auto-compute fees: $2.50 per side per contract
  if (data.fees === undefined || data.fees === null) {
    data.fees = 2.5 * 2 * contracts;
  }

  const tickValue = data.tick_value as number | null | undefined;

  // P&L dollars is the primary input - derive ticks from it
  const pnlDollars = data.pnl_dollars as number | null | undefined;
  if (pnlDollars != null && tickValue != null && tickValue > 0 && contracts > 0) {
    if (data.pnl_ticks === undefined || data.pnl_ticks === null) {
      data.pnl_ticks = parseFloat((pnlDollars / (tickValue * contracts)).toFixed(2));
    }
  }

  // Compute pnl_net = dollars - fees
  const fees = data.fees as number;
  if (pnlDollars != null) {
    data.pnl_net = parseFloat((pnlDollars - fees).toFixed(2));
  }
}

export async function getAll(
  filters: TradeFilters
): Promise<PaginatedResult<Trade>> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  const sort = ALLOWED_SORT_COLUMNS.includes(filters.sort ?? '')
    ? filters.sort!
    : 'trade_date';
  const order = filters.order === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.symbol) {
    conditions.push(`symbol = $${paramIdx++}`);
    params.push(filters.symbol.toUpperCase());
  }
  if (filters.outcome) {
    conditions.push(`outcome = $${paramIdx++}`);
    params.push(filters.outcome);
  }
  if (filters.strategy_id) {
    conditions.push(`strategy_id = $${paramIdx++}`);
    params.push(filters.strategy_id);
  }
  if (filters.from) {
    conditions.push(`trade_date >= $${paramIdx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`trade_date <= $${paramIdx++}`);
    params.push(filters.to);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM trades ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const result = await query<Trade>(
    `SELECT t.*, s.name as strategy_name
     FROM trades t
     LEFT JOIN strategies s ON t.strategy_id = s.id
     ${whereClause}
     ORDER BY ${sort} ${order}, t.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    dataParams
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

export async function getById(id: string): Promise<TradeWithImages | null> {
  const tradeResult = await query<Trade>(
    `SELECT t.*, s.name as strategy_name
     FROM trades t
     LEFT JOIN strategies s ON t.strategy_id = s.id
     WHERE t.id = $1`,
    [id]
  );

  if (tradeResult.rows.length === 0) return null;

  const imagesResult = await query<TradeImage>(
    'SELECT * FROM trade_images WHERE trade_id = $1 ORDER BY sort_order ASC, created_at ASC',
    [id]
  );

  return {
    ...tradeResult.rows[0],
    images: imagesResult.rows,
  };
}

export async function create(data: CreateTradeInput): Promise<Trade> {
  const mutableData: Record<string, unknown> = { ...data };
  computeFields(mutableData);

  const columns = [
    'trade_date', 'entry_time', 'exit_time', 'symbol', 'direction', 'outcome',
    'entry_price', 'exit_price', 'stop_loss_price', 'take_profit_price',
    'contracts', 'tick_size', 'tick_value', 'rr_planned', 'rr_actual',
    'pnl_ticks', 'pnl_dollars', 'fees', 'pnl_net', 'strategy_id',
    'asset_class', 'session', 'setup_notes', 'execution_notes', 'review_notes',
    'rating', 'emotional_state', 'followed_plan',
  ];

  const values = columns.map((col) => {
    const val = mutableData[col];
    return val === undefined ? null : val;
  });

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = columns.join(', ');

  const result = await query<Trade>(
    `INSERT INTO trades (${columnNames}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: UpdateTradeInput
): Promise<Trade | null> {
  // Fetch existing trade to merge for compute
  const existing = await query<Trade>('SELECT * FROM trades WHERE id = $1', [id]);
  if (existing.rows.length === 0) return null;

  const merged: Record<string, unknown> = { ...existing.rows[0], ...data };
  // Convert string numerics from DB to numbers for computation
  for (const key of [
    'entry_price', 'exit_price', 'tick_size', 'tick_value',
    'pnl_ticks', 'pnl_dollars', 'fees',
  ]) {
    if (merged[key] !== null && merged[key] !== undefined && typeof merged[key] === 'string') {
      merged[key] = parseFloat(merged[key] as string);
    }
  }
  if (typeof merged.contracts === 'string') {
    merged.contracts = parseInt(merged.contracts as string, 10);
  }

  // Reset computed fields if relevant inputs changed so they get recomputed
  if (data.contracts !== undefined || data.entry_price !== undefined || data.exit_price !== undefined || data.tick_size !== undefined) {
    if (data.fees === undefined) merged.fees = undefined as unknown;
    merged.pnl_ticks = undefined as unknown;
    merged.pnl_dollars = undefined as unknown;
    merged.pnl_net = undefined as unknown;
  }

  computeFields(merged);

  const updateColumns = [
    'trade_date', 'entry_time', 'exit_time', 'symbol', 'direction', 'outcome',
    'entry_price', 'exit_price', 'stop_loss_price', 'take_profit_price',
    'contracts', 'tick_size', 'tick_value', 'rr_planned', 'rr_actual',
    'pnl_ticks', 'pnl_dollars', 'fees', 'pnl_net', 'strategy_id',
    'asset_class', 'session', 'setup_notes', 'execution_notes', 'review_notes',
    'rating', 'emotional_state', 'followed_plan',
  ];

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  for (const col of updateColumns) {
    if (col in data || ['fees', 'pnl_ticks', 'pnl_dollars', 'pnl_net'].includes(col)) {
      setClauses.push(`${col} = $${paramIdx++}`);
      const val = merged[col];
      values.push(val === undefined ? null : val);
    }
  }

  if (setClauses.length === 0) {
    return existing.rows[0];
  }

  values.push(id);
  const result = await query<Trade>(
    `UPDATE trades SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM trades WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
