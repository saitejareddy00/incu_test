-- Use timestamptz for effective periods so multiple salary changes per day are allowed.
-- now() default on effective_from; clock_timestamp() is used at write time in the app layer.

ALTER TABLE employee_history
  ALTER COLUMN effective_from TYPE TIMESTAMPTZ
    USING (effective_from::timestamp AT TIME ZONE 'UTC'),
  ALTER COLUMN effective_to TYPE TIMESTAMPTZ
    USING (
      CASE
        WHEN effective_to IS NULL THEN NULL
        ELSE (effective_to::timestamp AT TIME ZONE 'UTC')
      END
    );

ALTER TABLE employee_history
  ALTER COLUMN effective_from SET DEFAULT now();
