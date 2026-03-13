import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Booking, SERVICE_ICONS, SERVICE_LABELS } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StarRating } from '../../components/common/StarRating';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Briefcase, DollarSign, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function ProviderDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['provider-stats'],
    queryFn: () => api.get('/bookings/provider/stats').then(r => r.data),
  });

  const { data: activeJobs } = useQuery<Booking[]>({
    queryKey: ['bookings', 'active'],
    queryFn: () => api.get('/bookings?status=accepted').then(r => r.data),
  });

  const { data: availableJobs } = useQuery<Booking[]>({
    queryKey: ['bookings', 'pending'],
    queryFn: () => api.get('/bookings?status=pending').then(r => r.data.slice(0, 5)),
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  const rating = user?.providerProfile?.rating || stats?.rating || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={rating} showNumber size="sm" />
            <span className="text-gray-500 text-sm">· {stats?.totalJobs || 0} jobs completed</span>
          </div>
        </div>
        <Link to="/provider/profile" className="text-primary-600 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-50 font-medium text-sm">
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: stats?.totalJobs || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Available Jobs', value: stats?.pendingJobs || 0, icon: Briefcase, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'This Month', value: `$${(stats?.monthEarnings || 0).toFixed(0)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
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

      {/* Rating Card */}
      {rating > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
            <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
          </div>
          <div>
            <p className="font-bold text-2xl text-gray-900">{rating.toFixed(1)}</p>
            <p className="text-gray-600 text-sm">Your average rating from {user?.providerProfile?.totalReviews || 0} reviews</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Active Jobs</h2>
            <Link to="/provider/jobs" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {activeJobs?.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active jobs. Browse available jobs below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs?.map(b => (
                <Link key={b.id} to={`/provider/jobs/${b.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-2xl">{SERVICE_ICONS[b.serviceType]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{SERVICE_LABELS[b.serviceType]}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.propertyName} · {format(new Date(b.scheduledDate), 'MMM d')} at {b.scheduledTime}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${b.price?.toFixed(0)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Available Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Available Jobs</h2>
            <Link to="/provider/jobs?status=pending" className="text-sm text-primary-600 hover:underline">Browse all</Link>
          </div>
          {availableJobs?.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No new jobs available right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableJobs?.map(b => (
                <Link key={b.id} to={`/provider/jobs/${b.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-dashed border-gray-200 rounded-lg">
                  <div className="text-2xl">{SERVICE_ICONS[b.serviceType]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{SERVICE_LABELS[b.serviceType]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.propertyAddress} · {format(new Date(b.scheduledDate), 'MMM d')} at {b.scheduledTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">${b.price?.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">{b.estimatedHours}h</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
