import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app/app';
import { getTestPool } from '../test/helpers/db';

const app = createApp(getTestPool());

afterEach(async () => {
  await getTestPool().query('DELETE FROM employees');
});

const validEmployee = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 100_000,
  currency: 'USD',
  hireDate: '2024-01-15',
};

// ── GET /api/insights/overview ────────────────────────────────────────────────

describe('GET /api/insights/overview', () => {
  it('returns 200 with all four top-level keys', async () => {
    await request(app).post('/api/employees').send(validEmployee);

    const res = await request(app).get('/api/insights/overview');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalEmployees: 1,
      topCountriesByAvgSalary: expect.any(Array),
      topJobTitlesByAvgSalary: expect.any(Array),
      headcountByDepartment: expect.any(Array),
    });
  });

  it('returns 200 with zeros/empty arrays when no employees exist', async () => {
    const res = await request(app).get('/api/insights/overview');

    expect(res.status).toBe(200);
    expect(res.body.totalEmployees).toBe(0);
    expect(res.body.topCountriesByAvgSalary).toEqual([]);
  });
});

// ── GET /api/insights/job-titles ──────────────────────────────────────────────

describe('GET /api/insights/job-titles', () => {
  it('returns distinct job titles for active employees', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, email: 'bob@example.com', jobTitle: 'Manager' });

    const res = await request(app).get('/api/insights/job-titles');

    expect(res.status).toBe(200);
    expect(res.body.jobTitles).toEqual(expect.arrayContaining(['Engineer', 'Manager']));
  });

  it('filters job titles by country query param', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, email: 'bob@example.com', country: 'GB', jobTitle: 'Manager' });

    const res = await request(app).get('/api/insights/job-titles').query({ country: 'US' });

    expect(res.status).toBe(200);
    expect(res.body.jobTitles).toEqual(['Engineer']);
  });
});

// ── GET /api/insights/country/:country ────────────────────────────────────────

describe('GET /api/insights/country/:country', () => {
  it('returns 200 with min/max/avg/median/count for a known country', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, email: 'bob@example.com', salaryCents: 200_000 });

    const res = await request(app).get('/api/insights/country/US');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      count: 2,
      min: 100_000,
      max: 200_000,
      avg: 150_000,
      median: 150_000,
    });
  });

  it('returns 404 when the country has no active employees', async () => {
    const res = await request(app).get('/api/insights/country/ZZ');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid country code (not 2 letters)', async () => {
    const res = await request(app).get('/api/insights/country/USA');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── GET /api/insights/country/:country/job-title/:jobTitle ────────────────────

describe('GET /api/insights/country/:country/job-title/:jobTitle', () => {
  it('returns 200 with avg and count', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, email: 'bob@example.com', salaryCents: 200_000 });

    const res = await request(app).get('/api/insights/country/US/job-title/Engineer');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ avg: 150_000, count: 2 });
  });

  it('returns 404 for an unknown country + job-title combination', async () => {
    const res = await request(app).get('/api/insights/country/ZZ/job-title/Ghost');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid country code', async () => {
    const res = await request(app).get('/api/insights/country/USA/job-title/Engineer');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
