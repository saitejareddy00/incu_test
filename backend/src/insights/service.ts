import pg from 'pg';
import { NotFoundError } from '../app/errors';
import { getCountryJobStats, type CountryJobStats } from './repository/country-job-stats';
import { getCountryStats, type CountryStats } from './repository/country-stats';
import { getOverviewMetrics, type OverviewMetrics } from './repository/overview';

export class InsightsService {
  constructor(private readonly pool: pg.Pool) {}

  async countryStats(country: string): Promise<CountryStats> {
    const client = await this.pool.connect();
    try {
      const stats = await getCountryStats(client, country);
      if (!stats) throw new NotFoundError(`No active employees found for country '${country}'`);
      return stats;
    } finally {
      client.release();
    }
  }

  async countryJobStats(country: string, jobTitle: string): Promise<CountryJobStats> {
    const client = await this.pool.connect();
    try {
      const stats = await getCountryJobStats(client, country, jobTitle);
      if (!stats) {
        throw new NotFoundError(
          `No active employees found for country '${country}' and job title '${jobTitle}'`,
        );
      }
      return stats;
    } finally {
      client.release();
    }
  }

  async overview(): Promise<OverviewMetrics> {
    const client = await this.pool.connect();
    try {
      return await getOverviewMetrics(client);
    } finally {
      client.release();
    }
  }
}
