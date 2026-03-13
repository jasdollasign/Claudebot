import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { ServiceType, SERVICE_LABELS } from '../../types';
import { StarRating } from '../../components/common/StarRating';
import toast from 'react-hot-toast';

const ALL_SERVICES: ServiceType[] = ['cleaning', 'handyman', 'landscaping', 'pet_sitting', 'home_check', 'other'];

export function ProviderProfilePage() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const profile = user?.providerProfile;

  const [form, setForm] = useState({
    bio: profile?.bio || '',
    hourlyRate: profile?.hourlyRate?.toString() || '',
    services: profile?.services || [],
    serviceRadiusMiles: profile?.serviceRadiusMiles || 25,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        hourlyRate: profile.hourlyRate?.toString() || '',
        services: profile.services || [],
        serviceRadiusMiles: profile.serviceRadiusMiles || 25,
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: any) => api.put('/providers/me/profile', data),
    onSuccess: () => {
      toast.success('Profile updated!');
      refreshUser();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const toggleService = (s: ServiceType) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      bio: form.bio,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
      services: form.services,
      serviceRadiusMiles: form.serviceRadiusMiles,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
        <p className="text-gray-600 mt-1">Customize your profile to attract more clients.</p>
      </div>

      {/* Stats */}
      {profile && profile.totalReviews > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Your Performance</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <StarRating rating={profile.rating} showNumber size="md" />
              <p className="text-xs text-gray-500 mt-1">Overall</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile.totalReviews}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile.totalJobs}</p>
              <p className="text-xs text-gray-500">Jobs Done</p>
            </div>
            {profile.backgroundChecked && (
              <div className="text-center">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✓ Background Checked</span>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">About You</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              placeholder="Describe your experience and specialties..."
            />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500 characters</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate ($)</label>
              <input
                type="number"
                min="10"
                max="500"
                step="5"
                value={form.hourlyRate}
                onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Service Radius: {form.serviceRadiusMiles} miles
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={form.serviceRadiusMiles}
                onChange={e => setForm(f => ({ ...f, serviceRadiusMiles: parseInt(e.target.value) }))}
                className="w-full mt-3 accent-primary-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Services You Offer</h2>
          <div className="grid grid-cols-2 gap-3">
            {ALL_SERVICES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`p-3 rounded-lg border-2 text-left transition-colors flex items-center gap-2 ${form.services.includes(s) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs flex-shrink-0 ${form.services.includes(s) ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300'}`}>
                  {form.services.includes(s) && '✓'}
                </span>
                <span className="text-sm font-medium text-gray-700">{SERVICE_LABELS[s]}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
