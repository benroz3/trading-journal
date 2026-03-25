-- Allow decimal position sizes (lot sizes for forex/CFD)
ALTER TABLE trades ALTER COLUMN contracts TYPE DECIMAL(10, 4);
ALTER TABLE trades ALTER COLUMN contracts SET DEFAULT 1;
