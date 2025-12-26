'use client';

import { STATUS_COLORS } from '@/utils/constants';
import { formatStatus } from '@/utils/formatters';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
};
