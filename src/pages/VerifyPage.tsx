import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { formatDate, formatBOT } from '@/utils/format';
import type { VerificationResult } from '@/types';

// DEMO verification result — will be replaced by on-chain read in later stages
const DEMO_VERIFICATION: VerificationResult = {
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

type VerifyState = 'idle' | 'loading' | 'result' | 'notfound';

export function VerifyPage() {
  const navigate = useNavigate();
  const [billId, setBillId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billId.trim()) {
      setError('Bill ID is required');
      return;
    }
    setError(null);
    setState('loading');

    // Simulated lookup — will be replaced by smart contract read
    setTimeout(() => {
      if (billId.trim().toUpperCase() === DEMO_VERIFICATION.billId) {
        setResult(DEMO_VERIFICATION);
        setState('result');
      } else {
        setState('notfound');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PayX Verify</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Public Bill Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter a bill ID to verify its payment status on the BotChain Testnet.
          </p>
        </div>

        {/* Search form */}
        <Card>
          <CardBody>
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  name="billId"
                  placeholder="e.g. PX-0002"
                  value={billId}
                  onChange={(e) => {
                    setBillId(e.target.value);
                    if (error) setError(null);
                  }}
                  error={error}
                />
              </div>
              <Button type="submit" size="md" className="sm:self-end">
                <Search className="h-4 w-4" />
                Verify Bill
              </Button>
            </form>
            <p className="mt-3 text-xs text-gray-400">
              Tip: try <button onClick={() => setBillId('PX-0002')} className="text-primary-600 hover:underline font-medium">PX-0002</button> for a demo verified result.
            </p>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="mt-6">
          {state === 'idle' && (
            <Card>
              <EmptyState
                icon={<Search className="h-10 w-10" />}
                title="No verification performed yet"
                description="Enter a bill ID above and click Verify Bill to check its payment status."
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
                description={`No bill found with ID "${billId}". Please check the ID and try again.`}
              />
            </Card>
          )}

          {state === 'result' && result && (
            <div className="space-y-4">
              {/* Verified banner */}
              <Card className="overflow-hidden">
                <div className="bg-success-50 border-b border-success-100 px-6 py-5 flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-500">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-success-700">Payment Verified</h2>
                    <p className="text-sm text-success-600">
                      This bill's payment has been confirmed on {result.network}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                    <p className="text-xs text-amber-700 font-medium">
                      Demo data — this is not an actual on-chain verification result
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Bill ID" value={result.billId} />
                    <Field label="Status" value={<StatusBadge status={result.status} size="sm" />} />
                    <Field label="Amount" value={formatBOT(result.amountBOT)} />
                    <Field label="Provider" value={result.providerName} />
                    <Field label="Patient Reference" value={result.patientReferenceId} />
                    <Field label="Payment Date" value={result.paymentDate ? formatDate(result.paymentDate) : '—'} />
                    <Field label="Patient Wallet" value={result.patientWalletAddress} mono />
                    <Field label="Provider Wallet" value={result.providerWalletAddress} mono />
                  </dl>

                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Hash</dt>
                    <dd className="mt-1.5">
                      <code className="block text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono break-all">
                        {result.transactionHash}
                      </code>
                    </dd>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-500" />
                    {result.network}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
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
