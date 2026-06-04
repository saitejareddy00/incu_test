import pg from 'pg';
import type { CreateHistoryInput, EmployeeHistoryRow } from './schemas';

export class EmployeeHistoryRepository {
  async insert(_client: pg.PoolClient, _input: CreateHistoryInput): Promise<EmployeeHistoryRow> {
    throw new Error('Not implemented');
  }
}
