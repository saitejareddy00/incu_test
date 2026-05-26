import pg from 'pg';
import { NotFoundError } from '../app/errors';
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} from './repository/index';
import type { ListEmployeesParams, ListEmployeesResult } from './repository/index';
import type { CreateEmployeeInput, EmployeeRow, UpdateEmployeeInput } from './schemas';

/**
 * Service layer for the Employee domain.
 *
 * Responsibilities:
 *  - Acquires and releases pool clients so the controller never sees pg directly.
 *  - Translates repository nulls into NotFoundError (404).
 *  - Lets ConflictError from the repository propagate unchanged (409).
 *
 * Pass an optional `client` in tests to run all operations inside an existing
 * transaction (e.g. withTestDb BEGIN…ROLLBACK).
 */
export class EmployeeService {
  constructor(
    private readonly pool: pg.Pool,
    private readonly boundClient?: pg.PoolClient,
  ) {}

  private async withClient<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    if (this.boundClient) {
      return fn(this.boundClient);
    }
    const client = await this.pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async create(input: CreateEmployeeInput): Promise<EmployeeRow> {
    return this.withClient((client) => createEmployee(client, input));
  }

  async getById(id: string): Promise<EmployeeRow> {
    return this.withClient(async (client) => {
      const row = await getEmployeeById(client, id);
      if (!row) throw new NotFoundError(`Employee '${id}' not found`);
      return row;
    });
  }

  async list(params: ListEmployeesParams): Promise<ListEmployeesResult> {
    return this.withClient((client) => listEmployees(client, params));
  }

  async update(id: string, patch: UpdateEmployeeInput): Promise<EmployeeRow> {
    return this.withClient(async (client) => {
      const row = await updateEmployee(client, id, patch);
      if (!row) throw new NotFoundError(`Employee '${id}' not found`);
      return row;
    });
  }

  async delete(id: string): Promise<void> {
    return this.withClient(async (client) => {
      const deleted = await deleteEmployee(client, id);
      if (!deleted) throw new NotFoundError(`Employee '${id}' not found`);
    });
  }
}
