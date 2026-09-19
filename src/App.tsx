import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from '@/layouts/MainLayout';
import Attendance from '@/pages/Attendance';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import NotFound from '@/pages/NotFound';
import Reports from '@/pages/Reports';
import Schedule from '@/pages/Schedule';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}