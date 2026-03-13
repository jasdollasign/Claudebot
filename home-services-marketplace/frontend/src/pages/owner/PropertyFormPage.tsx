import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { PropertyType } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'house', label: 'House', icon: '🏡' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'condo', label: 'Condo', icon: '🏙️' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'cabin', label: 'Cabin', icon: '🏕️' },
  { value: 'other', label: 'Other', icon: '🏠' },
];

export function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    propertyType: 'house' as PropertyType,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: '',
    notes: '',
    accessInstructions: '',
  });

  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet?.toString() || '',
        notes: property.notes || '',
        accessInstructions: property.accessInstructions || '',
      });
    }
  }, [property]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? api.put(`/properties/${id}`, data) : api.post('/properties', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast.success(isEdit ? 'Property updated' : 'Property added');
      navigate('/owner/properties');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save property'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, squareFeet: form.squareFeet ? parseInt(form.squareFeet) : undefined });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Property Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, propertyType: pt.value }))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${form.propertyType === pt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-2xl mb-1">{pt.icon}</div>
                <p className="text-xs font-medium text-gray-700">{pt.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Beach House Retreat"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
              <input type="number" min="0" max="20" required value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: parseInt(e.target.value) }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
              <input type="number" min="0" max="20" step="0.5" required value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: parseFloat(e.target.value) }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sq Ft</label>
              <input type="number" value={form.squareFeet} onChange={e => setForm(f => ({ ...f, squareFeet: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Optional" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Address</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
            <input type="text" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input type="text" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input type="text" required maxLength={2} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="FL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
              <input type="text" required value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Notes & Access</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Special notes for service providers..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Access Instructions</label>
            <textarea rows={3} value={form.accessInstructions} onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Lockbox code, gate code, key location..." />
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Property' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
