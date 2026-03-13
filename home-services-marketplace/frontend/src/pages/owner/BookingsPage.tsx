import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { Booking, BookingStatus, ServiceType, SERVICE_ICONS, SERVICE_LABELS } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarDays, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_FILTERS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | ''>('');

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', statusFilter, serviceFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (serviceFilter) params.set('serviceType', serviceFilter);
      return api.get(`/bookings?${params.toString()}`).then(r => r.data);
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage all your service bookings.</p>
        </div>
        <Link to="/owner/bookings/new" className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 font-medium">
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter:</span>
        </div>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value as ServiceType | '')}
          className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-600 bg-white focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">All Services</option>
          {Object.entries(SERVICE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-6">
            {statusFilter ? `No ${statusFilter} bookings.` : 'You haven\'t made any bookings yet.'}
          </p>
          <Link to="/owner/bookings/new" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">
            Book Your First Service
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {bookings?.map((b) => (
              <Link key={b.id} to={`/owner/bookings/${b.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="text-2xl flex-shrink-0">{SERVICE_ICONS[b.serviceType]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{SERVICE_LABELS[b.serviceType]}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {b.propertyName} · {format(new Date(b.scheduledDate), 'MMM d, yyyy')} at {b.scheduledTime}
                  </p>
                  {b.providerName && (
                    <p className="text-xs text-gray-400 mt-0.5">Provider: {b.providerName}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">${b.price?.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{b.estimatedHours}h</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
