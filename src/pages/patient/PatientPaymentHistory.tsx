import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/context/WalletContext';
import { fetchPatientBills, formatContractBill } from '@/lib/contracts';
import { DEMO_PAYMENTS, DEMO_PATIENT } from '@/data/mockData';
import { formatDate, formatBOT, formatTxHash } from '@/utils/format';
import type { Payment } from '@/types';
import { Eye, Inbox, Wallet, AlertTriangle } from 'lucide-react';

export function PatientPaymentHistory() {
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, connect, switchNetwork, isConnecting, isChainMismatch } =
    useWallet();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!account) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchPatientBills(account, network)
      .then((contractBills) => {
        if (active) {
          const paidBills = contractBills.filter((b) => Number(b.status) === 1);
          const mappedPayments: Payment[] = paidBills.map((b) => {
            const uiBill = formatContractBill(b);
            return {
              id: `PAY-${uiBill.id}`,
              billId: uiBill.id,
              patientWalletAddress: uiBill.patientWalletAddress,
              providerWalletAddress: uiBill.providerWalletAddress,
              amountBOT: uiBill.amountBOT,
              paymentDate: uiBill.paymentDate || uiBill.createdDate,
              transactionHash: uiBill.transactionHash || '',
              network: network.name,
            };
          });
          setPayments(mappedPayments);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load patient payment history:', err);
          if (networkKey === 'mainnet') {
            setPayments([]);
          } else {
            const demo = DEMO_PAYMENTS.filter(
              (p) => p.patientWalletAddress === DEMO_PATIENT.walletAddress
            );
            setPayments(demo);
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [account, network, networkKey]);

  return (
    <div>
      <PageHeader
        title="Payment History"
        description={`All confirmed payments made by your wallet on ${network.name}.`}
      />

      {isChainMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Wallet connected to Chain ID {chainId}. Please switch to {network.name} (Chain ID {network.chainId}) to view your payment history.
            </span>
          </div>
          <Button size="sm" onClick={() => switchNetwork(networkKey)} className="shrink-0">
            Switch to {network.name}
          </Button>
        </div>
      )}

      <Card>
        {!account ? (
          <EmptyState
            icon={<Wallet className="h-10 w-10 text-primary-500" />}
            title="Connect Wallet"
            description={`Connect your Web3 wallet to load your payment history on ${network.name}.`}
            action={
              <Button onClick={connect} disabled={isConnecting}>
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState
            title={`Loading payment history from ${network.name}…`}
          />
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Payment ID</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Bill ID</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Provider Wallet</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Amount</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Tx Hash</th>
                  <th className="text-right font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{payment.id}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{payment.billId}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {payment.providerWalletAddress.slice(0, 8)}…{payment.providerWalletAddress.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {formatBOT(payment.amountBOT)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {payment.transactionHash ? formatTxHash(payment.transactionHash) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/patient/bills/${payment.billId}`)}
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
            icon={<Inbox className="h-10 w-10 text-gray-400" />}
            title={`No payment history on ${network.name}`}
            description={`Your past payments will appear here once you pay bills on ${network.name}.`}
          />
        )}
      </Card>
    </div>
  );
}
