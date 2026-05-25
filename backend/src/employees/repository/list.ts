import pg from 'pg';
import { EMPLOYEE_COLUMNS, toRow } from './mappers';
import { SORT_COLUMNS, type ListEmployeesParams, type ListEmployeesResult } from './types';

interface WhereClause {
  sql: string;
  params: unknown[];
}

function buildWhereClause(
  filters: Pick<ListEmployeesParams, 'country' | 'jobTitle' | 'q'>,
): WhereClause {
  // Always exclude soft-deleted rows; this is a system invariant, not a user filter.
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];

  if (filters.country) {
    params.push(filters.country);
    conditions.push(`country = $${params.length}`);
  }
  if (filters.jobTitle) {
    params.push(filters.jobTitle);
    conditions.push(`job_title = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`full_name ILIKE $${params.length}`);
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export async function listEmployees(
  client: pg.PoolClient,
  params: ListEmployeesParams,
): Promise<ListEmployeesResult> {
  const {
    page = 1,
    pageSize = 20,
    country,
    jobTitle,
    q,
    sortBy = 'full_name',
    sortDir = 'asc',
  } = params;

  const safeSort = SORT_COLUMNS.includes(sortBy) ? sortBy : 'full_name';
  const safeDir = sortDir === 'desc' ? 'DESC' : 'ASC';

  const { sql: whereSql, params: whereParams } = buildWhereClause({ country, jobTitle, q });

  const countResult = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM employees ${whereSql}`,
    whereParams,
  );
  const total = Number(countResult.rows[0].count);

  const offset = (page - 1) * pageSize;
  const dataParams = [...whereParams, pageSize, offset];
  const limitIdx = dataParams.length - 1;
  const offsetIdx = dataParams.length;

  const { rows } = await client.query(
    `SELECT ${EMPLOYEE_COLUMNS} FROM employees ${whereSql}
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    dataParams,
  );

  return { data: rows.map((r) => toRow(r as Record<string, unknown>)), total };
}
