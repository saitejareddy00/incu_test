import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <Typography variant="h5">Employee {id}</Typography>;
}
