import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { Property, ServiceType, SERVICE_ICONS, SERVICE_LABELS } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';

const SERVICE_RATES: Record<ServiceType, number> = {
  cleaning: 80, handyman: 95, landscaping: 75, pet_sitting: 45, home_check: 60, other: 70,
};

const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  cleaning: 'Turnover cleaning, deep clean, standard clean',
  handyman: 'Repairs, installations, maintenance',
  landscaping: 'Lawn care, gardening, snow removal',
  pet_sitting: 'Feeding, walks, overnight stays',
  home_check: 'Remote inspection with photo report',
  other: 'Other services',
};

const SERVICES: ServiceType[] = ['cleaning', 'handyman', 'landscaping', 'pet_sitting', 'home_check', 'other'];

export function BookingFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    propertyId: searchParams.get('propertyId') || '',
    serviceType: 'cleaning' as ServiceType,
    scheduledDate: '',
    scheduledTime: '10:00',
    estimatedHours: 2,
    specialInstructions: '',
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const estimatedPrice = form.estimatedHours * SERVICE_RATES[form.serviceType];

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/bookings', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created!');
      navigate(`/owner/bookings/${res.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create booking'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId) { toast.error('Please select a property'); return; }
    if (!form.scheduledDate) { toast.error('Please select a date'); return; }
    mutation.mutate(form);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Book a Service</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Select Property</h2>
          {properties?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">You haven't added any properties yet.</p>
              <button type="button" onClick={() => navigate('/owner/properties/new')} className="text-primary-600 hover:underline text-sm">Add a property first</button>
            </div>
          ) : (
            <div className="space-y-2">
              {properties?.map((p) => (
                <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.propertyId === p.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="property" value={p.id} checked={form.propertyId === p.id} onChange={() => setForm(f => ({ ...f, propertyId: p.id }))} className="sr-only" />
                  <span className="text-xl">{p.propertyType === 'house' ? '🏡' : '🏠'}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.address}, {p.city}, {p.state}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Service Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Service Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, serviceType: s }))}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${form.serviceType === s ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{SERVICE_ICONS[s]}</span>
                  <span className="font-medium text-gray-900 text-sm">{SERVICE_LABELS[s]}</span>
                </div>
                <p className="text-xs text-gray-500">{SERVICE_DESCRIPTIONS[s]}</p>
                <p className="text-xs font-medium text-primary-600 mt-1">${SERVICE_RATES[s]}/hr</p>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                required
                min={today}
                value={form.scheduledDate}
                onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
              <input
                type="time"
                required
                value={form.scheduledTime}
                onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Duration: {form.estimatedHours} hours
            </label>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={form.estimatedHours}
              onChange={e => setForm(f => ({ ...f, estimatedHours: parseFloat(e.target.value) }))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>30 min</span>
              <span>8 hours</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions</label>
            <textarea
              rows={3}
              value={form.specialInstructions}
              onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              placeholder="Any specific requests or instructions for the service provider..."
            />
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-primary-50 rounded-xl border border-primary-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-600" />
            Price Estimate
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{SERVICE_LABELS[form.serviceType]} ({form.estimatedHours}h × ${SERVICE_RATES[form.serviceType]}/hr)</span>
              <span>${estimatedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Platform fee (15%)</span>
              <span>${(estimatedPrice * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 text-base border-t border-primary-200 pt-2 mt-2">
              <span>Total</span>
              <span>${estimatedPrice.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Payment is collected when a provider accepts your booking.</p>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending || !form.propertyId} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60">
            {mutation.isPending ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
