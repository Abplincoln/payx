export type BillStatus = 'pending' | 'paid' | 'cancelled' | 'overdue';

export type UserRole = 'provider' | 'patient';

export interface Bill {
  id: string;
  patientReferenceId: string;
  patientWalletAddress: string;
  providerId: string;
  providerName: string;
  providerWalletAddress: string;
  serviceDescription: string;
  amountBOT: number;
  dueDate: string;
  createdDate: string;
  paymentDate: string | null;
  status: BillStatus;
  transactionHash: string | null;
}

export interface Payment {
  id: string;
  billId: string;
  patientWalletAddress: string;
  providerWalletAddress: string;
  amountBOT: number;
  paymentDate: string;
  transactionHash: string;
  network: string;
}

export interface Provider {
  id: string;
  name: string;
  walletAddress: string;
  facility: string;
}

export interface Patient {
  id: string;
  referenceId: string;
  walletAddress: string;
  name: string;
}

export interface VerificationResult {
  billId: string;
  status: BillStatus;
  amountBOT: number;
  providerName: string;
  providerWalletAddress: string;
  patientReferenceId: string;
  patientWalletAddress: string;
  paymentDate: string | null;
  transactionHash: string | null;
  network: string;
  verified: boolean;
}
