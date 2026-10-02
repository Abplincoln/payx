import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: 'primary' | 'accent' | 'warning' | 'error' | 'neutral';
}

const accentClasses: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-error-50 text-error-600',
  neutral: 'bg-gray-100 text-gray-600',
};

export function SummaryCard({ label, value, icon: Icon, trend, accent = 'neutral' }: SummaryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
          <span className="text-2xl font-semibold text-gray-900">{value}</span>
        </div>
        <div className={`rounded-lg p-2.5 ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-success-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-error-600" />
          )}
          <span className={trend.positive ? 'text-success-600' : 'text-error-600'}>
            {trend.value}
          </span>
          <span className="text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

interface SummaryCardGridProps {
  children: ReactNode;
}

export function SummaryCardGrid({ children }: SummaryCardGridProps) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}
