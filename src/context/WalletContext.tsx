import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  NETWORKS,
  DEFAULT_NETWORK_KEY,
  getNetworkConfig,
  getNetworkByChainId,
  type NetworkConfig,
  type NetworkKey,
} from '@/config/network';
import { switchOrAddEthereumNetwork, connectMetaMask } from '@/lib/contracts';

interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  networkKey: NetworkKey;
  network: NetworkConfig;
  isConnecting: boolean;
  isChainMismatch: boolean;
  isUnsupportedChain: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (key: NetworkKey) => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [networkKey, setNetworkKey] = useState<NetworkKey>(DEFAULT_NETWORK_KEY);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeNetwork = getNetworkConfig(networkKey);

  const clearError = useCallback(() => setError(null), []);

  const switchNetwork = useCallback(
    async (key: NetworkKey) => {
      clearError();
      const target = NETWORKS[key];
      try {
        if (window.ethereum) {
          await switchOrAddEthereumNetwork(target);
        }
        setNetworkKey(key);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to switch network';
        setError(msg);
        throw err;
      }
    },
    [clearError]
  );

  const connect = useCallback(async () => {
    setIsConnecting(true);
    clearError();
    try {
      const res = await connectMetaMask(activeNetwork);
      setAccount(res.address);
      setChainId(res.chainId);
      // Auto-sync networkKey if MetaMask returned a known chain
      const matched = getNetworkByChainId(res.chainId);
      if (matched) {
        setNetworkKey(matched.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [activeNetwork, clearError]);

  const disconnect = useCallback(() => {
    setAccount(null);
    clearError();
  }, [clearError]);

  // Listen to provider events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      if (!accounts || accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainHex = args[0] as string | undefined;
      if (chainHex) {
        const newChainId = parseInt(chainHex, 16);
        setChainId(newChainId);
        const matched = getNetworkByChainId(newChainId);
        if (matched) {
          setNetworkKey(matched.id);
        }
      }
    };

    // Check existing connection silently
    window.ethereum
      .request<string[]>({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          return window.ethereum?.request<string>({ method: 'eth_chainId' });
        }
      })
      .then((chainHex) => {
        if (chainHex) {
          const id = parseInt(chainHex, 16);
          setChainId(id);
          const matched = getNetworkByChainId(id);
          if (matched) {
            setNetworkKey(matched.id);
          }
        }
      })
      .catch(() => {
        // Silent catch on background check
      });

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const isChainMismatch = Boolean(account && chainId && chainId !== activeNetwork.chainId);
  const isUnsupportedChain = Boolean(chainId && !getNetworkByChainId(chainId));

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        networkKey,
        network: activeNetwork,
        isConnecting,
        isChainMismatch,
        isUnsupportedChain,
        error,
        connect,
        disconnect,
        switchNetwork,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
