import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Booking, ChecklistItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StarRating } from '../components/common/StarRating';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ArrowLeft, CheckSquare, Square, MessageCircle, Send, AlertCircle, CheckCircle2, Play, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '', qualityScore: 5, punctualityScore: 5, communicationScore: 5 });

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['booking', id],
    queryFn: () => api.get(`/bookings/${id}`).then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: payment } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.get(`/payments/booking/${id}`).then(r => r.data).catch(() => null),
    enabled: !!booking,
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/accept`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); toast.success('Job accepted!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to accept'),
  });

  const startMutation = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/start`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); toast.success('Job started!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to start'),
  });

  const completeMutation = useMutation({
    mutationFn: (checklist: ChecklistItem[]) => api.post(`/bookings/${id}/complete`, { checklist }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); toast.success('Job completed!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to complete'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); toast.success('Booking cancelled'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to cancel'),
  });

  const messageMutation = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/messages`, { content: message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['booking', id] }); setMessage(''); },
    onError: () => toast.error('Failed to send message'),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments/create-intent', { bookingId: id });
      await api.post('/payments/confirm', { paymentId: data.paymentId });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment', id] }); toast.success('Payment authorized!'); },
    onError: () => toast.error('Payment failed'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/reviews', { bookingId: id, ...review }),
    onSuccess: () => { toast.success('Review submitted!'); setShowReview(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to submit review'),
  });

  const toggleChecklist = (itemId: string) => {
    if (!booking) return;
    const updated = booking.checklist.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    // Optimistic update via API
    api.post(`/bookings/${id}/complete`, { checklist: updated }).catch(() => {});
    qc.setQueryData(['booking', id], (old: any) => ({
      ...old,
      checklist: updated,
    }));
  };

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;
  if (!booking) return <div className="p-8 text-center text-gray-500">Booking not found</div>;

  const isOwner = user?.role === 'owner';
  const isProvider = user?.role === 'provider';
  const canAccept = isProvider && booking.status === 'pending' && !booking.providerId;
  const canStart = isProvider && booking.providerId === user?.id && booking.status === 'accepted';
  const canComplete = isProvider && booking.providerId === user?.id && booking.status === 'in_progress';
  const canCancel = ['pending', 'accepted'].includes(booking.status) && (booking.ownerId === user?.id || booking.providerId === user?.id);
  const canPay = isOwner && booking.status === 'accepted' && (!payment || payment.status === 'pending');
  const canReview = isOwner && booking.status === 'completed';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{booking.propertyName}</h1>
          <p className="text-gray-500 mt-1">{booking.propertyAddress}</p>
        </div>
        <StatusBadge status={booking.status} className="mt-1" />
      </div>

      {/* Main Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Service</p>
            <p className="font-semibold mt-0.5 capitalize">{booking.serviceType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-semibold mt-0.5">{format(new Date(booking.scheduledDate), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-semibold mt-0.5">{booking.scheduledTime}</p>
          </div>
          <div>
            <p className="text-gray-500">Price</p>
            <p className="font-semibold mt-0.5 text-primary-600">${booking.price?.toFixed(2)}</p>
          </div>
        </div>

        {booking.specialInstructions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
            <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
          </div>
        )}

        {booking.accessInstructions && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs font-medium text-amber-800 mb-1">Access Instructions</p>
            <p className="text-sm text-amber-700">{booking.accessInstructions}</p>
          </div>
        )}
      </div>

      {/* Provider Info */}
      {booking.providerName ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Service Provider</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-lg font-bold text-primary-600">
              {booking.providerName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{booking.providerName}</p>
              {booking.providerRating && <StarRating rating={booking.providerRating} showNumber size="sm" />}
              {booking.providerPhone && <p className="text-sm text-gray-500 mt-0.5">{booking.providerPhone}</p>}
            </div>
          </div>
        </div>
      ) : booking.status === 'pending' ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Awaiting Provider</p>
            <p className="text-sm text-yellow-600 mt-1">Your booking is visible to available providers. You'll be notified when someone accepts.</p>
          </div>
        </div>
      ) : null}

      {/* Payment */}
      {payment && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Service amount</span>
              <span>${payment.amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform fee</span>
              <span>${payment.platformFee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span>${payment.amount?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${payment.status === 'captured' ? 'bg-green-100 text-green-700' : payment.status === 'authorized' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {payment.status === 'captured' && <CheckCircle2 className="w-3 h-3" />}
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {canPay && (
          <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60">
            {payMutation.isPending ? 'Processing...' : 'Authorize Payment'}
          </button>
        )}
        {canAccept && (
          <button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60">
            <Play className="w-4 h-4 inline mr-1" />
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Job'}
          </button>
        )}
        {canStart && (
          <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-60">
            {startMutation.isPending ? 'Starting...' : 'Start Job'}
          </button>
        )}
        {canComplete && (
          <button onClick={() => completeMutation.mutate(booking.checklist)} disabled={completeMutation.isPending} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
          </button>
        )}
        {canReview && (
          <button onClick={() => setShowReview(true)} className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">
            Leave Review
          </button>
        )}
        {canCancel && (
          <button onClick={() => { if (window.confirm('Cancel this booking?')) cancelMutation.mutate('User requested cancellation'); }} disabled={cancelMutation.isPending} className="py-2.5 px-4 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50">
            <XCircle className="w-4 h-4 inline mr-1" />
            Cancel
          </button>
        )}
      </div>

      {/* Checklist */}
      {booking.checklist.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            Service Checklist
            <span className="ml-2 text-sm text-gray-500">
              ({booking.checklist.filter(i => i.done).length}/{booking.checklist.length} done)
            </span>
          </h2>
          <div className="space-y-2">
            {booking.checklist.map((item: ChecklistItem) => (
              <button
                key={item.id}
                type="button"
                onClick={() => (canComplete || booking.status === 'in_progress') && toggleChecklist(item.id)}
                className={`flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors ${(canComplete || booking.status === 'in_progress') ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {item.done ? <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.task}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Messages
        </h2>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {booking.messages?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No messages yet. Start the conversation!</p>
          )}
          {booking.messages?.map((msg: any) => {
            const isMe = msg.sender_id === user?.id || msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.first_name || msg.firstName}</p>}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!['completed', 'cancelled'].includes(booking.status) && (
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && message.trim() && messageMutation.mutate()}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Type a message..."
            />
            <button
              onClick={() => message.trim() && messageMutation.mutate()}
              disabled={!message.trim() || messageMutation.isPending}
              className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                <StarRating rating={review.rating} interactive onChange={r => setReview(v => ({ ...v, rating: r }))} size="lg" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Quality', key: 'qualityScore' },
                  { label: 'Punctuality', key: 'punctualityScore' },
                  { label: 'Communication', key: 'communicationScore' },
                ].map(({ label, key }) => (
                  <div key={key} className="text-center">
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <StarRating rating={(review as any)[key]} interactive onChange={r => setReview(v => ({ ...v, [key]: r }))} size="sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comments</label>
                <textarea
                  rows={3}
                  value={review.comment}
                  onChange={e => setReview(v => ({ ...v, comment: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReview(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending} className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-60">
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
