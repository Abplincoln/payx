import type { Bill, Payment, Provider, Patient } from '@/types';

// ═══════════════════════════════════════════════════════════════════════
// DEMO / MOCK DATA — temporary
// These values are fictional and for UI demonstration only.
// They will be replaced by on-chain data in later stages.
// ═══════════════════════════════════════════════════════════════════════

export const DEMO_PROVIDER: Provider = {
  id: 'PROV-001',
  name: 'Dr. Sarah Chen',
  walletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
  facility: 'Northbridge Medical Center',
};

export const DEMO_PATIENT: Patient = {
  id: 'PAT-001',
  referenceId: 'PAT-001',
  walletAddress: '0x8B3d7E2fA1c9D456b0E8f2C4a6D9e1B3f5A7c0E2',
  name: 'James Mitchell',
};

export const DEMO_BILLS: Bill[] = [
  {
    id: 'PX-0001',
    patientReferenceId: 'PAT-001',
    patientWalletAddress: '0x8B3d7E2fA1c9D456b0E8f2C4a6D9e1B3f5A7c0E2',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'General Consultation',
    amountBOT: 25,
    dueDate: '2026-09-28',
    createdDate: '2026-09-15',
    paymentDate: null,
    status: 'pending',
    transactionHash: null,
  },
  {
    id: 'PX-0002',
    patientReferenceId: 'PAT-002',
    patientWalletAddress: '0x1c5E4a9B3d7F028e6C4a2D8b1f5A3e9C7d0B4f6E',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'Laboratory Test — Complete Blood Count',
    amountBOT: 40,
    dueDate: '2026-09-25',
    createdDate: '2026-09-12',
    paymentDate: '2026-09-20',
    status: 'paid',
    transactionHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  },
  {
    id: 'PX-0003',
    patientReferenceId: 'PAT-003',
    patientWalletAddress: '0x2d6F5b0C4e8A139f7D5b3E9c1a4B7d2F6e0A8c1D',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'Radiology — Chest X-Ray',
    amountBOT: 60,
    dueDate: '2026-09-18',
    createdDate: '2026-09-05',
    paymentDate: null,
    status: 'overdue',
    transactionHash: null,
  },
  {
    id: 'PX-0004',
    patientReferenceId: 'PAT-004',
    patientWalletAddress: '0x3e7A6c1D5f9B240e8E6c4F0d2b5C8e3A7f1B9d2E',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'Specialist Consultation — Cardiology',
    amountBOT: 75,
    dueDate: '2026-10-05',
    createdDate: '2026-09-22',
    paymentDate: null,
    status: 'pending',
    transactionHash: null,
  },
  {
    id: 'PX-0005',
    patientReferenceId: 'PAT-005',
    patientWalletAddress: '0x4f8B7d2E6a0C351f9F7d5A1e3c6D9f4B8a2C0e3F',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'Vaccination — Influenza',
    amountBOT: 15,
    dueDate: '2026-09-10',
    createdDate: '2026-09-01',
    paymentDate: '2026-09-08',
    status: 'paid',
    transactionHash: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
  },
  {
    id: 'PX-0006',
    patientReferenceId: 'PAT-001',
    patientWalletAddress: '0x8B3d7E2fA1c9D456b0E8f2C4a6D9e1B3f5A7c0E2',
    providerId: 'PROV-001',
    providerName: 'Northbridge Medical Center',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    serviceDescription: 'Follow-up Consultation',
    amountBOT: 20,
    dueDate: '2026-09-30',
    createdDate: '2026-09-20',
    paymentDate: null,
    status: 'cancelled',
    transactionHash: null,
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'PYMT-001',
    billId: 'PX-0002',
    patientWalletAddress: '0x1c5E4a9B3d7F028e6C4a2D8b1f5A3e9C7d0B4f6E',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    amountBOT: 40,
    paymentDate: '2026-09-20',
    transactionHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    network: 'BotChain Testnet',
  },
  {
    id: 'PYMT-002',
    billId: 'PX-0005',
    patientWalletAddress: '0x4f8B7d2E6a0C351f9F7d5A1e3c6D9f4B8a2C0e3F',
    providerWalletAddress: '0x4F2aE1cB8739dA05e2C1B4f6D8e3A9b1C5d7E0f2',
    amountBOT: 15,
    paymentDate: '2026-09-08',
    transactionHash: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    network: 'BotChain Testnet',
  },
];
