import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { Property } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Building2, MapPin, Plus, Trash2, Edit2, BedDouble, Bath } from 'lucide-react';
import toast from 'react-hot-toast';

export function PropertiesPage() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property removed');
      setDeletingId(null);
    },
    onError: () => toast.error('Failed to remove property'),
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage your rental properties.</p>
        </div>
        <Link
          to="/owner/properties/new"
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      {properties?.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-500 mb-6">Add your first property to start booking services.</p>
          <Link to="/owner/properties/new" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties?.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                    {p.propertyType === 'house' ? '🏡' : p.propertyType === 'condo' ? '🏢' : p.propertyType === 'cabin' ? '🏕️' : '🏠'}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/owner/properties/${p.id}/edit`} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    {deletingId === p.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteMutation.mutate(p.id)} className="text-xs text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded">Confirm</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 px-2 py-1 hover:bg-gray-100 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{p.city}, {p.state}</span>
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    <span>{p.bedrooms} bed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{p.bathrooms} bath</span>
                  </div>
                  {p.squareFeet && <span>{p.squareFeet.toLocaleString()} sqft</span>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    {p.totalBookings || 0} bookings total
                  </div>
                  <Link
                    to={`/owner/bookings/new?propertyId=${p.id}`}
                    className="text-sm text-primary-600 font-medium hover:underline"
                  >
                    Book service
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
