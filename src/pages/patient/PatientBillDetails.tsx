import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { DEMO_BILLS, DEMO_PAYMENTS } from '@/data/mockData';
import { formatDate, formatBOT } from '@/utils/format';
import { useWallet } from '@/context/WalletContext';
import { ArrowLeft, Wallet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { payBillOnChain, parseWeb3Error } from '@/lib/contracts';

export function PatientBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, connect, switchNetwork, isConnecting, isChainMismatch } = useWallet();
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccessTx, setPaySuccessTx] = useState<string | null>(null);

  const bill = DEMO_BILLS.find((b) => b.id === billId);
  const payment = bill ? DEMO_PAYMENTS.find((p) => p.billId === bill.id) : null;

  if (!bill) {
    return (
      <div>
        <PageHeader title="Bill Details" />
        <Card>
          <EmptyState
            title="Bill not found"
            description={`No bill found with ID "${billId}".`}
            action={
              <Button variant="outline" onClick={() => navigate('/dashboard/patient/bills')}>
                <ArrowLeft className="h-4 w-4" />
                Back to My Bills
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const canPay = bill.status === 'pending' || bill.status === 'overdue';

  const handlePay = async () => {
    setPayError(null);
    if (!account) {
      await connect();
      return;
    }
    if (isChainMismatch) {
      try {
        await switchNetwork(networkKey);
      } catch (err: unknown) {
        setPayError(parseWeb3Error(err));
      }
      return;
    }

    const match = bill.id.match(/^PX-0*([1-9]\d*)$/i) || bill.id.match(/^([1-9]\d*)$/);
    if (match) {
      const numericBillId = BigInt(match[1]);
      setIsPaying(true);
      try {
        const res = await payBillOnChain(numericBillId, bill.amountBOT, network);
        setPaySuccessTx(res.transactionHash);
      } catch (err: unknown) {
        setPayError(parseWeb3Error(err));
      } finally {
        setIsPaying(false);
      }
    } else {
      setPayError('This bill is a mock/demo record and does not exist on-chain.');
    }
  };

  return (
    <div>
      <PageHeader
        title={`Bill ${bill.id}`}
        description="Review your bill details and make a payment."
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard/patient/bills')}>
            <ArrowLeft className="h-4 w-4" />
            Back to My Bills
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill details */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill ID</span>
                  <p className="text-lg font-semibold text-gray-900 mt-0.5">{bill.id}</p>
                </div>
                <StatusBadge status={bill.status} />
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Provider" value={bill.providerName} />
                <Field label="Service Description" value={bill.serviceDescription} />
                <Field label="Amount" value={formatBOT(bill.amountBOT)} />
                <Field label="Due Date" value={formatDate(bill.dueDate)} />
                <Field label="Created Date" value={formatDate(bill.createdDate)} />
                <Field
                  label="Payment Date"
                  value={bill.paymentDate ? formatDate(bill.paymentDate) : '—'}
                />
                <Field label="Provider Wallet" value={bill.providerWalletAddress} mono />
                <Field label="Patient Wallet" value={bill.patientWalletAddress} mono />
              </dl>
            </CardBody>
          </Card>
        </div>

        {/* Payment action */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody>
              {canPay ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Payment Due</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{formatBOT(bill.amountBOT)}</p>
                  <p className="text-xs text-gray-500 mb-5">Due by {formatDate(bill.dueDate)}</p>

                  {paySuccessTx && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3.5 mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-success-800">Payment Broadcasted</p>
                          <p className="text-xs text-success-700 mt-0.5 font-mono break-all">{paySuccessTx}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {payError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">Payment Error</p>
                          <p className="text-xs text-red-700 mt-0.5">{payError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!account ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={connect}
                      disabled={isConnecting}
                    >
                      <Wallet className="h-5 w-5" />
                      {isConnecting ? 'Connecting…' : 'Connect Wallet to Pay'}
                    </Button>
                  ) : isChainMismatch ? (
                    <div className="space-y-2">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Wrong Network Connected
                        </div>
                        <p className="mt-1">
                          Wallet is connected to Chain ID {chainId}. Please switch to {network.name} (Chain ID {network.chainId}) to pay.
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => switchNetwork(networkKey)}
                      >
                        Switch to {network.name}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePay}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Broadcasting on {network.name}…
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5" />
                          Pay {formatBOT(bill.amountBOT)}
                        </>
                      )}
                    </Button>
                  )}

                  <p className="mt-3 text-xs text-gray-400">
                    Payment will be processed on {network.name}.
                  </p>
                </div>
              ) : bill.status === 'paid' ? (
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-success-500" />
                    <span className="text-sm font-semibold text-success-700">Payment Complete</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    This bill was paid on {bill.paymentDate ? formatDate(bill.paymentDate) : '—'}.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Bill Cancelled</h3>
                  <p className="text-sm text-gray-500">No payment is required for this bill.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Payment receipt for paid bills */}
      {bill.status === 'paid' && payment && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Receipt</h3>
          <PaymentReceipt payment={payment} billId={bill.id} />
        </div>
      )}
    </div>
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
