import { z } from 'zod';

const directionEnum = z.enum(['LONG', 'SHORT']);
const outcomeEnum = z.enum(['TP', 'SL', 'BE']);
const assetClassEnum = z.enum([
  'EQUITY_INDEX', 'ENERGY', 'METALS', 'AGRICULTURE',
  'CURRENCY', 'INTEREST_RATE', 'CRYPTO', 'OTHER',
]);
const sessionEnum = z.enum([
  'ASIA', 'LONDON', 'NEW_YORK', 'OVERLAP', 'OFF_HOURS',
]);

export const createTradeSchema = z.object({
  trade_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  symbol: z.string().min(1).max(20),
  direction: directionEnum,
  outcome: outcomeEnum,
  entry_time: z.string().nullable().optional(),
  exit_time: z.string().nullable().optional(),
  entry_price: z.number().positive().nullable().optional(),
  exit_price: z.number().positive().nullable().optional(),
  stop_loss_price: z.number().positive().nullable().optional(),
  take_profit_price: z.number().positive().nullable().optional(),
  contracts: z.coerce.number().positive().optional().default(1),
  tick_size: z.coerce.number().positive().nullable().optional(),
  tick_value: z.coerce.number().positive().nullable().optional(),
  rr_planned: z.number().nullable().optional(),
  rr_actual: z.number().nullable().optional(),
  pnl_ticks: z.number().nullable().optional(),
  pnl_dollars: z.number().nullable().optional(),
  fees: z.number().nullable().optional(),
  pnl_net: z.number().nullable().optional(),
  strategy_id: z.string().uuid().nullable().optional(),
  asset_class: assetClassEnum.nullable().optional(),
  session: sessionEnum.nullable().optional(),
  setup_notes: z.string().nullable().optional(),
  execution_notes: z.string().nullable().optional(),
  review_notes: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  emotional_state: z.string().max(50).nullable().optional(),
  followed_plan: z.boolean().optional().default(true),
});

// Update uses the same schema as create since the frontend always sends the full object
export const updateTradeSchema = createTradeSchema;

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
