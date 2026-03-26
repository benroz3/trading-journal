-- Change default fees to 0 (user controls fees per trade)
ALTER TABLE trades ALTER COLUMN fees SET DEFAULT 0;