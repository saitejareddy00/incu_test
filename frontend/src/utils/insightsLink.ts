/** Build /insights path from active employee-list filters. */
export function buildInsightsPath(filters: { country?: string; jobTitle?: string }): string {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.jobTitle) params.set('jobTitle', filters.jobTitle);
  const query = params.toString();
  return query ? `/insights?${query}` : '/insights';
}
