import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';
import { DEMO_PAYMENTS } from '@/data/mockData';
import { formatDate, formatBOT, formatTxHash } from '@/utils/format';
import { useWallet } from '@/context/WalletContext';
import { fetchProviderBills, formatContractBill } from '@/lib/contracts';
import type { Payment } from '@/types';
import { Eye, Inbox, Wallet, AlertTriangle } from 'lucide-react';

export function ProviderPayments() {
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, switchNetwork, connect, isChainMismatch } =
    useWallet();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!account) {
      if (networkKey === 'mainnet') {
        setPayments([]);
      } else {
        setPayments(DEMO_PAYMENTS);
      }
      return;
    }

    setIsLoading(true);
    fetchProviderBills(account, network)
      .then((contractBills) => {
        if (!active) return;
        const paidBills = contractBills
          .map(formatContractBill)
          .filter((b) => b.status === 'paid');

        const livePayments: Payment[] = paidBills.map((b) => ({
          id: `PAY-${b.id}`,
          billId: b.id,
          patientWalletAddress: b.patientWalletAddress,
          providerWalletAddress: b.providerWalletAddress,
          amountBOT: b.amountBOT,
          paymentDate: b.paymentDate || b.createdDate,
          transactionHash: b.transactionHash || '',
          network: network.name,
        }));

        setPayments(livePayments);
      })
      .catch((err) => {
        console.error('Failed to load provider payments:', err);
        if (active) {
          setPayments([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [account, network, networkKey]);

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`All payments received from patients on ${network.name}.`}
      />

      <Card>
        {!account ? (
          <EmptyState
            icon={<Wallet className="h-10 w-10 text-gray-400" />}
            title="Provider wallet not connected"
            description={`Connect your wallet to view payments received on ${network.name}.`}
            action={<Button onClick={connect}>Connect Wallet</Button>}
          />
        ) : isChainMismatch ? (
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
            title="Wrong Network Connected"
            description={`Wallet is on Chain ID ${chainId}. Please switch to ${network.name} (Chain ID ${network.chainId}) to load payments.`}
            action={
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => switchNetwork(networkKey)}
              >
                Switch to {network.name}
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState title={`Loading payments from ${network.name}…`} />
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Payment ID
                  </th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Bill ID
                  </th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Patient Wallet
                  </th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Tx Hash
                  </th>
                  <th className="text-right font-semibold text-gray-600 px-4 py-3 whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap font-mono text-xs">
                      {payment.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {payment.billId}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {payment.patientWalletAddress.slice(0, 8)}…
                      {payment.patientWalletAddress.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {formatBOT(payment.amountBOT)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {payment.transactionHash ? formatTxHash(payment.transactionHash) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/provider/bills/${payment.billId}`)}
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
            title="No payments received yet"
            description={`Payments made by patients on ${network.name} will appear here.`}
          />
        )}
      </Card>
    </div>
  );
}
