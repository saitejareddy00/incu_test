-- Salary and job-title history per employee.
CREATE TABLE IF NOT EXISTS employee_history (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  salary_cents   BIGINT      NOT NULL CHECK (salary_cents > 0),
  job_title      TEXT        NOT NULL,
  effective_from DATE        NOT NULL,
  effective_to   DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_history_dates_chk
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Composite index serves both the employee_id filter and the effective_from DESC
-- sort from a single index scan (no separate sort step).
CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id_effective_from
  ON employee_history (employee_id, effective_from DESC);
