-- Salaries are aggregated in insights without currency conversion; normalize to USD.
UPDATE employees
SET currency = 'USD'
WHERE currency IS DISTINCT FROM 'USD';

ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_currency_usd_chk;

ALTER TABLE employees
  ADD CONSTRAINT employees_currency_usd_chk CHECK (currency = 'USD');
