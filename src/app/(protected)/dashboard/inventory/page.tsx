'use client';

import { useEffect, useState } from 'react';
import { getInventoryDashboard } from '@/services/api/dashboard';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ArchiveBoxIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface InventoryDashboard {
  totalItems: number;
  stockByStatus: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    reserved: number;
  };
  lowStockItems: Array<{
    itemId: number;
    itemCode: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    warehouseId: number;
  }>;
  totalStockValue: number;
}

export default function InventoryDashboardPage() {
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getInventoryDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading inventory dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stock levels, low stock alerts, and inventory value
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Items"
          value={dashboard.totalItems}
          icon={<ArchiveBoxIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="In Stock"
          value={dashboard.stockByStatus.in_stock}
          subtitle="Above minimum level"
        />
        <DashboardCard
          title="Low Stock Items"
          value={dashboard.stockByStatus.low_stock}
          alert={dashboard.stockByStatus.low_stock > 0}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Total Stock Value"
          value={formatCurrency(dashboard.totalStockValue)}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Stock Status Breakdown</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StockStatusCard
              label="In Stock"
              count={dashboard.stockByStatus.in_stock}
              color="green"
            />
            <StockStatusCard
              label="Low Stock"
              count={dashboard.stockByStatus.low_stock}
              color="yellow"
            />
            <StockStatusCard
              label="Out of Stock"
              count={dashboard.stockByStatus.out_of_stock}
              color="red"
            />
            <StockStatusCard
              label="Reserved"
              count={dashboard.stockByStatus.reserved}
              color="blue"
            />
          </div>
        </div>
      </div>

      {dashboard.lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
              <span className="text-sm text-gray-500">
                Showing top {dashboard.lowStockItems.length} items requiring reorder
              </span>
            </div>
          </div>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shortage
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.lowStockItems.map((item) => {
                  const shortage = item.minStock - item.currentStock;
                  const percentOfMin = (item.currentStock / item.minStock) * 100;
                  
                  return (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(item.currentStock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(item.minStock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                        {formatNumber(shortage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            percentOfMin < 50
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {percentOfMin < 50 ? 'Critical' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dashboard.stockByStatus.out_of_stock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Out of Stock Alert</h3>
              <p className="mt-1 text-sm text-red-700">
                {dashboard.stockByStatus.out_of_stock} item{dashboard.stockByStatus.out_of_stock > 1 ? 's are' : ' is'} completely out of stock. Immediate reordering required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StockStatusCardProps {
  label: string;
  count: number;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

function StockStatusCard({ label, count, color }: StockStatusCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-lg border-2 p-4 text-center ${colorClasses[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </div>
  );
}
