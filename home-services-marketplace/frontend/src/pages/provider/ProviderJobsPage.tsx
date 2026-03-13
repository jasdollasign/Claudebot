import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { Booking, BookingStatus, SERVICE_ICONS, SERVICE_LABELS } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Briefcase } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_FILTERS = [
  { value: '', label: 'All Jobs' },
  { value: 'pending', label: 'Available' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function ProviderJobsPage() {
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>(
    (searchParams.get('status') as BookingStatus) || ''
  );

  const { data: jobs, isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/bookings?${params.toString()}`).then(r => r.data);
    },
    refetchInterval: 30000,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-600 mt-1">Browse available jobs and manage your work.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as BookingStatus | '')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500">
            {statusFilter === 'pending' ? 'No new jobs available right now. Check back soon!' : 'No jobs in this status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              to={`/provider/jobs/${job.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{SERVICE_ICONS[job.serviceType]}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{SERVICE_LABELS[job.serviceType]}</h3>
                      <StatusBadge status={job.status} />
                      {job.status === 'pending' && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          Available to accept
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.propertyAddress || job.propertyName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{format(new Date(job.scheduledDate), 'EEE, MMM d, yyyy')}</span>
                      <span>at {job.scheduledTime}</span>
                      <span>{job.estimatedHours}h estimated</span>
                    </div>
                    {job.specialInstructions && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{job.specialInstructions}"</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xl font-bold text-gray-900">${job.price?.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">you earn ${((job.price || 0) * 0.85).toFixed(0)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
