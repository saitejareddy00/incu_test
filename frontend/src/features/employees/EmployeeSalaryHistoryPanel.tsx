import { Box, Paper, Skeleton } from '@mui/material';
import { useEmployeeHistory } from '../../api/hooks';
import { SalaryHistoryChart } from './SalaryHistoryChart';
import { SalaryHistoryList } from './SalaryHistoryList';

interface Props {
  employeeId: string;
}

export function EmployeeSalaryHistoryPanel({ employeeId }: Props) {
  const { data, isPending, isError } = useEmployeeHistory(employeeId);

  if (isPending) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={160} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <SalaryHistoryChart history={[]} />
      </Paper>
    );
  }

  return (
    <Box>
      <SalaryHistoryChart history={data.data} />
      <SalaryHistoryList history={data.data} />
    </Box>
  );
}
