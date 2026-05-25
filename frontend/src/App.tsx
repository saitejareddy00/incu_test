import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import InsightsPage from './pages/InsightsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
