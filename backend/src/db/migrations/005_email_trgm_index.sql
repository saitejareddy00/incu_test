-- Trigram index for email search via ILIKE in listEmployees (q param).
CREATE INDEX IF NOT EXISTS idx_employees_email_trgm ON employees USING gin (email gin_trgm_ops);
