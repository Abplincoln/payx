import type { BillStatus } from '@/types';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const statusConfig: Record<
  BillStatus,
  { label: string; classes: string; Icon: typeof Clock }
> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    Icon: Clock,
  },
  paid: {
    label: 'Paid',
    classes: 'bg-success-50 text-success-700 border-success-100',
    Icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-gray-100 text-gray-600 border-gray-200',
    Icon: XCircle,
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-error-50 text-error-700 border-error-100',
    Icon: AlertCircle,
  },
};

interface StatusBadgeProps {
  status: BillStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const { Icon } = config;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${config.classes} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </span>
  );
}
