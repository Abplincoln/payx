import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard, SummaryCardGrid } from '@/components/ui/SummaryCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';
import { formatBOT } from '@/utils/format';
import { useWallet } from '@/context/WalletContext';
import { fetchProviderBills, formatContractBill } from '@/lib/contracts';
import type { Bill } from '@/types';
import { FileText, Clock, CheckCircle2, Wallet, Inbox, FilePlus, AlertTriangle } from 'lucide-react';

export function ProviderOverview() {
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, switchNetwork, connect, isChainMismatch } =
    useWallet();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!account) {
      setBills([]);
      return;
    }

    setIsLoading(true);
    fetchProviderBills(account, network)
      .then((contractBills) => {
        if (active) {
          setBills(contractBills.map(formatContractBill));
        }
      })
      .catch((err) => {
        console.error('Failed to load provider overview bills:', err);
        if (active) {
          setBills([]);
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
  }, [account, network]);

  const recentBills = bills.slice(0, 5);
  const pending = bills.filter((b) => b.status === 'pending').length;
  const paid = bills.filter((b) => b.status === 'paid').length;
  const botReceived = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amountBOT, 0);

  return (
    <div>
      <PageHeader
        title="Provider Overview"
        description={`Summary of billing activity and payment status on ${network.name}.`}
        action={
          <Button onClick={() => navigate('/dashboard/provider/create-bill')}>
            <FilePlus className="h-4 w-4" />
            Create Bill
          </Button>
        }
      />

      <SummaryCardGrid>
        <SummaryCard
          label="Total Bills"
          value={account ? String(bills.length) : '—'}
          icon={FileText}
          accent="primary"
        />
        <SummaryCard
          label="Pending"
          value={account ? String(pending) : '—'}
          icon={Clock}
          accent="warning"
        />
        <SummaryCard
          label="Paid"
          value={account ? String(paid) : '—'}
          icon={CheckCircle2}
          accent="accent"
        />
        <SummaryCard
          label="BOT Received"
          value={account ? formatBOT(botReceived) : '—'}
          icon={Wallet}
          accent="primary"
        />
      </SummaryCardGrid>

      <div className="mt-6">
        <Card>
          <CardHeader title="Recent Bills" subtitle={`Latest billing activity on ${network.name}`} />

          {!account ? (
            <EmptyState
              icon={<Wallet className="h-10 w-10 text-gray-400" />}
              title="Provider wallet not connected"
              description={`Connect your wallet to view your billing activity on ${network.name}.`}
              action={<Button onClick={connect}>Connect Wallet</Button>}
            />
          ) : isChainMismatch ? (
            <EmptyState
              icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
              title="Wrong Network Connected"
              description={`Wallet is on Chain ID ${chainId}. Please switch to ${network.name} (Chain ID ${network.chainId}) to load billing data.`}
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
            <LoadingState title={`Loading billing activity from ${network.name}…`} />
          ) : bills.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-10 w-10 text-gray-400" />}
              title={`No bills created on ${network.name} yet`}
              description="Bills you create will be permanently recorded on-chain and appear here."
              action={
                <Button onClick={() => navigate('/dashboard/provider/create-bill')}>
                  <FilePlus className="h-4 w-4" />
                  Create First Bill
                </Button>
              }
            />
          ) : (
            <BillTable
              bills={recentBills}
              role="provider"
              emptyState={
                <EmptyState
                  icon={<Inbox className="h-10 w-10" />}
                  title="No bills yet"
                  description="Bills you create will appear here."
                />
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
