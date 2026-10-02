import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatBOT } from '@/utils/format';
import { DEMO_BILLS } from '@/data/mockData';
import type { VerificationResult } from '@/types';
import { Search, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

// DEMO verification result
const DEMO_RESULT: VerificationResult = {
  billId: 'PX-0002',
  status: 'paid',
  amountBOT: 40,
  providerName: 'Northbridge Medical Center',
  providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
  patientReferenceId: 'PAT-002',
  patientWalletAddress: '0x1c5E4a9B3d7F028e6C4a2D8b1f5A3e9C7d0B4f6E',
  paymentDate: '2026-09-20',
  transactionHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  network: 'BotChain Testnet',
  verified: true,
};

type State = 'idle' | 'loading' | 'result' | 'notfound';

export function ProviderVerification() {
  const [billId, setBillId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billId.trim()) {
      setError('Bill ID is required');
      return;
    }
    setError(null);
    setState('loading');

    setTimeout(() => {
      const bill = DEMO_BILLS.find((b) => b.id.toUpperCase() === billId.trim().toUpperCase());
      if (bill && bill.status === 'paid') {
        setResult(DEMO_RESULT);
        setState('result');
      } else if (bill) {
        setResult({
          ...DEMO_RESULT,
          billId: bill.id,
          status: bill.status,
          amountBOT: bill.amountBOT,
          patientReferenceId: bill.patientReferenceId,
          patientWalletAddress: bill.patientWalletAddress,
          paymentDate: bill.paymentDate,
          transactionHash: bill.transactionHash,
          verified: false,
        });
        setState('result');
      } else {
        setState('notfound');
      }
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Verify a bill's payment status on the BotChain Testnet."
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                name="billId"
                placeholder="Enter Bill ID (e.g. PX-0002)"
                value={billId}
                onChange={(e) => {
                  setBillId(e.target.value);
                  if (error) setError(null);
                }}
                error={error}
              />
            </div>
            <Button type="submit" className="sm:self-end">
              <Search className="h-4 w-4" />
              Verify Bill
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-6 max-w-2xl">
        {state === 'idle' && (
          <Card>
            <EmptyState
              icon={<ShieldCheck className="h-10 w-10" />}
              title="No verification performed yet"
              description="Enter a bill ID above to verify its payment status on-chain."
            />
          </Card>
        )}

        {state === 'loading' && (
          <Card>
            <LoadingState title="Checking BotChain Testnet…" />
          </Card>
        )}

        {state === 'notfound' && (
          <Card>
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="Bill not found"
              description={`No bill found with ID "${billId}".`}
            />
          </Card>
        )}

        {state === 'result' && result && (
          <Card className="overflow-hidden">
            <div
              className={`px-6 py-5 flex items-center gap-4 border-b ${
                result.verified
                  ? 'bg-success-50 border-success-100'
                  : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  result.verified ? 'bg-success-500' : 'bg-amber-500'
                }`}
              >
                {result.verified ? (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${result.verified ? 'text-success-700' : 'text-amber-700'}`}>
                  {result.verified ? 'Payment Verified' : 'Not Yet Paid'}
                </h2>
                <p className={`text-sm ${result.verified ? 'text-success-600' : 'text-amber-600'}`}>
                  Status: {result.status} · {result.network}
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-amber-700 font-medium">
                  Demo data — not an actual on-chain verification
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Bill ID" value={result.billId} />
                <Field label="Status" value={<StatusBadge status={result.status} size="sm" />} />
                <Field label="Amount" value={formatBOT(result.amountBOT)} />
                <Field label="Provider" value={result.providerName} />
                <Field label="Patient Reference" value={result.patientReferenceId} />
                <Field
                  label="Payment Date"
                  value={result.paymentDate ? formatDate(result.paymentDate) : '—'}
                />
                <Field label="Patient Wallet" value={result.patientWalletAddress} mono />
                <Field label="Provider Wallet" value={result.providerWalletAddress} mono />
              </dl>

              {result.transactionHash && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Hash</dt>
                  <dd className="mt-1.5">
                    <code className="block text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono break-all">
                      {result.transactionHash}
                    </code>
                  </dd>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-accent-500" />
                {result.network}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  );
}
