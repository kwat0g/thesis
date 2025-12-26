'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createProductionOrder } from '@/services/api/production';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateProductionOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    priority: 'normal',
    plannedStartDate: '',
    plannedEndDate: '',
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await createProductionOrder({
        itemId: parseInt(formData.itemId),
        quantity: parseFloat(formData.quantity),
        priority: formData.priority,
        plannedStartDate: formData.plannedStartDate,
        plannedEndDate: formData.plannedEndDate,
        notes: formData.notes || undefined,
      });

      router.push(`/production/${response.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create production order');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/production"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Production Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new internal production order
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                Item ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="itemId"
                required
                value={formData.itemId}
                onChange={(e) => handleChange('itemId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter item ID"
              />
              <p className="mt-1 text-xs text-gray-500">Enter the ID of the item to produce</p>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                required
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                required
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="plannedStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Planned Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="plannedStartDate"
                required
                value={formData.plannedStartDate}
                onChange={(e) => handleChange('plannedStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="plannedEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Planned End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="plannedEndDate"
                required
                value={formData.plannedEndDate}
                onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or instructions..."
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href="/production"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Production Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
