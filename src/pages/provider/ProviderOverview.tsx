import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard, SummaryCardGrid } from '@/components/ui/SummaryCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState } from '@/components/ui/State';
import { DEMO_BILLS } from '@/data/mockData';
import { formatBOT } from '@/utils/format';
import { FileText, Clock, CheckCircle2, Wallet, Inbox } from 'lucide-react';

export function ProviderOverview() {
  const bills = DEMO_BILLS;
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
        description="Summary of billing activity and payment status."
      />

      <SummaryCardGrid>
        <SummaryCard label="Total Bills" value={String(bills.length)} icon={FileText} accent="primary" />
        <SummaryCard label="Pending" value={String(pending)} icon={Clock} accent="warning" />
        <SummaryCard label="Paid" value={String(paid)} icon={CheckCircle2} accent="accent" />
        <SummaryCard label="BOT Received" value={formatBOT(botReceived)} icon={Wallet} accent="primary" />
      </SummaryCardGrid>

      <div className="mt-6">
        <Card>
          <CardHeader title="Recent Bills" subtitle="Latest billing activity" />
          {recentBills.length > 0 ? (
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
          ) : (
            <EmptyState
              icon={<Inbox className="h-10 w-10" />}
              title="No bills yet"
              description="Bills you create will appear here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
