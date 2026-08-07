import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/common/ToastContainer';

// Landing & Auth
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// User Dashboard Pages
import { UserDashboardLayout } from './pages/user/UserDashboardLayout';
import { UserDashboardOverview } from './pages/user/UserDashboardOverview';
import { ReportIncidentPage } from './pages/user/ReportIncidentPage';
import { MyIncidentsPage } from './pages/user/MyIncidentsPage';
import { HotspotMapPage } from './pages/user/HotspotMapPage';
import { NotificationsPage } from './pages/user/NotificationsPage';
import { ProfilePage } from './pages/user/ProfilePage';

// Admin Dashboard Pages
import { AdminDashboardLayout } from './pages/admin/AdminDashboardLayout';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminIncidentsPage } from './pages/admin/AdminIncidentsPage';
import { AdminSOSPage } from './pages/admin/AdminSOSPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Authenticating Guard System...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboardOverview />} />
            <Route path="report" element={<ReportIncidentPage />} />
            <Route path="incidents" element={<MyIncidentsPage />} />
            <Route path="hotspots" element={<HotspotMapPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Command Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardOverview />} />
            <Route path="incidents" element={<AdminIncidentsPage />} />
            <Route path="sos" element={<AdminSOSPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
