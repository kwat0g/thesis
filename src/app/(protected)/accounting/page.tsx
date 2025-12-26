'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  CurrencyDollarIcon, 
  BanknotesIcon 
} from '@heroicons/react/24/outline';

export default function AccountingPage() {
  const { hasPermission } = usePermissions();

  const canViewInvoices = hasPermission('AP.VIEW_INVOICES');
  const canViewPayments = hasPermission('AP.VIEW_PAYMENTS');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage accounts payable and payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewInvoices && (
          <Link href="/accounting/invoices">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-12 w-12 text-red-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">AP Invoices</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Accounts payable invoices
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {canViewPayments && (
          <Link href="/accounting/payments">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Payment processing
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
