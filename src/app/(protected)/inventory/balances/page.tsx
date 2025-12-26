'use client';

import { useEffect, useState } from 'react';
import { getInventoryBalances } from '@/services/api/inventory';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { formatNumber } from '@/utils/formatters';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface InventoryBalance {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  warehouseId: number;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityUnderInspection: number;
  quantityRejected: number;
  unitOfMeasure: string;
}

export default function InventoryBalancesPage() {
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getInventoryBalances({
        warehouseId: warehouseFilter ? parseInt(warehouseFilter) : undefined,
      });
      setBalances(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [warehouseFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading inventory balances..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchBalances} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Balances</h1>
        <p className="mt-1 text-sm text-gray-500">
          View stock levels by item and warehouse
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <input
                type="number"
                placeholder="Filter by Warehouse ID"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={fetchBalances}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {balances.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No inventory balances found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Under Inspection
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {balance.itemCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {balance.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.warehouseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatNumber(balance.quantityOnHand)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(balance.quantityReserved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {formatNumber(balance.quantityAvailable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">
                      {formatNumber(balance.quantityUnderInspection)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatNumber(balance.quantityRejected)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {balance.unitOfMeasure}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
