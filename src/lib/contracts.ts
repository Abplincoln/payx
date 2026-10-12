import { ethers } from 'ethers';
import { getActiveNetwork, type NetworkConfig } from '@/config/network';

export const MEDICAL_BILLING_ABI = [
  // Events
  'event ProviderRegistered(address indexed provider)',
  'event BillCreated(uint256 indexed billId, address indexed provider, address indexed patient, string patientReference, uint256 amount, uint256 dueDate)',
  'event BillUpdated(uint256 indexed billId)',
  'event BillCancelled(uint256 indexed billId)',
  'event BillPaid(uint256 indexed billId, address indexed patient, address indexed provider, uint256 amount, uint256 paidAt)',

  // Errors
  'error ProviderAlreadyRegistered()',
  'error ProviderNotRegistered()',
  'error UnauthorizedProvider()',
  'error InvalidPatient()',
  'error InvalidPatientReference()',
  'error InvalidServiceDescription()',
  'error InvalidAmount()',
  'error InvalidDueDate()',
  'error BillNotFound()',
  'error BillNotPending()',
  'error IncorrectPaymentAmount()',
  'error UnauthorizedPatient()',
  'error PaymentTransferFailed()',

  // Struct & Functions
  'function registerProvider() external',
  'function isProviderRegistered(address provider) external view returns (bool)',
  'function createBill(string calldata patientReference, address patient, string calldata serviceDescription, uint256 amount, uint256 dueDate) external returns (uint256)',
  'function updateBill(uint256 billId, string calldata patientReference, address patient, string calldata serviceDescription, uint256 amount, uint256 dueDate) external',
  'function cancelBill(uint256 billId) external',
  'function payBill(uint256 billId) external payable',
  'function getBill(uint256 billId) external view returns (tuple(uint256 billId, string patientReference, address patient, address provider, string serviceDescription, uint256 amount, uint256 dueDate, uint8 status, uint256 createdAt, uint256 paidAt))',
  'function getProviderBills(address provider) external view returns (uint256[] memory)',
  'function getPatientBills(address patient) external view returns (uint256[] memory)',
  'function getTotalBills() external view returns (uint256)',
  'function totalBills() external view returns (uint256)',
];

export interface ContractBillData {
  billId: bigint;
  patientReference: string;
  patient: string;
  provider: string;
  serviceDescription: string;
  amount: bigint;
  dueDate: bigint;
  status: number; // 0 = Pending, 1 = Paid, 2 = Cancelled
  createdAt: bigint;
  paidAt: bigint;
}

/**
 * Returns a read-only ethers JsonRpcProvider for the specified or active network.
 */
export function getReadOnlyProvider(network: NetworkConfig = getActiveNetwork()): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(network.rpcUrl);
}

/**
 * Returns a read-only ethers Contract instance pointing to the specified or active network's contract.
 */
export function getReadOnlyContract(network: NetworkConfig = getActiveNetwork()): ethers.Contract {
  const provider = getReadOnlyProvider(network);
  return new ethers.Contract(network.contractAddress, MEDICAL_BILLING_ABI, provider);
}

/**
 * Prompts MetaMask to switch to the specified network, or adds it if not present.
 */
export async function switchOrAddEthereumNetwork(network: NetworkConfig = getActiveNetwork()): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or Web3 wallet is not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainIdHex }],
    });
    return true;
  } catch (error: unknown) {
    const rpcErr = error as { code?: number; data?: { originalError?: { code?: number } } };
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (rpcErr?.code === 4902 || rpcErr?.data?.originalError?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: network.chainIdHex,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.explorerUrl],
            nativeCurrency: network.nativeCurrency,
          },
        ],
      });
      return true;
    }
    throw error;
  }
}

/**
 * Connects to MetaMask and ensures it is on the target network.
 */
export async function connectMetaMask(
  targetNetwork: NetworkConfig = getActiveNetwork()
): Promise<{ address: string; chainId: number; signer: ethers.JsonRpcSigner }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to interact with BOT Chain.');
  }

  // Request accounts
  const accounts = (await window.ethereum.request<string[]>({
    method: 'eth_requestAccounts',
  })) || [];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts selected in wallet.');
  }

  // Ensure network is selected
  await switchOrAddEthereumNetwork(targetNetwork);

  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  const address = await signer.getAddress();
  const network = await browserProvider.getNetwork();
  const currentChainId = Number(network.chainId);

  if (currentChainId !== targetNetwork.chainId) {
    throw new Error(
      `Network mismatch: Wallet is connected to Chain ID ${currentChainId}, but ${targetNetwork.name} (Chain ID ${targetNetwork.chainId}) is required.`
    );
  }

  return {
    address,
    chainId: currentChainId,
    signer,
  };
}

/**
 * Returns a writeable contract instance using the user's connected signer.
 * Strictly verifies chain alignment to prevent executing against wrong chain.
 */
export async function getSignerContract(
  network: NetworkConfig = getActiveNetwork()
): Promise<ethers.Contract> {
  const { signer, chainId } = await connectMetaMask(network);
  if (chainId !== network.chainId) {
    throw new Error(
      `Cannot execute contract transaction: Wallet is on Chain ID ${chainId}, but selected network is ${network.name} (Chain ID ${network.chainId}).`
    );
  }
  return new ethers.Contract(network.contractAddress, MEDICAL_BILLING_ABI, signer);
}

export interface PayBillResult {
  transactionHash: string;
  blockNumber: number;
}

/**
 * Executes payBill on-chain with strict chain verification, balance checks, and error handling.
 */
export async function payBillOnChain(
  billId: number | bigint,
  amountBOT: number | string,
  network: NetworkConfig = getActiveNetwork()
): Promise<PayBillResult> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or Web3 wallet is not installed.');
  }

  // 1. Connect and verify network alignment
  const { signer, chainId, address } = await connectMetaMask(network);
  if (chainId !== network.chainId) {
    throw new Error(
      `Cannot send payment: Connected to Chain ID ${chainId}, but ${network.name} requires Chain ID ${network.chainId}.`
    );
  }

  // 2. Check patient balance
  const provider = signer.provider;
  const balance = await provider.getBalance(address);
  const amountWei = ethers.parseEther(String(amountBOT));
  if (balance < amountWei) {
    throw new Error(
      `Insufficient BOT balance. Required: ${amountBOT} BOT, Wallet balance: ${ethers.formatEther(balance)} BOT.`
    );
  }

  // 3. Send transaction
  const contract = new ethers.Contract(network.contractAddress, MEDICAL_BILLING_ABI, signer);
  const tx = await contract.payBill(billId, { value: amountWei });
  const receipt = await tx.wait();

  if (!receipt || receipt.status === 0) {
    throw new Error('Payment transaction reverted on-chain.');
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Translates Web3 and contract errors into user-friendly messages.
 */
export function parseWeb3Error(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  const err = error as {
    code?: number | string;
    message?: string;
    reason?: string;
    data?: { message?: string };
    info?: { error?: { message?: string } };
  };

  // User rejection
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user in wallet.';
  }
  if (err.code === -32002) {
    return 'A request is already pending in MetaMask. Please open your wallet extension.';
  }
  if (err.code === 4902) {
    return 'Network not found in MetaMask. Please approve adding the network.';
  }

  // Revert reason or custom error messages
  const rawMsg = err.reason || err.data?.message || err.info?.error?.message || err.message || '';
  if (rawMsg.includes('insufficient funds') || rawMsg.includes('exceeds balance')) {
    return 'Insufficient BOT in wallet to cover the payment amount and gas fee.';
  }
  if (rawMsg.includes('BillNotPending')) {
    return 'This bill is no longer pending payment.';
  }
  if (rawMsg.includes('BillNotFound')) {
    return 'Bill not found on this network.';
  }
  if (rawMsg.includes('IncorrectPaymentAmount')) {
    return 'Payment amount does not match the bill amount.';
  }
  if (rawMsg.includes('UnauthorizedPatient')) {
    return 'Your connected wallet is not the authorized patient for this bill.';
  }
  if (rawMsg.includes('PaymentTransferFailed')) {
    return 'Transfer to healthcare provider failed.';
  }

  return rawMsg || 'Transaction failed. Please try again.';
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract Read Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchTotalBills(network: NetworkConfig = getActiveNetwork()): Promise<bigint> {
  const contract = getReadOnlyContract(network);
  return await contract.getTotalBills();
}

export async function checkIsProviderRegistered(
  address: string,
  network: NetworkConfig = getActiveNetwork()
): Promise<boolean> {
  const contract = getReadOnlyContract(network);
  return await contract.isProviderRegistered(address);
}

export async function fetchBillById(
  billId: number | bigint,
  network: NetworkConfig = getActiveNetwork()
): Promise<ContractBillData> {
  const contract = getReadOnlyContract(network);
  const raw = await contract.getBill(billId);
  return {
    billId: raw[0],
    patientReference: raw[1],
    patient: raw[2],
    provider: raw[3],
    serviceDescription: raw[4],
    amount: raw[5],
    dueDate: raw[6],
    status: Number(raw[7]),
    createdAt: raw[8],
    paidAt: raw[9],
  };
}
