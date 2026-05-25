-- Soft-delete support: employees are never physically removed.
-- A NULL deleted_at means the record is active; a timestamp means it is deleted.
ALTER TABLE employees
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index covers only active rows — the hot path for every query.
CREATE INDEX employees_active_idx ON employees (id) WHERE deleted_at IS NULL;
