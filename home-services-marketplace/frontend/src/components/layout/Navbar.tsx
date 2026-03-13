import { Link, useNavigate } from 'react-router-dom';
import { Bell, Home, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'owner' ? '/owner' : '/provider';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">HomeServe</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={dashboardLink} className="text-gray-600 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                {user.role === 'owner' && (
                  <>
                    <Link to="/owner/properties" className="text-gray-600 hover:text-gray-900">Properties</Link>
                    <Link to="/owner/bookings" className="text-gray-600 hover:text-gray-900">Bookings</Link>
                  </>
                )}
                {user.role === 'provider' && (
                  <>
                    <Link to="/provider/jobs" className="text-gray-600 hover:text-gray-900">Jobs</Link>
                    <Link to="/provider/earnings" className="text-gray-600 hover:text-gray-900">Earnings</Link>
                  </>
                )}
                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900">
                  <Bell className="w-5 h-5" />
                  {notifData?.count > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifData.count > 9 ? '9+' : notifData.count}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium">{user.firstName}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-600">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white py-2">
          <div className="px-4 space-y-2">
            {user ? (
              <>
                <Link to={dashboardLink} className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                {user.role === 'owner' && (
                  <>
                    <Link to="/owner/properties" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Properties</Link>
                    <Link to="/owner/bookings" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Bookings</Link>
                  </>
                )}
                {user.role === 'provider' && (
                  <>
                    <Link to="/provider/jobs" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Jobs</Link>
                    <Link to="/provider/earnings" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Earnings</Link>
                  </>
                )}
                <Link to="/notifications" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Notifications</Link>
                <Link to="/profile" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block py-2 text-red-600 w-full text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="block py-2 text-primary-600 font-medium" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
