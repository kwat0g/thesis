'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  CircleStackIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  BellIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permissions: string[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    permissions: ['DASHBOARD.VIEW_EXECUTIVE_SUMMARY'],
  },
  {
    name: 'Production',
    href: '/production',
    icon: CubeIcon,
    permissions: ['PROD.VIEW_ORDERS', 'PROD.VIEW_SCHEDULES', 'PROD.VIEW_WORK_ORDERS'],
  },
  {
    name: 'Planning & MRP',
    href: '/planning',
    icon: ChartBarIcon,
    permissions: ['MRP.VIEW_RUNS', 'MRP.EXECUTE_MRP'],
  },
  {
    name: 'Purchasing',
    href: '/purchasing',
    icon: ShoppingCartIcon,
    permissions: ['PURCH.VIEW_PR', 'PURCH.VIEW_PO'],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: ArchiveBoxIcon,
    permissions: ['INV.VIEW_STOCK', 'INV.VIEW_TRANSACTIONS'],
  },
  {
    name: 'Quality Control',
    href: '/quality',
    icon: ClipboardDocumentCheckIcon,
    permissions: ['QC.VIEW_INSPECTIONS'],
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: WrenchScrewdriverIcon,
    permissions: ['MAINT.VIEW_SCHEDULES', 'MAINT.VIEW_WORK_ORDERS'],
  },
  {
    name: 'Mold Management',
    href: '/molds',
    icon: CircleStackIcon,
    permissions: ['MOLD.VIEW'],
  },
  {
    name: 'HR & Payroll',
    href: '/hr',
    icon: UsersIcon,
    permissions: ['HR.VIEW_ATTENDANCE', 'HR.VIEW_PAYROLL'],
  },
  {
    name: 'Accounting',
    href: '/accounting',
    icon: CurrencyDollarIcon,
    permissions: ['AP.VIEW_INVOICES', 'AP.VIEW_PAYMENTS'],
  },
  {
    name: 'Approvals',
    href: '/approvals',
    icon: CheckCircleIcon,
    permissions: ['PURCH.APPROVE_PR', 'PURCH.APPROVE_PO', 'PROD.APPROVE_ORDER', 'HR.APPROVE_PAYROLL'],
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: BellIcon,
    permissions: ['NOTIF.VIEW'],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();

  const visibleNavigation = navigation.filter((item) => hasAnyPermission(item.permissions));

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Manufacturing ERP</h1>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">© 2024 Manufacturing ERP</p>
      </div>
    </div>
  );
};
