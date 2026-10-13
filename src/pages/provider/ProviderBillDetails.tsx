import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { DEMO_BILLS, DEMO_PAYMENTS } from '@/data/mockData';
import { formatDate, formatBOT } from '@/utils/format';
import { useWallet } from '@/context/WalletContext';
import { fetchBillById, formatContractBill } from '@/lib/contracts';
import { getExplorerTxUrl } from '@/config/network';
import type { Bill, Payment } from '@/types';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { ethers } from 'ethers';

export function ProviderBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { network, networkKey } = useWallet();

  const [bill, setBill] = useState<Bill | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!billId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const match = billId.match(/^PX-0*([1-9]\d*)$/i) || billId.match(/^([1-9]\d*)$/);
    if (match) {
      const numericId = BigInt(match[1]);
      fetchBillById(numericId, network)
        .then((contractBill) => {
          if (!active) return;
          if (contractBill && contractBill.billId > 0n && contractBill.provider !== ethers.ZeroAddress) {
            const mapped = formatContractBill(contractBill);
            setBill(mapped);

            if (mapped.status === 'paid') {
              setPayment({
                id: `PAY-${mapped.id}`,
                billId: mapped.id,
                patientWalletAddress: mapped.patientWalletAddress,
                providerWalletAddress: mapped.providerWalletAddress,
                amountBOT: mapped.amountBOT,
                paymentDate: mapped.paymentDate || mapped.createdDate,
                transactionHash: mapped.transactionHash || '',
                network: network.name,
              });
            } else {
              setPayment(null);
            }
            setIsLoading(false);
          } else {
            handleFallback();
          }
        })
        .catch(() => {
          if (active) handleFallback();
        });
    } else {
      handleFallback();
    }

    function handleFallback() {
      if (!active) return;
      if (networkKey === 'mainnet') {
        // On Mainnet, do not display fake demo bills
        setBill(null);
        setPayment(null);
      } else {
        // Testnet fallback for demo records
        const demo = DEMO_BILLS.find((b) => b.id.toUpperCase() === billId?.toUpperCase());
        setBill(demo || null);
        const demoPay = demo ? DEMO_PAYMENTS.find((p) => p.billId === demo.id) : null;
        setPayment(demoPay || null);
      }
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [billId, network, networkKey]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Bill Details" />
        <Card>
          <LoadingState title={`Loading bill ${billId} from ${network.name}…`} />
        </Card>
      </div>
    );
  }

  if (!bill) {
    return (
      <div>
        <PageHeader title="Bill Details" />
        <Card>
          <EmptyState
            title="Bill not found"
            description={`No bill found with ID "${billId}" on ${network.name}.`}
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
        description={`On-chain record on ${network.name}.`}
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
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Bill ID
                  </span>
                  <p className="text-lg font-semibold text-gray-900 mt-0.5 font-mono">{bill.id}</p>
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

        {/* Verification & Network Status */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">On-Chain Status</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-gray-500">Network</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{network.name}</p>
                  <p className="text-gray-400 mt-0.5">Chain ID: {network.chainId}</p>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-gray-500">Contract Address</p>
                  <p className="font-mono text-gray-900 mt-0.5 break-all text-[11px]">
                    {network.contractAddress}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-1.5"
                  onClick={() => navigate('/verify')}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Public Verification Tool
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Payment receipt if paid */}
      {bill.status === 'paid' && payment && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Receipt</h3>
          <PaymentReceipt payment={payment} billId={bill.id} showDemoLabel={Boolean(payment.transactionHash === '')} />
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
