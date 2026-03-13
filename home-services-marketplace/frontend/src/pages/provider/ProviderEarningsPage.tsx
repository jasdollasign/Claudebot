import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DollarSign, TrendingUp } from 'lucide-react';

export function ProviderEarningsPage() {
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.get('/payments/earnings').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['provider-stats'],
    queryFn: () => api.get('/bookings/provider/stats').then(r => r.data),
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  const maxEarning = Math.max(...(earningsData?.earnings?.map((e: any) => e.total_payout) || [1]));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Track your income from completed jobs.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${(earningsData?.totalLifetime || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Lifetime</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${(stats?.monthEarnings || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-0.5">This Month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
          <p className="text-sm text-gray-500 mt-0.5">Completed Jobs</p>
        </div>
      </div>

      {earningsData?.earnings?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No earnings yet</h3>
          <p className="text-gray-500">Complete jobs to start earning.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Monthly Earnings</h2>
          <div className="space-y-4">
            {earningsData?.earnings?.map((e: any) => (
              <div key={e.month} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-500 flex-shrink-0">{e.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-primary-500 h-3 rounded-full transition-all"
                        style={{ width: `${(e.total_payout / maxEarning) * 100}%` }}
                      />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-semibold text-gray-900">${e.total_payout.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 ml-2">({e.job_count} jobs)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
            <p>Platform fee: 15% of each job. You receive 85% of the booking price.</p>
          </div>
        </div>
      )}
    </div>
  );
}
