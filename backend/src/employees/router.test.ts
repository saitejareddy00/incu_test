import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app/app';
import { getTestPool } from '../test/helpers/db';

// Create the app once — pool is lazy so no DB connection happens at load time.
const app = createApp(getTestPool());

afterEach(async () => {
  await getTestPool().query('DELETE FROM employees');
});

const validInput = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 120_000,
  currency: 'USD',
  hireDate: '2024-01-15',
};

// ── POST /api/employees ───────────────────────────────────────────────────────

describe('POST /api/employees', () => {
  it('creates an employee and returns 201 with the row', async () => {
    const res = await request(app).post('/api/employees').send(validInput);

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.email).toBe(validInput.email);
    expect(res.body.fullName).toBe('Alice Smith');
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(app).post('/api/employees').send({ firstName: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/employees').send(validInput);

    const res = await request(app).post('/api/employees').send(validInput);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

// ── GET /api/employees ────────────────────────────────────────────────────────

describe('GET /api/employees', () => {
  it('returns an empty list when there are no employees', async () => {
    const res = await request(app).get('/api/employees');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  it('returns a paginated list with total', async () => {
    await request(app).post('/api/employees').send(validInput);
    await request(app)
      .post('/api/employees')
      .send({ ...validInput, email: 'bob@example.com', firstName: 'Bob' });

    const res = await request(app).get('/api/employees').query({ page: 1, pageSize: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(1);
  });

  it('filters by country', async () => {
    await request(app).post('/api/employees').send(validInput);
    await request(app)
      .post('/api/employees')
      .send({ ...validInput, email: 'bob@example.com', country: 'GB' });

    const res = await request(app).get('/api/employees').query({ country: 'GB' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].country).toBe('GB');
  });

  it('returns 400 for an invalid sortBy value', async () => {
    const res = await request(app).get('/api/employees').query({ sortBy: 'not_a_column' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── GET /api/employees/:id ────────────────────────────────────────────────────

describe('GET /api/employees/:id', () => {
  it('returns 200 with the employee row', async () => {
    const created = await request(app).post('/api/employees').send(validInput);

    const res = await request(app).get(`/api/employees/${created.body.id as string}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.email).toBe(validInput.email);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/employees/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ── PATCH /api/employees/:id ──────────────────────────────────────────────────

describe('PATCH /api/employees/:id', () => {
  it('updates and returns 200 with the updated row', async () => {
    const created = await request(app).post('/api/employees').send(validInput);

    const res = await request(app)
      .patch(`/api/employees/${created.body.id as string}`)
      .send({ jobTitle: 'Senior Engineer', salaryCents: 150_000 });

    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe('Senior Engineer');
    expect(res.body.salaryCents).toBe(150_000);
    expect(res.body.email).toBe(validInput.email);
  });

  it('returns 400 for an invalid patch body', async () => {
    const created = await request(app).post('/api/employees').send(validInput);

    const res = await request(app)
      .patch(`/api/employees/${created.body.id as string}`)
      .send({ salaryCents: -100 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .patch('/api/employees/00000000-0000-0000-0000-000000000000')
      .send({ jobTitle: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 409 on duplicate email', async () => {
    const first = await request(app).post('/api/employees').send(validInput);
    const second = await request(app)
      .post('/api/employees')
      .send({ ...validInput, email: 'bob@example.com' });

    const res = await request(app)
      .patch(`/api/employees/${second.body.id as string}`)
      .send({ email: first.body.email as string });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────

describe('DELETE /api/employees/:id', () => {
  it('soft-deletes the employee and returns 204', async () => {
    const created = await request(app).post('/api/employees').send(validInput);

    const res = await request(app).delete(`/api/employees/${created.body.id as string}`);

    expect(res.status).toBe(204);
    const get = await request(app).get(`/api/employees/${created.body.id as string}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/employees/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
