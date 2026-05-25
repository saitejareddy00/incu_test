import { describe, it, expect } from 'vitest';
import { withTestDb } from './db';

describe('withTestDb', () => {
  it('exposes a working pg client inside the callback', async () => {
    await withTestDb(async (client) => {
      const { rows } = await client.query<{ result: number }>('SELECT 1 + 1 AS result');
      expect(rows[0].result).toBe(2);
    });
  });

  it('rolls back inserts after the callback — row is absent outside the transaction', async () => {
    let insertedId: string | undefined;

    // Insert a row inside a withTestDb block
    await withTestDb(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO employees
           (first_name, last_name, email, job_title, country, department, salary_cents, hire_date)
         VALUES
           ('Test', 'User', 'txn-rollback@example.com', 'Engineer', 'US', 'Engineering', 100000, '2024-01-01')
         RETURNING id`,
      );
      insertedId = rows[0].id;

      // Visible inside the transaction
      const { rowCount } = await client.query(
        'SELECT 1 FROM employees WHERE id = $1',
        [insertedId],
      );
      expect(rowCount).toBe(1);
    });

    // Must be absent after rollback — use a fresh transaction to verify
    await withTestDb(async (client) => {
      const { rowCount } = await client.query(
        'SELECT 1 FROM employees WHERE id = $1',
        [insertedId],
      );
      expect(rowCount).toBe(0);
    });
  });

  it('surfaces errors thrown inside the callback', async () => {
    await expect(
      withTestDb(async () => {
        throw new Error('inner error');
      }),
    ).rejects.toThrow('inner error');
  });
});
