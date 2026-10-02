import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState, SuccessState } from '@/components/ui/State';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { DEMO_BILLS, DEMO_PAYMENTS } from '@/data/mockData';
import { formatDate, formatBOT } from '@/utils/format';
import { ArrowLeft, Wallet, CheckCircle2, Info } from 'lucide-react';

export function PatientBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [payClicked, setPayClicked] = useState(false);

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

                  {payClicked ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2.5">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Payment coming soon</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Blockchain integration is coming in the next stage. BOT payments will be processed
                            on-chain once wallet and smart contract integration is added.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setPayClicked(true)}
                    >
                      <Wallet className="h-5 w-5" />
                      Pay {formatBOT(bill.amountBOT)}
                    </Button>
                  )}

                  <p className="mt-3 text-xs text-gray-400">
                    Payment will be processed on the BotChain Testnet.
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
