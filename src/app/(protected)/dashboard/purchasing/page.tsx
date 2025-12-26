'use client';

import { useEffect, useState } from 'react';
import { getPurchasingDashboard } from '@/services/api/dashboard';
import { DashboardCard } from '@/components/layout/DashboardCard';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { ShoppingCartIcon, ClipboardDocumentListIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PurchasingDashboard {
  openPRs: number;
  openPOs: number;
  pendingPRApprovals: number;
  pendingPOApprovals: number;
  prsByStatus: {
    draft: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    converted_to_po: number;
    cancelled: number;
  };
  posByStatus: {
    draft: number;
    pending_approval: number;
    approved: number;
    sent: number;
    partially_received: number;
    received: number;
    closed: number;
    cancelled: number;
  };
}

export default function PurchasingDashboardPage() {
  const [dashboard, setDashboard] = useState<PurchasingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPurchasingDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchasing dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading purchasing dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!dashboard) return null;

  const totalPendingApprovals = dashboard.pendingPRApprovals + dashboard.pendingPOApprovals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchasing Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Purchase requests, purchase orders, and pending approvals
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
          title="Open PRs"
          value={dashboard.openPRs}
          subtitle="Not yet converted to PO"
          icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Open POs"
          value={dashboard.openPOs}
          subtitle="Not yet closed"
          icon={<ShoppingCartIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Pending PR Approvals"
          value={dashboard.pendingPRApprovals}
          alert={dashboard.pendingPRApprovals > 0}
          icon={<ExclamationCircleIcon className="w-8 h-8" />}
        />
        <DashboardCard
          title="Pending PO Approvals"
          value={dashboard.pendingPOApprovals}
          alert={dashboard.pendingPOApprovals > 0}
          icon={<ExclamationCircleIcon className="w-8 h-8" />}
        />
      </div>

      {totalPendingApprovals > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Pending Approvals</h3>
              <p className="mt-1 text-sm text-yellow-700">
                {totalPendingApprovals} document{totalPendingApprovals > 1 ? 's require' : ' requires'} approval ({dashboard.pendingPRApprovals} PR{dashboard.pendingPRApprovals !== 1 ? 's' : ''}, {dashboard.pendingPOApprovals} PO{dashboard.pendingPOApprovals !== 1 ? 's' : ''}).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Purchase Requests by Status</h2>
          </div>
          <div className="p-6 space-y-3">
            <StatusRow status="draft" count={dashboard.prsByStatus.draft} label="Draft" />
            <StatusRow status="pending_approval" count={dashboard.prsByStatus.pending_approval} label="Pending Approval" />
            <StatusRow status="approved" count={dashboard.prsByStatus.approved} label="Approved" />
            <StatusRow status="rejected" count={dashboard.prsByStatus.rejected} label="Rejected" />
            <StatusRow status="converted_to_po" count={dashboard.prsByStatus.converted_to_po} label="Converted to PO" />
            <StatusRow status="cancelled" count={dashboard.prsByStatus.cancelled} label="Cancelled" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Purchase Orders by Status</h2>
          </div>
          <div className="p-6 space-y-3">
            <StatusRow status="draft" count={dashboard.posByStatus.draft} label="Draft" />
            <StatusRow status="pending_approval" count={dashboard.posByStatus.pending_approval} label="Pending Approval" />
            <StatusRow status="approved" count={dashboard.posByStatus.approved} label="Approved" />
            <StatusRow status="sent" count={dashboard.posByStatus.sent} label="Sent" />
            <StatusRow status="partially_received" count={dashboard.posByStatus.partially_received} label="Partially Received" />
            <StatusRow status="received" count={dashboard.posByStatus.received} label="Received" />
            <StatusRow status="closed" count={dashboard.posByStatus.closed} label="Closed" />
            <StatusRow status="cancelled" count={dashboard.posByStatus.cancelled} label="Cancelled" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Purchase Requests</h3>
            <div className="space-y-2">
              <SummaryItem label="Total Open PRs" value={dashboard.openPRs} />
              <SummaryItem label="Awaiting Approval" value={dashboard.pendingPRApprovals} alert={dashboard.pendingPRApprovals > 0} />
              <SummaryItem label="Approved (Not Converted)" value={dashboard.prsByStatus.approved} />
              <SummaryItem label="Converted to PO" value={dashboard.prsByStatus.converted_to_po} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Purchase Orders</h3>
            <div className="space-y-2">
              <SummaryItem label="Total Open POs" value={dashboard.openPOs} />
              <SummaryItem label="Awaiting Approval" value={dashboard.pendingPOApprovals} alert={dashboard.pendingPOApprovals > 0} />
              <SummaryItem label="Sent to Suppliers" value={dashboard.posByStatus.sent} />
              <SummaryItem label="Partially Received" value={dashboard.posByStatus.partially_received} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusRowProps {
  status: string;
  count: number;
  label: string;
}

function StatusRow({ status, count, label }: StatusRowProps) {
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

interface SummaryItemProps {
  label: string;
  value: number;
  alert?: boolean;
}

function SummaryItem({ label, value, alert }: SummaryItemProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
