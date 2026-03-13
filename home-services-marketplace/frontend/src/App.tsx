import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { PageLoader } from './components/common/LoadingSpinner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardRedirect } from './pages/DashboardRedirect';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';

// Owner pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { PropertiesPage } from './pages/owner/PropertiesPage';
import { PropertyFormPage } from './pages/owner/PropertyFormPage';
import { BookingsPage } from './pages/owner/BookingsPage';
import { BookingFormPage } from './pages/owner/BookingFormPage';

// Provider pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderJobsPage } from './pages/provider/ProviderJobsPage';
import { ProviderEarningsPage } from './pages/provider/ProviderEarningsPage';
import { ProviderProfilePage } from './pages/provider/ProviderProfilePage';

function PrivateRoute({ children, role }: { children: React.ReactNode; role?: 'owner' | 'provider' | 'admin' }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><LandingPage /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Auth redirect */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Owner routes */}
      <Route path="/owner" element={<PrivateRoute role="owner"><Layout><OwnerDashboard /></Layout></PrivateRoute>} />
      <Route path="/owner/properties" element={<PrivateRoute role="owner"><Layout><PropertiesPage /></Layout></PrivateRoute>} />
      <Route path="/owner/properties/new" element={<PrivateRoute role="owner"><Layout><PropertyFormPage /></Layout></PrivateRoute>} />
      <Route path="/owner/properties/:id/edit" element={<PrivateRoute role="owner"><Layout><PropertyFormPage /></Layout></PrivateRoute>} />
      <Route path="/owner/bookings" element={<PrivateRoute role="owner"><Layout><BookingsPage /></Layout></PrivateRoute>} />
      <Route path="/owner/bookings/new" element={<PrivateRoute role="owner"><Layout><BookingFormPage /></Layout></PrivateRoute>} />
      <Route path="/owner/bookings/:id" element={<PrivateRoute role="owner"><Layout><BookingDetailPage /></Layout></PrivateRoute>} />

      {/* Provider routes */}
      <Route path="/provider" element={<PrivateRoute role="provider"><Layout><ProviderDashboard /></Layout></PrivateRoute>} />
      <Route path="/provider/jobs" element={<PrivateRoute role="provider"><Layout><ProviderJobsPage /></Layout></PrivateRoute>} />
      <Route path="/provider/jobs/:id" element={<PrivateRoute role="provider"><Layout><BookingDetailPage /></Layout></PrivateRoute>} />
      <Route path="/provider/earnings" element={<PrivateRoute role="provider"><Layout><ProviderEarningsPage /></Layout></PrivateRoute>} />
      <Route path="/provider/profile" element={<PrivateRoute role="provider"><Layout><ProviderProfilePage /></Layout></PrivateRoute>} />

      {/* Shared */}
      <Route path="/notifications" element={<PrivateRoute><Layout><NotificationsPage /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><ProviderProfilePage /></Layout></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
