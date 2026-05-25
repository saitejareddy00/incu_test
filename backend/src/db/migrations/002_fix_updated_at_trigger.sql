-- Replace now() with clock_timestamp() so updated_at reflects real wall-clock
-- time rather than the transaction start time. This matters for correctness
-- when multiple UPDATEs happen within the same transaction (e.g. tests).
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;
