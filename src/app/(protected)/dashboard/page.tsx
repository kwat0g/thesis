'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/services/api/auth';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import {
  CubeIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface ExecutiveSummary {
  production: any;
  inventory: any;
  purchasing: any;
  accounting: any;
  maintenance: any;
  generatedAt: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = getToken();
        const response = await fetch('/api/dashboard/executive-summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setSummary(data.data);
        } else {
          setError(data.error || 'Failed to load dashboard');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(summary.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Production"
          icon={CubeIcon}
          color="blue"
          stats={[
            { label: 'Total Orders', value: summary.production.totalOrders },
            { label: 'In Progress', value: summary.production.inProgressOrders },
            { label: 'Delayed', value: summary.production.delayedOrders, alert: summary.production.delayedOrders > 0 },
            { label: 'Completion Rate', value: formatPercent(summary.production.completionRate) },
          ]}
        />

        <DashboardCard
          title="Inventory"
          icon={ArchiveBoxIcon}
          color="green"
          stats={[
            { label: 'Total Items', value: summary.inventory.totalItems },
            { label: 'In Stock', value: summary.inventory.stockByStatus.in_stock },
            { label: 'Low Stock', value: summary.inventory.stockByStatus.low_stock, alert: summary.inventory.stockByStatus.low_stock > 0 },
            { label: 'Stock Value', value: formatCurrency(summary.inventory.totalStockValue) },
          ]}
        />

        <DashboardCard
          title="Purchasing"
          icon={ShoppingCartIcon}
          color="purple"
          stats={[
            { label: 'Open PRs', value: summary.purchasing.openPRs },
            { label: 'Open POs', value: summary.purchasing.openPOs },
            { label: 'Pending PR Approvals', value: summary.purchasing.pendingPRApprovals, alert: summary.purchasing.pendingPRApprovals > 0 },
            { label: 'Pending PO Approvals', value: summary.purchasing.pendingPOApprovals, alert: summary.purchasing.pendingPOApprovals > 0 },
          ]}
        />

        <DashboardCard
          title="Accounting"
          icon={CurrencyDollarIcon}
          color="yellow"
          stats={[
            { label: 'Outstanding AP', value: formatCurrency(summary.accounting.totalOutstandingAP) },
            { label: 'Overdue AP', value: formatCurrency(summary.accounting.totalOverdueAP), alert: summary.accounting.totalOverdueAP > 0 },
            { label: 'Overdue Invoices', value: summary.accounting.overdueInvoiceCount, alert: summary.accounting.overdueInvoiceCount > 0 },
            { label: 'Pending Invoices', value: summary.accounting.invoicesByStatus.pending },
          ]}
        />

        <DashboardCard
          title="Maintenance"
          icon={WrenchScrewdriverIcon}
          color="orange"
          stats={[
            { label: 'Open Work Orders', value: summary.maintenance.openWorkOrders },
            { label: 'Pending', value: summary.maintenance.workOrdersByStatus.pending },
            { label: 'In Progress', value: summary.maintenance.workOrdersByStatus.in_progress },
            { label: 'Overdue Schedules', value: summary.maintenance.overdueMaintenanceSchedules, alert: summary.maintenance.overdueMaintenanceSchedules > 0 },
          ]}
        />
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  icon: any;
  color: string;
  stats: Array<{ label: string; value: string | number; alert?: boolean }>;
}

function DashboardCard({ title, icon: Icon, color, stats }: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className={`${colorClasses[color as keyof typeof colorClasses]} px-4 py-3 flex items-center`}>
        <Icon className="w-6 h-6 text-white mr-2" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4 space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className={`text-sm font-semibold ${stat.alert ? 'text-red-600' : 'text-gray-900'}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
