-- Trigram index for partial job_title filter (jobTitle query param).
CREATE INDEX IF NOT EXISTS idx_employees_job_title_trgm ON employees USING gin (job_title gin_trgm_ops);
