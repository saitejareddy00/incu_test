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
 * Input validation (Zod parsing) is the controller's concern; this layer
 * accepts already-typed values.
 */
export class EmployeeService {
  constructor(private readonly pool: pg.Pool) {}

  async create(input: CreateEmployeeInput): Promise<EmployeeRow> {
    const client = await this.pool.connect();
    try {
      return await createEmployee(client, input);
    } finally {
      client.release();
    }
  }

  async getById(id: string): Promise<EmployeeRow> {
    const client = await this.pool.connect();
    try {
      const row = await getEmployeeById(client, id);
      if (!row) throw new NotFoundError(`Employee '${id}' not found`);
      return row;
    } finally {
      client.release();
    }
  }

  async list(params: ListEmployeesParams): Promise<ListEmployeesResult> {
    const client = await this.pool.connect();
    try {
      return await listEmployees(client, params);
    } finally {
      client.release();
    }
  }

  async update(id: string, patch: UpdateEmployeeInput): Promise<EmployeeRow> {
    const client = await this.pool.connect();
    try {
      const row = await updateEmployee(client, id, patch);
      if (!row) throw new NotFoundError(`Employee '${id}' not found`);
      return row;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const deleted = await deleteEmployee(client, id);
      if (!deleted) throw new NotFoundError(`Employee '${id}' not found`);
    } finally {
      client.release();
    }
  }
}
