'use client';

import { useEffect, useState } from 'react';
import { getAccountingDashboard } from '@/services/api/dashboard';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatCurrency } from '@/utils/formatters';
import { CurrencyDollarIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AccountingDashboard {
  totalOutstandingAP: number;
  totalOverdueAP: number;
  overdueInvoiceCount: number;
  apAgingSummary: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  invoicesByStatus: {
    pending: number;
    approved: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
}

export default function AccountingDashboardPage() {
  const [dashboard, setDashboard] = useState<AccountingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAccountingDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounting dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading accounting dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accounts payable summary, aging report, and overdue invoices
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
          title="Total Outstanding AP"
          value={formatCurrency(dashboard.totalOutstandingAP)}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Overdue AP"
          value={formatCurrency(dashboard.totalOverdueAP)}
          alert={dashboard.totalOverdueAP > 0}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Overdue Invoices"
          value={dashboard.overdueInvoiceCount}
          alert={dashboard.overdueInvoiceCount > 0}
          icon={<ClockIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Pending Invoices"
          value={dashboard.invoicesByStatus.pending}
        />
      </div>

      {dashboard.overdueInvoiceCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Overdue Invoices Alert</h3>
              <p className="mt-1 text-sm text-red-700">
                {dashboard.overdueInvoiceCount} invoice{dashboard.overdueInvoiceCount > 1 ? 's are' : ' is'} overdue with a total balance of {formatCurrency(dashboard.totalOverdueAP)}. Immediate payment processing required.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AP Aging Summary</h2>
          <p className="text-sm text-gray-500 mt-1">Outstanding payables by aging bucket</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AgingCard
              label="Current"
              amount={dashboard.apAgingSummary.current}
              description="Due date not yet reached"
              color="green"
            />
            <AgingCard
              label="1-30 Days"
              amount={dashboard.apAgingSummary.days30}
              description="1-30 days overdue"
              color="yellow"
            />
            <AgingCard
              label="31-60 Days"
              amount={dashboard.apAgingSummary.days60}
              description="31-60 days overdue"
              color="orange"
            />
            <AgingCard
              label="60+ Days"
              amount={dashboard.apAgingSummary.days90Plus}
              description="Over 60 days overdue"
              color="red"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invoices by Status</h2>
        </div>
        <div className="p-6 space-y-3">
          <InvoiceStatusRow status="pending" count={dashboard.invoicesByStatus.pending} label="Pending" />
          <InvoiceStatusRow status="approved" count={dashboard.invoicesByStatus.approved} label="Approved" />
          <InvoiceStatusRow status="partially_paid" count={dashboard.invoicesByStatus.partially_paid} label="Partially Paid" />
          <InvoiceStatusRow status="paid" count={dashboard.invoicesByStatus.paid} label="Paid" />
          <InvoiceStatusRow status="overdue" count={dashboard.invoicesByStatus.overdue} label="Overdue" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Outstanding Payables</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(dashboard.totalOutstandingAP)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Current (Not Yet Due)</span>
            <span className="text-sm font-semibold text-green-600">{formatCurrency(dashboard.apAgingSummary.current)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Overdue</span>
            <span className="text-sm font-semibold text-red-600">{formatCurrency(dashboard.totalOverdueAP)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Number of Overdue Invoices</span>
            <span className={`text-sm font-semibold ${dashboard.overdueInvoiceCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {dashboard.overdueInvoiceCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AgingCardProps {
  label: string;
  amount: number;
  description: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

function AgingCard({ label, amount, description, color }: AgingCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  };

  const textColorClasses = {
    green: 'text-green-900',
    yellow: 'text-yellow-900',
    orange: 'text-orange-900',
    red: 'text-red-900',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${textColorClasses[color]}`}>{formatCurrency(amount)}</p>
      <p className="text-xs text-gray-600 mt-1">{description}</p>
    </div>
  );
}

interface InvoiceStatusRowProps {
  status: string;
  count: number;
  label: string;
}

function InvoiceStatusRow({ status, count, label }: InvoiceStatusRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        <StatusBadge status={status} />
        <span className="ml-3 text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </div>
  );
}
