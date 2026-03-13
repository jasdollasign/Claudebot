import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Booking, Property, SERVICE_ICONS, SERVICE_LABELS } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Building2, CalendarDays, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function OwnerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: () => api.get('/bookings/owner/stats').then(r => r.data),
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['bookings', 'recent'],
    queryFn: () => api.get('/bookings?status=&').then(r => r.data.slice(0, 5)),
  });

  if (statsLoading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your properties.</p>
        </div>
        <Link
          to="/owner/bookings/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Book a Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Properties', value: stats?.totalProperties || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Bookings', value: stats?.activeBookings || 0, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Completed Jobs', value: stats?.completedBookings || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Spent', value: `$${(stats?.totalSpent || 0).toFixed(0)}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Properties */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Your Properties</h2>
              <Link to="/owner/properties" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {properties?.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No properties yet</p>
                <Link to="/owner/properties/new" className="text-primary-600 text-sm hover:underline mt-2 block">Add a property</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties?.slice(0, 4).map((p) => (
                  <Link key={p.id} to={`/owner/properties/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg">
                      {p.propertyType === 'house' ? '🏡' : p.propertyType === 'condo' ? '🏢' : '🏠'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.city}, {p.state}</p>
                    </div>
                  </Link>
                ))}
                <Link to="/owner/properties/new" className="flex items-center gap-2 p-3 text-primary-600 hover:bg-primary-50 rounded-lg text-sm">
                  <Plus className="w-4 h-4" />
                  Add property
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
              <Link to="/owner/bookings" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {bookings?.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No bookings yet</p>
                <Link to="/owner/bookings/new" className="text-primary-600 text-sm hover:underline mt-2 block">Book your first service</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings?.map((b) => (
                  <Link key={b.id} to={`/owner/bookings/${b.id}`} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="text-2xl">{SERVICE_ICONS[b.serviceType]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{SERVICE_LABELS[b.serviceType]}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {b.propertyName} · {format(new Date(b.scheduledDate), 'MMM d')} at {b.scheduledTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">${b.price?.toFixed(0)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
