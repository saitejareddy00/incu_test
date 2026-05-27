/** All compensation is stored and aggregated in US dollars (no FX conversion). */
export const EMPLOYEE_CURRENCY = 'USD' as const;

export type EmployeeCurrency = typeof EMPLOYEE_CURRENCY;
