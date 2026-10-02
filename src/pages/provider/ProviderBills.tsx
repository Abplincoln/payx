import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState } from '@/components/ui/State';
import { Input } from '@/components/ui/Input';
import { DEMO_BILLS } from '@/data/mockData';
import type { BillStatus } from '@/types';
import { Search, Inbox, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type FilterStatus = BillStatus | 'all';

export function ProviderBills() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filtered = DEMO_BILLS.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.patientReferenceId.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceDescription.toLowerCase().includes(search.toLowerCase());
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
      <PageHeader
        title="Bills"
        description="Manage all bills issued to patients."
        action={
          <Button onClick={() => navigate('/dashboard/provider/create-bill')}>
            <FilePlus className="h-4 w-4" />
            Create Bill
          </Button>
        }
      />

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
            role="provider"
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
