import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/State';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { DEMO_BILLS, DEMO_PAYMENTS } from '@/data/mockData';
import { formatDate, formatBOT } from '@/utils/format';
import { ArrowLeft, Edit, XCircle, CreditCard, ExternalLink } from 'lucide-react';

export function ProviderBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();

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
              <Button variant="outline" onClick={() => navigate('/dashboard/provider/bills')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Bills
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Bill ${bill.id}`}
        description="Full bill details and actions."
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard/provider/bills')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Bills
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
                <Field label="Patient Reference" value={bill.patientReferenceId} />
                <Field label="Patient Wallet" value={bill.patientWalletAddress} mono />
                <Field label="Service Description" value={bill.serviceDescription} />
                <Field label="Amount" value={formatBOT(bill.amountBOT)} />
                <Field label="Due Date" value={formatDate(bill.dueDate)} />
                <Field label="Created Date" value={formatDate(bill.createdDate)} />
                <Field label="Provider Wallet" value={bill.providerWalletAddress} mono />
                <Field
                  label="Payment Date"
                  value={bill.paymentDate ? formatDate(bill.paymentDate) : '—'}
                />
              </dl>
            </CardBody>
          </Card>
        </div>

        {/* Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>

              {bill.status === 'pending' || bill.status === 'overdue' ? (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Edit className="h-4 w-4" />
                    Edit Bill
                  </Button>
                  <Button variant="danger" className="w-full justify-start" disabled>
                    <XCircle className="h-4 w-4" />
                    Cancel Bill
                  </Button>
                  <p className="text-xs text-gray-400 pt-2">
                    Bill management actions require blockchain integration (next stage).
                  </p>
                </div>
              ) : bill.status === 'paid' && payment ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/dashboard/provider/payments`)}
                  >
                    <CreditCard className="h-4 w-4" />
                    View Payment
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <ExternalLink className="h-4 w-4" />
                    View Transaction
                  </Button>
                  <p className="text-xs text-gray-400 pt-2">
                    Transaction explorer link will be available once blockchain integration is added.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No actions available for cancelled bills.</p>
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
