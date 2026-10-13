import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/context/WalletContext';
import { fetchProviderBills, formatContractBill, parseWeb3Error } from '@/lib/contracts';
import type { Bill, BillStatus } from '@/types';
import { Search, Inbox, FilePlus, Wallet, AlertTriangle } from 'lucide-react';

type FilterStatus = BillStatus | 'all';

export function ProviderBills() {
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, switchNetwork, connect, isChainMismatch } =
    useWallet();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    let active = true;
    if (!account) {
      setBills([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchProviderBills(account, network)
      .then((contractBills) => {
        if (active) {
          const mapped = contractBills.map(formatContractBill);
          setBills(mapped);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Failed to fetch provider bills:', err);
          setError(parseWeb3Error(err));
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

  const filtered = bills.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.patientReferenceId.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceDescription.toLowerCase().includes(search.toLowerCase()) ||
      b.patientWalletAddress.toLowerCase().includes(search.toLowerCase());
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
        description={`Manage all bills issued to patients on ${network.name}.`}
        action={
          <Button onClick={() => navigate('/dashboard/provider/create-bill')}>
            <FilePlus className="h-4 w-4" />
            Create Bill
          </Button>
        }
      />

      <Card>
        {!account ? (
          <EmptyState
            icon={<Wallet className="h-10 w-10 text-gray-400" />}
            title="Provider wallet not connected"
            description={`Connect your wallet to view bills you have created on ${network.name}.`}
            action={<Button onClick={connect}>Connect Wallet</Button>}
          />
        ) : isChainMismatch ? (
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
            title="Wrong Network Connected"
            description={`Wallet is on Chain ID ${chainId}. Please switch to ${network.name} (Chain ID ${network.chainId}) to load your bills.`}
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
          <LoadingState title={`Loading bills from ${network.name}…`} />
        ) : error ? (
          <EmptyState
            icon={<Inbox className="h-10 w-10 text-red-400" />}
            title="Failed to load bills"
            description={error}
          />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-10 w-10 text-gray-400" />}
            title={`No bills created on ${network.name} yet`}
            description="You have not created any bills on this contract. Issue your first bill to a patient."
            action={
              <Button onClick={() => navigate('/dashboard/provider/create-bill')}>
                <FilePlus className="h-4 w-4" />
                Create First Bill
              </Button>
            }
          />
        ) : (
          <>
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
                    title="No matching bills"
                    description="Try adjusting your search or filter."
                  />
                }
              />
            ) : (
              <EmptyState
                icon={<Inbox className="h-10 w-10" />}
                title="No matching bills"
                description="Try adjusting your search or filter."
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
