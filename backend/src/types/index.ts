export type TradeDirection = 'LONG' | 'SHORT';
export type TradeOutcome = 'TP' | 'SL' | 'BE';
export type AssetClass =
  | 'EQUITY_INDEX'
  | 'ENERGY'
  | 'METALS'
  | 'AGRICULTURE'
  | 'CURRENCY'
  | 'INTEREST_RATE'
  | 'CRYPTO'
  | 'OTHER';
export type TradingSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OFF_HOURS';

export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  trade_date: string;
  entry_time: string | null;
  exit_time: string | null;
  symbol: string;
  direction: TradeDirection;
  outcome: TradeOutcome;
  entry_price: string | null;
  exit_price: string | null;
  stop_loss_price: string | null;
  take_profit_price: string | null;
  contracts: number;
  tick_size: string | null;
  tick_value: string | null;
  rr_planned: string | null;
  rr_actual: string | null;
  pnl_ticks: string | null;
  pnl_dollars: string | null;
  fees: string;
  pnl_net: string | null;
  strategy_id: string | null;
  asset_class: AssetClass | null;
  session: TradingSession | null;
  setup_notes: string | null;
  execution_notes: string | null;
  review_notes: string | null;
  rating: number | null;
  emotional_state: string | null;
  followed_plan: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeWithImages extends Trade {
  images: TradeImage[];
}

export interface TradeImage {
  id: string;
  trade_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface TradeFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  symbol?: string;
  outcome?: TradeOutcome;
  strategy_id?: string;
  from?: string;
  to?: string;
}

export interface StatFilters {
  from?: string;
  to?: string;
  strategy_id?: string;
  symbol?: string;
}

export interface TradeSummary {
  total_trades: number;
  win_rate: number;
  loss_rate: number;
  be_rate: number;
  total_pnl: number;
  avg_winner: number;
  avg_loser: number;
  largest_winner: number;
  largest_loser: number;
  avg_rr: number;
  profit_factor: number;
  expectancy: number;
  max_drawdown: number;
  avg_trade_duration: number | null;
  plan_adherence: number;
  avg_rating: number | null;
  total_fees: number;
}

export interface StrategyStats {
  strategy_id: string | null;
  strategy_name: string | null;
  color: string | null;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_rr: number;
  profit_factor: number;
}

export interface SymbolStats {
  symbol: string;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_rr: number;
  profit_factor: number;
}

export interface SessionStats {
  session: TradingSession | null;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_rr: number;
  profit_factor: number;
}

export interface DayOfWeekStats {
  day_name: string;
  day_number: number;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
}

export interface EquityCurvePoint {
  date: string;
  cumulative_pnl: number;
  drawdown: number;
}

export interface CalendarEntry {
  date: string;
  pnl_net: number;
  trade_count: number;
}

export interface StreakStats {
  max_win_streak: number;
  max_loss_streak: number;
  current_streak_type: 'WIN' | 'LOSS' | 'NONE';
  current_streak_count: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
