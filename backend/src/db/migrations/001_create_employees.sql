-- Enable trigram extension for full-text search on full_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigger function to keep updated_at in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS employees (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  full_name     TEXT        GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email         TEXT        NOT NULL UNIQUE,
  job_title     TEXT        NOT NULL,
  country       CHAR(2)     NOT NULL,
  department    TEXT        NOT NULL,
  salary_cents  BIGINT      NOT NULL CHECK (salary_cents > 0),
  currency      CHAR(3)     NOT NULL DEFAULT 'USD',
  hire_date     DATE        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER employees_set_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for insight queries and filtering
CREATE INDEX IF NOT EXISTS idx_employees_country          ON employees (country);
CREATE INDEX IF NOT EXISTS idx_employees_country_job_title ON employees (country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_job_title        ON employees (job_title);

-- GIN trigram index for full-name search via ILIKE / similarity
CREATE INDEX IF NOT EXISTS idx_employees_full_name_trgm   ON employees USING gin (full_name gin_trgm_ops);
