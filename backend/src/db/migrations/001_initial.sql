CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
  CREATE TYPE trade_direction AS ENUM ('LONG', 'SHORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trade_outcome AS ENUM ('TP', 'SL', 'BE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_class AS ENUM (
    'EQUITY_INDEX', 'ENERGY', 'METALS', 'AGRICULTURE',
    'CURRENCY', 'INTEREST_RATE', 'CRYPTO', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trading_session AS ENUM (
    'ASIA', 'LONDON', 'NEW_YORK', 'OVERLAP', 'OFF_HOURS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  symbol VARCHAR(20) NOT NULL,
  direction trade_direction NOT NULL,
  outcome trade_outcome NOT NULL,
  entry_price DECIMAL(12, 4),
  exit_price DECIMAL(12, 4),
  stop_loss_price DECIMAL(12, 4),
  take_profit_price DECIMAL(12, 4),
  contracts INTEGER DEFAULT 1,
  tick_size DECIMAL(10, 6),
  tick_value DECIMAL(10, 4),
  rr_planned DECIMAL(5, 2),
  rr_actual DECIMAL(5, 2),
  pnl_ticks DECIMAL(10, 2),
  pnl_dollars DECIMAL(12, 2),
  fees DECIMAL(8, 2) DEFAULT 5.00,
  pnl_net DECIMAL(12, 2),
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  asset_class asset_class,
  session trading_session,
  setup_notes TEXT,
  execution_notes TEXT,
  review_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  emotional_state VARCHAR(50),
  followed_plan BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade images table
CREATE TABLE IF NOT EXISTS trade_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) DEFAULT 'image/webp',
  file_size INTEGER,
  caption VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades (trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON trades (strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON trades (outcome);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades (session);
CREATE INDEX IF NOT EXISTS idx_trade_images_trade_id ON trade_images (trade_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS set_trades_updated_at ON trades;
CREATE TRIGGER set_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_strategies_updated_at ON strategies;
CREATE TRIGGER set_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
