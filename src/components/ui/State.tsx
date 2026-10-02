import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

interface StateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-3 text-gray-300">
        {icon || <Info className="h-10 w-10" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ title = 'Loading…' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertCircle className="h-10 w-10 text-error-400 mb-3" />
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SuccessState({ title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <CheckCircle2 className="h-10 w-10 text-success-500 mb-3" />
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
