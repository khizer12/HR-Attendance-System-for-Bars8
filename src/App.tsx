import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuditLog from '@/pages/AuditLog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/features/auth';
import { AttendanceProvider } from '@/features/attendance';
import { MainLayout } from '@/layouts/MainLayout';
import Attendance from '@/pages/Attendance';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Reports from '@/pages/Reports';
import Schedule from '@/pages/Schedule';
import Settings from '@/pages/Settings';
import Unauthorized from '@/pages/Unauthorized';
import Leaves from '@/pages/Leaves';
import EmployeeDetail from '@/pages/EmployeeDetail';
import Payroll from '@/pages/Payroll';
import Notices from '@/pages/Notices';
import PayrollRun from '@/pages/PayrollRun';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected shell */}
            <Route
            path="/"
            element={
              <ProtectedRoute>
                <AttendanceProvider>
                  <MainLayout />
                </AttendanceProvider>
              </ProtectedRoute>
            }
            >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="notices" element={<Notices />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="schedule" element={<Schedule />} />

            {/* Admin-only pages */}
            <Route
              path="employees"
              element={
                <ProtectedRoute allowRoles={['super_admin', 'sub_admin']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute allowRoles={['super_admin', 'sub_admin']}>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowRoles={['super_admin', 'sub_admin']}>
                  <Reports />
                </ProtectedRoute>
            
              }
            />
            <Route
              path="payroll"
              element={
                <ProtectedRoute allowRoles={['super_admin', 'sub_admin']}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/:id"
              element={
                <ProtectedRoute allowRoles={['super_admin', 'sub_admin']}>
                  <PayrollRun />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-log"
              element={
                <ProtectedRoute allowRoles={['super_admin']}>
                  <AuditLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowRoles={['super_admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}