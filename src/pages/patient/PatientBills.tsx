import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState } from '@/components/ui/State';
import { Input } from '@/components/ui/Input';
import { DEMO_BILLS, DEMO_PATIENT } from '@/data/mockData';
import type { BillStatus } from '@/types';
import { Search, Inbox } from 'lucide-react';

type FilterStatus = BillStatus | 'all';

export function PatientBills() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const patientBills = DEMO_BILLS.filter((b) => b.patientReferenceId === DEMO_PATIENT.referenceId);
  const filtered = patientBills.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceDescription.toLowerCase().includes(search.toLowerCase()) ||
      b.providerName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      <PageHeader title="My Bills" description="All bills issued to you by providers." />

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="search"
              placeholder="Search bills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  filter === f.value
                    ? 'bg-primary-50 text-primary-700 border border-primary-100'
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <BillTable
            bills={filtered}
            role="patient"
            emptyState={
              <EmptyState
                icon={<Inbox className="h-10 w-10" />}
                title="No bills found"
                description="Try adjusting your search or filter."
              />
            }
          />
        ) : (
          <EmptyState
            icon={<Inbox className="h-10 w-10" />}
            title="No bills found"
            description="Try adjusting your search or filter."
          />
        )}
      </Card>
    </div>
  );
}
