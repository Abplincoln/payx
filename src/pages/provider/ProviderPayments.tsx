import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';
import { DEMO_PAYMENTS, DEMO_BILLS } from '@/data/mockData';
import { formatDate, formatBOT, formatTxHash } from '@/utils/format';
import { Eye, Inbox } from 'lucide-react';

export function ProviderPayments() {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const payments = DEMO_PAYMENTS;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payments received from patients."
      />

      <Card>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Payment ID</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Bill ID</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Patient Wallet</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Amount</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Tx Hash</th>
                  <th className="text-right font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${
                      selectedPayment === payment.id ? 'bg-primary-50/40' : ''
                    }`}
                    onClick={() => setSelectedPayment(payment.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{payment.id}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{payment.billId}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {payment.patientWalletAddress.slice(0, 8)}…{payment.patientWalletAddress.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {formatBOT(payment.amountBOT)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {formatTxHash(payment.transactionHash)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/provider/bills/${payment.billId}`);
                        }}
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
        ) : (
          <EmptyState
            icon={<Inbox className="h-10 w-10" />}
            title="No payments yet"
            description="Payments received from patients will appear here."
          />
        )}
      </Card>
    </div>
  );
}
