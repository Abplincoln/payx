import type { Bill } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatBOT } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface BillTableProps {
  bills: Bill[];
  role: 'provider' | 'patient';
  emptyState?: React.ReactNode;
}

export function BillTable({ bills, role, emptyState }: BillTableProps) {
  const navigate = useNavigate();

  if (bills.length === 0) {
    return (
      <>{emptyState}</>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Bill ID</th>
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
              {role === 'provider' ? 'Patient' : 'Provider'}
            </th>
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Service</th>
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Amount</th>
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Due Date</th>
            <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Status</th>
            <th className="text-right font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bills.map((bill) => (
            <tr key={bill.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{bill.id}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {role === 'provider' ? bill.patientReferenceId : bill.providerName}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-xs truncate">
                {bill.serviceDescription}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {formatBOT(bill.amountBOT)}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(bill.dueDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={bill.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/${role}/bills/${bill.id}`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
