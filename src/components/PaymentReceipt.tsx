import { CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';
import type { Payment } from '@/types';
import { formatDate, formatBOT, formatTxHash } from '@/utils/format';
import { Card } from '@/components/ui/Card';

interface PaymentReceiptProps {
  payment: Payment;
  billId: string;
  showDemoLabel?: boolean;
}

export function PaymentReceipt({ payment, billId, showDemoLabel = true }: PaymentReceiptProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(payment.transactionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      {/* Verified banner */}
      <div className="bg-success-50 border-b border-success-100 px-6 py-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-500">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-success-700">Payment Verified</h2>
          <p className="text-sm text-success-600">
            This payment has been confirmed on {payment.network}
          </p>
        </div>
      </div>

      {showDemoLabel && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2">
          <p className="text-xs text-amber-700 font-medium">Demo data — not an actual on-chain transaction</p>
        </div>
      )}

      {/* Receipt details */}
      <div className="px-6 py-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Bill ID" value={billId} />
          <Field label="Amount" value={formatBOT(payment.amountBOT)} />
          <Field label="Payment Date" value={formatDate(payment.paymentDate)} />
          <Field label="Network" value={payment.network} />
          <Field
            label="Patient Wallet"
            value={payment.patientWalletAddress}
            mono
          />
          <Field
            label="Provider Wallet"
            value={payment.providerWalletAddress}
            mono
          />
        </dl>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Hash</dt>
          <dd className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono break-all">
              {payment.transactionHash}
            </code>
            <button
              onClick={copyHash}
              className="shrink-0 p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Copy transaction hash"
            >
              <Copy className="h-4 w-4" />
            </button>
          </dd>
          {copied && <p className="mt-1 text-xs text-success-600">Copied to clipboard</p>}
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  );
}
