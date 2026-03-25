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

export interface Trade {
  id: string;
  trade_date: string;
  entry_time: string | null;
  exit_time: string | null;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  outcome: 'TP' | 'SL' | 'BE';
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
  strategy_name?: string;
  asset_class: string | null;
  session: string | null;
  setup_notes: string | null;
  execution_notes: string | null;
  review_notes: string | null;
  rating: number | null;
  emotional_state: string | null;
  followed_plan: boolean;
  images: TradeImage[];
  created_at: string;
  updated_at: string;
}

export interface TradeFormData {
  trade_date: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  outcome: 'TP' | 'SL' | 'BE';
  entry_time?: string | null;
  exit_time?: string | null;
  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  contracts?: number;
  tick_size?: number | null;
  tick_value?: number | null;
  rr_planned?: number | null;
  rr_actual?: number | null;
  pnl_ticks?: number | null;
  pnl_dollars?: number | null;
  fees?: number | null;
  pnl_net?: number | null;
  strategy_id?: string | null;
  asset_class?: string | null;
  session?: string | null;
  setup_notes?: string | null;
  execution_notes?: string | null;
  review_notes?: string | null;
  rating?: number | null;
  emotional_state?: string | null;
  followed_plan?: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface StatSummary {
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
  session: string;
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

export interface StreakData {
  max_win_streak: number;
  max_loss_streak: number;
  current_streak_type: 'WIN' | 'LOSS' | 'NONE';
  current_streak_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TradeFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  symbol?: string;
  outcome?: string;
  strategy_id?: string;
  from?: string;
  to?: string;
}
