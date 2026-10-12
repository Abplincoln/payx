export type NetworkKey = 'mainnet' | 'testnet';

export interface NetworkConfig {
  id: NetworkKey;
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const KNOWN_MAINNET_CONTRACT = '0x545B697201cB19DdFF7d68FBd60158dc454aaef7';
export const KNOWN_TESTNET_CONTRACT = '0x2cf74124E586b8Cb292AFB3F2A579AfB89EEF493';

export const DEFAULT_NETWORK_KEY: NetworkKey =
  import.meta.env.VITE_NETWORK === 'testnet' ? 'testnet' : 'mainnet';

const envMainnetContract = (import.meta.env.VITE_MAINNET_CONTRACT_ADDRESS as string)?.trim();
const envTestnetContract = (import.meta.env.VITE_TESTNET_CONTRACT_ADDRESS as string)?.trim();
const envGenericContract = (import.meta.env.VITE_CONTRACT_ADDRESS as string)?.trim();

/**
 * Resolves mainnet contract address safely:
 * - Dedicated VITE_MAINNET_CONTRACT_ADDRESS takes highest priority.
 * - Generic VITE_CONTRACT_ADDRESS is ONLY applied when VITE_NETWORK is mainnet,
 *   and NEVER if it matches the known testnet contract address.
 * - Otherwise falls back to the verified mainnet contract constant.
 */
function resolveMainnetContract(): string {
  if (envMainnetContract) return envMainnetContract;
  if (
    DEFAULT_NETWORK_KEY === 'mainnet' &&
    envGenericContract &&
    envGenericContract.toLowerCase() !== KNOWN_TESTNET_CONTRACT.toLowerCase()
  ) {
    return envGenericContract;
  }
  return KNOWN_MAINNET_CONTRACT;
}

/**
 * Resolves testnet contract address safely:
 * - Dedicated VITE_TESTNET_CONTRACT_ADDRESS takes highest priority.
 * - Generic VITE_CONTRACT_ADDRESS is ONLY applied when VITE_NETWORK is testnet,
 *   and NEVER if it matches the known mainnet contract address.
 * - Otherwise falls back to the verified testnet contract constant.
 */
function resolveTestnetContract(): string {
  if (envTestnetContract) return envTestnetContract;
  if (
    DEFAULT_NETWORK_KEY === 'testnet' &&
    envGenericContract &&
    envGenericContract.toLowerCase() !== KNOWN_MAINNET_CONTRACT.toLowerCase()
  ) {
    return envGenericContract;
  }
  return KNOWN_TESTNET_CONTRACT;
}

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  mainnet: {
    id: 'mainnet',
    chainId: 677,
    chainIdHex: '0x2a5',
    name: 'BOT Chain Mainnet',
    rpcUrl: (import.meta.env.VITE_MAINNET_RPC_URL as string) || 'https://rpc.botchain.ai',
    explorerUrl: (import.meta.env.VITE_MAINNET_EXPLORER_URL as string) || 'https://scan.botchain.ai',
    contractAddress: resolveMainnetContract(),
    nativeCurrency: {
      name: 'BOT',
      symbol: 'BOT',
      decimals: 18,
    },
  },
  testnet: {
    id: 'testnet',
    chainId: 968,
    chainIdHex: '0x3c8',
    name: 'BotChain Testnet',
    rpcUrl: (import.meta.env.VITE_TESTNET_RPC_URL as string) || 'https://rpc.bohr.life',
    explorerUrl: (import.meta.env.VITE_TESTNET_EXPLORER_URL as string) || 'https://scan.bohr.life',
    contractAddress: resolveTestnetContract(),
    nativeCurrency: {
      name: 'BOT',
      symbol: 'BOT',
      decimals: 18,
    },
  },
};

export function getNetworkConfig(key: NetworkKey = DEFAULT_NETWORK_KEY): NetworkConfig {
  return NETWORKS[key] || NETWORKS.mainnet;
}

export function getActiveNetwork(): NetworkConfig {
  return getNetworkConfig(DEFAULT_NETWORK_KEY);
}

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find((net) => net.chainId === chainId);
}

/**
 * Resolves a network key from a key, name, chain ID, or explorer URL hint.
 */
export function resolveNetworkKey(networkKeyOrName?: string | NetworkKey): NetworkKey {
  if (!networkKeyOrName) return DEFAULT_NETWORK_KEY;
  const str = String(networkKeyOrName).toLowerCase();
  if (str === 'mainnet' || str.includes('mainnet') || str.includes('677') || str.includes('botchain.ai')) {
    return 'mainnet';
  }
  if (str === 'testnet' || str.includes('testnet') || str.includes('968') || str.includes('bohr.life')) {
    return 'testnet';
  }
  return DEFAULT_NETWORK_KEY;
}

export function getExplorerTxUrl(txHash: string, networkKeyOrName?: string | NetworkKey): string {
  const resolvedKey = resolveNetworkKey(networkKeyOrName);
  const net = getNetworkConfig(resolvedKey);
  const cleanHash = txHash?.trim() || '';
  return `${net.explorerUrl.replace(/\/$/, '')}/tx/${cleanHash}`;
}

export function getExplorerAddressUrl(address: string, networkKeyOrName?: string | NetworkKey): string {
  const resolvedKey = resolveNetworkKey(networkKeyOrName);
  const net = getNetworkConfig(resolvedKey);
  const cleanAddr = address?.trim() || '';
  return `${net.explorerUrl.replace(/\/$/, '')}/address/${cleanAddr}`;
}
