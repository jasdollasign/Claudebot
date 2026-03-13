import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../hooks/useApi';
import { Notification } from '../types';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NOTIF_ICONS: Record<string, string> = {
  new_job: '💼',
  booking_accepted: '✅',
  job_started: '🔄',
  job_completed: '🎉',
  booking_cancelled: '❌',
};

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('All marked as read');
    },
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const unread = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-gray-600 mt-1">{unread} unread notification{unread !== 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && (
          <button onClick={() => readAllMutation.mutate()} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications?.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && readMutation.mutate(n.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${n.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{NOTIF_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium text-sm ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className={`text-sm mt-0.5 ${n.read ? 'text-gray-500' : 'text-gray-700'}`}>{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
