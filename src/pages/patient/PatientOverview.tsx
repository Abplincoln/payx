import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard, SummaryCardGrid } from '@/components/ui/SummaryCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/context/WalletContext';
import { fetchPatientBills, formatContractBill } from '@/lib/contracts';
import { DEMO_BILLS, DEMO_PATIENT } from '@/data/mockData';
import { formatBOT } from '@/utils/format';
import type { Bill } from '@/types';
import { Clock, CheckCircle2, Wallet, Inbox, AlertTriangle } from 'lucide-react';

export function PatientOverview() {
  const { account, chainId, network, networkKey, connect, switchNetwork, isConnecting, isChainMismatch } =
    useWallet();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!account) {
      setBills([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchPatientBills(account, network)
      .then((contractBills) => {
        if (active) {
          setBills(contractBills.map(formatContractBill));
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load patient overview bills:', err);
          if (networkKey === 'mainnet') {
            setBills([]);
          } else {
            const demo = DEMO_BILLS.filter((b) => b.patientReferenceId === DEMO_PATIENT.referenceId);
            setBills(demo);
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

  const outstanding = bills.filter((b) => b.status === 'pending' || b.status === 'overdue');
  const paid = bills.filter((b) => b.status === 'paid');
  const totalDue = outstanding.reduce((sum, b) => sum + b.amountBOT, 0);
  const totalPaid = paid.reduce((sum, b) => sum + b.amountBOT, 0);

  return (
    <div>
      <PageHeader
        title="Patient Overview"
        description={`Your billing summary and outstanding balances on ${network.name}.`}
      />

      {isChainMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Wallet connected to Chain ID {chainId}. Please switch to {network.name} (Chain ID {network.chainId}) to view your balance.
            </span>
          </div>
          <Button size="sm" onClick={() => switchNetwork(networkKey)} className="shrink-0">
            Switch to {network.name}
          </Button>
        </div>
      )}

      <SummaryCardGrid>
        <SummaryCard
          label="Outstanding Bills"
          value={account ? String(outstanding.length) : '—'}
          icon={Clock}
          accent="warning"
        />
        <SummaryCard
          label="Paid Bills"
          value={account ? String(paid.length) : '—'}
          icon={CheckCircle2}
          accent="accent"
        />
        <SummaryCard
          label="Total Due"
          value={account ? formatBOT(totalDue) : '—'}
          icon={Wallet}
          accent="error"
        />
        <SummaryCard
          label="Total Paid"
          value={account ? formatBOT(totalPaid) : '—'}
          icon={CheckCircle2}
          accent="primary"
        />
      </SummaryCardGrid>

      <div className="mt-6">
        <Card>
          <CardHeader title="Outstanding Bills" subtitle={`Bills awaiting payment on ${network.name}`} />
          {!account ? (
            <EmptyState
              icon={<Wallet className="h-10 w-10 text-primary-500" />}
              title="Connect Wallet"
              description={`Connect your Web3 wallet to view your outstanding bills on ${network.name}.`}
              action={
                <Button onClick={connect} disabled={isConnecting}>
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              }
            />
          ) : isLoading ? (
            <LoadingState
              title={`Loading bills from ${network.name}…`}
            />
          ) : outstanding.length > 0 ? (
            <BillTable
              bills={outstanding}
              role="patient"
              emptyState={
                <EmptyState
                  icon={<Inbox className="h-10 w-10" />}
                  title="No outstanding bills"
                  description="You have no bills awaiting payment."
                />
              }
            />
          ) : (
            <EmptyState
              icon={<Inbox className="h-10 w-10" />}
              title="No outstanding bills"
              description={`No pending or overdue bills found for ${account.slice(0, 6)}…${account.slice(-4)} on ${network.name}.`}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
