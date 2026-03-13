import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/LoadingSpinner';

export function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'owner') return <Navigate to="/owner" replace />;
  if (user.role === 'provider') return <Navigate to="/provider" replace />;
  return <Navigate to="/" replace />;
}
