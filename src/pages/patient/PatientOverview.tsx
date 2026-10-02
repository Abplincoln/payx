import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard, SummaryCardGrid } from '@/components/ui/SummaryCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState } from '@/components/ui/State';
import { DEMO_BILLS, DEMO_PATIENT } from '@/data/mockData';
import { formatBOT } from '@/utils/format';
import { FileText, Clock, CheckCircle2, Wallet, Inbox } from 'lucide-react';

export function PatientOverview() {
  // Patient sees only bills assigned to them (PAT-001)
  const bills = DEMO_BILLS.filter((b) => b.patientReferenceId === DEMO_PATIENT.referenceId);
  const outstanding = bills.filter((b) => b.status === 'pending' || b.status === 'overdue');
  const paid = bills.filter((b) => b.status === 'paid');
  const totalDue = outstanding.reduce((sum, b) => sum + b.amountBOT, 0);
  const totalPaid = paid.reduce((sum, b) => sum + b.amountBOT, 0);

  return (
    <div>
      <PageHeader
        title="Patient Overview"
        description="Your billing summary and outstanding balances."
      />

      <SummaryCardGrid>
        <SummaryCard label="Outstanding Bills" value={String(outstanding.length)} icon={Clock} accent="warning" />
        <SummaryCard label="Paid Bills" value={String(paid.length)} icon={CheckCircle2} accent="accent" />
        <SummaryCard label="Total Due" value={formatBOT(totalDue)} icon={Wallet} accent="error" />
        <SummaryCard label="Total Paid" value={formatBOT(totalPaid)} icon={CheckCircle2} accent="primary" />
      </SummaryCardGrid>

      <div className="mt-6">
        <Card>
          <CardHeader title="Outstanding Bills" subtitle="Bills awaiting payment" />
          {outstanding.length > 0 ? (
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
              icon={<FileText className="h-10 w-10" />}
              title="No outstanding bills"
              description="You have no bills awaiting payment."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
