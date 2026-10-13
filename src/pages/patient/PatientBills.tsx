import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { BillTable } from '@/components/BillTable';
import { EmptyState, LoadingState } from '@/components/ui/State';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/context/WalletContext';
import { fetchPatientBills, formatContractBill, parseWeb3Error } from '@/lib/contracts';
import { DEMO_BILLS, DEMO_PATIENT } from '@/data/mockData';
import type { Bill, BillStatus } from '@/types';
import { Search, Inbox, Wallet, AlertTriangle } from 'lucide-react';

type FilterStatus = BillStatus | 'all';

export function PatientBills() {
  const { account, chainId, network, networkKey, switchNetwork, connect, isConnecting, isChainMismatch } =
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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchPatientBills(account, network)
      .then((contractBills) => {
        if (active) {
          const mapped = contractBills.map(formatContractBill);
          setBills(mapped);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Failed to fetch patient bills:', err);
          if (networkKey === 'mainnet') {
            setError(parseWeb3Error(err));
            setBills([]);
          } else {
            // Testnet fallback for demo records if testing
            const demo = DEMO_BILLS.filter((b) => b.patientReferenceId === DEMO_PATIENT.referenceId);
            setBills(demo);
          }
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

  const filtered = bills.filter((b) => {
    const query = search.toLowerCase();
    const matchesSearch =
      b.id.toLowerCase().includes(query) ||
      b.serviceDescription.toLowerCase().includes(query) ||
      b.providerName.toLowerCase().includes(query) ||
      b.providerWalletAddress.toLowerCase().includes(query) ||
      b.patientReferenceId.toLowerCase().includes(query);
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
        title="My Bills"
        description={`All bills issued to your wallet on ${network.name}.`}
      />

      {isChainMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Wallet connected to Chain ID {chainId}. Please switch to {network.name} (Chain ID {network.chainId}) to view your bills.
            </span>
          </div>
          <Button size="sm" onClick={() => switchNetwork(networkKey)} className="shrink-0">
            Switch to {network.name}
          </Button>
        </div>
      )}

      {!account ? (
        <Card>
          <EmptyState
            icon={<Wallet className="h-10 w-10 text-primary-500" />}
            title="Connect Wallet to View Bills"
            description={`Connect your Web3 wallet to load medical bills issued to your address on ${network.name}.`}
            action={
              <Button onClick={connect} disabled={isConnecting}>
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </Button>
            }
          />
        </Card>
      ) : (
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

          {isLoading ? (
            <LoadingState
              title={`Loading your bills from ${network.name}…`}
            />
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block max-w-md text-left">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">Failed to load bills</p>
                    <p className="text-xs text-red-700 mt-0.5">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={() => {
                        if (account) {
                          setIsLoading(true);
                          setError(null);
                          fetchPatientBills(account, network)
                            .then((contractBills) => {
                              setBills(contractBills.map(formatContractBill));
                            })
                            .catch((err) => setError(parseWeb3Error(err)))
                            .finally(() => setIsLoading(false));
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : bills.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-10 w-10 text-gray-400" />}
              title={`No bills found on ${network.name}`}
              description={`No medical bills have been issued to ${account.slice(0, 6)}…${account.slice(-4)} on ${network.name}.`}
            />
          ) : filtered.length > 0 ? (
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
              title="No bills match your filter"
              description="Try adjusting your search query or filter selection."
            />
          )}
        </Card>
      )}
    </div>
  );
}
