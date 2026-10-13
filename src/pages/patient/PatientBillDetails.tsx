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
import { getExplorerTxUrl } from '@/config/network';
import { fetchBillById, formatContractBill, payBillOnChain, parseWeb3Error } from '@/lib/contracts';
import type { Bill, Payment } from '@/types';
import { ethers } from 'ethers';
import { ArrowLeft, Wallet, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

export function PatientBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, connect, switchNetwork, isConnecting, isChainMismatch } =
    useWallet();

  const [bill, setBill] = useState<Bill | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccessTx, setPaySuccessTx] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!billId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPayError(null);

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
          <LoadingState
            title={`Loading bill ${billId} from ${network.name}…`}
          />
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
  const isPatientMismatch =
    Boolean(account && bill.patientWalletAddress && account.toLowerCase() !== bill.patientWalletAddress.toLowerCase());

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

    if (isPatientMismatch) {
      setPayError(
        `Unauthorized: This bill was issued to patient wallet ${bill.patientWalletAddress}. Your connected wallet is ${account}.`
      );
      return;
    }

    const match = bill.id.match(/^PX-0*([1-9]\d*)$/i) || bill.id.match(/^([1-9]\d*)$/);
    if (match) {
      const numericBillId = BigInt(match[1]);
      setIsPaying(true);
      try {
        const res = await payBillOnChain(numericBillId, bill.amountBOT, network);
        setPaySuccessTx(res.transactionHash);

        // Refresh bill state from contract
        const updated = await fetchBillById(numericBillId, network);
        if (updated) {
          const remapped = formatContractBill(updated);
          setBill(remapped);
          setPayment({
            id: `PAY-${remapped.id}`,
            billId: remapped.id,
            patientWalletAddress: remapped.patientWalletAddress,
            providerWalletAddress: remapped.providerWalletAddress,
            amountBOT: remapped.amountBOT,
            paymentDate: remapped.paymentDate || remapped.createdDate,
            transactionHash: res.transactionHash,
            network: network.name,
          });
        }
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
        description={`Review your bill details and make a payment on ${network.name}.`}
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
                <Field label="Service Description" value={bill.serviceDescription} />
                <Field label="Amount" value={formatBOT(bill.amountBOT)} />
                <Field label="Due Date" value={formatDate(bill.dueDate)} />
                <Field label="Created Date" value={formatDate(bill.createdDate)} />
                <Field
                  label="Payment Date"
                  value={bill.paymentDate ? formatDate(bill.paymentDate) : '—'}
                />
                <Field label="Network" value={network.name} />
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
                          <p className="text-xs font-semibold text-success-800">Payment Confirmed</p>
                          <p className="text-xs text-success-700 mt-0.5 font-mono break-all">{paySuccessTx}</p>
                          <a
                            href={getExplorerTxUrl(paySuccessTx, networkKey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1.5"
                          >
                            View on BOTScan Explorer
                            <ExternalLink className="h-3 w-3" />
                          </a>
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

                  {isPatientMismatch && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Patient Wallet Mismatch
                      </div>
                      <p className="mt-1">
                        Connected wallet ({account?.slice(0, 6)}…{account?.slice(-4)}) is not the patient address for this bill ({bill.patientWalletAddress.slice(0, 6)}…{bill.patientWalletAddress.slice(-4)}). You must switch to the patient wallet to pay.
                      </p>
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
                      disabled={isPaying || isPatientMismatch}
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
          <PaymentReceipt payment={payment} billId={bill.id} showDemoLabel={Boolean(bill.id.startsWith('PX-') && networkKey === 'testnet' && !payment.transactionHash)} />
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
