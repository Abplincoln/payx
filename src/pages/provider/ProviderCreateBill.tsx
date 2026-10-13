import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { isValidWalletAddress, formatWallet, formatTxHash } from '@/utils/format';
import { validateField } from '@/utils/validation';
import { useWallet } from '@/context/WalletContext';
import {
  checkIsProviderRegistered,
  registerProviderOnChain,
  createBillOnChain,
  parseWeb3Error,
} from '@/lib/contracts';
import { getExplorerTxUrl } from '@/config/network';
import {
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

interface FormState {
  patientReferenceId: string;
  patientWalletAddress: string;
  serviceDescription: string;
  amountBOT: string;
  dueDate: string;
}

const initialForm: FormState = {
  patientReferenceId: '',
  patientWalletAddress: '',
  serviceDescription: '',
  amountBOT: '',
  dueDate: '',
};

export function ProviderCreateBill() {
  const navigate = useNavigate();
  const { account, chainId, network, networkKey, switchNetwork, connect, isChainMismatch } =
    useWallet();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Registration state
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isCheckingReg, setIsCheckingReg] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessTx, setRegSuccessTx] = useState<string | null>(null);

  // Bill creation state
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    billId: string;
    transactionHash: string;
  } | null>(null);

  // Check registration status when account or network changes
  useEffect(() => {
    let active = true;
    if (!account) {
      setIsRegistered(null);
      return;
    }

    setIsCheckingReg(true);
    checkIsProviderRegistered(account, network)
      .then((registered) => {
        if (active) {
          setIsRegistered(registered);
        }
      })
      .catch((err) => {
        console.warn('Failed to check provider registration:', err);
        if (active) {
          setIsRegistered(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsCheckingReg(false);
        }
      });

    return () => {
      active = false;
    };
  }, [account, network]);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    newErrors.patientReferenceId = validateField(form.patientReferenceId, [
      { required: true, message: 'Patient reference ID is required' },
    ]) ?? undefined;

    newErrors.patientWalletAddress = validateField(form.patientWalletAddress, [
      { required: true, message: 'Patient wallet address is required' },
      { validator: isValidWalletAddress, message: 'Enter a valid 0x-prefixed wallet address' },
    ]) ?? undefined;

    newErrors.serviceDescription = validateField(form.serviceDescription, [
      { required: true, message: 'Service description is required' },
    ]) ?? undefined;

    newErrors.amountBOT = validateField(form.amountBOT, [
      { required: true, message: 'Amount is required' },
      {
        validator: (v) => parseFloat(v) > 0,
        message: 'Amount must be greater than zero',
      },
    ]) ?? undefined;

    newErrors.dueDate = validateField(form.dueDate, [
      { required: true, message: 'Due date is required' },
      {
        validator: (v) => {
          const selected = new Date(`${v}T23:59:59Z`).getTime();
          return selected > Date.now();
        },
        message: 'Due date must be in the future',
      },
    ]) ?? undefined;

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleRegisterProvider = async () => {
    setRegError(null);
    setIsRegistering(true);
    try {
      const res = await registerProviderOnChain(network);
      setRegSuccessTx(res.transactionHash);
      setIsRegistered(true);
    } catch (err: unknown) {
      setRegError(parseWeb3Error(err));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!account) {
      await connect();
      return;
    }

    if (isChainMismatch) {
      setCreateError(
        `Wallet is on Chain ${chainId}. Please switch to ${network.name} (Chain ${network.chainId}) before submitting.`
      );
      return;
    }

    if (isRegistered === false) {
      setCreateError(
        'You must register as a healthcare provider before creating bills. Please click "Register as Provider" above.'
      );
      return;
    }

    if (!validate()) return;

    setIsCreating(true);
    try {
      const res = await createBillOnChain(
        {
          patientReference: form.patientReferenceId,
          patient: form.patientWalletAddress,
          serviceDescription: form.serviceDescription,
          amountBOT: form.amountBOT,
          dueDate: form.dueDate,
        },
        network
      );

      const formattedId = `PX-${res.billId.toString().padStart(4, '0')}`;
      setCreatedResult({
        billId: formattedId,
        transactionHash: res.transactionHash,
      });
    } catch (err: unknown) {
      setCreateError(parseWeb3Error(err));
    } finally {
      setIsCreating(false);
    }
  };

  // Confirmation view after on-chain creation
  if (createdResult) {
    return (
      <div>
        <PageHeader title="Create Bill" />
        <Card className="max-w-2xl overflow-hidden">
          <div className="bg-success-50 border-b border-success-100 px-6 py-5 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-500">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-success-700">Bill Created on Chain</h2>
              <p className="text-sm text-success-600">
                Confirmed on {network.name} (Chain ID {network.chainId})
              </p>
            </div>
          </div>

          <CardBody className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill ID</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900 font-mono">
                  {createdResult.billId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                <dd className="mt-1 text-sm font-semibold text-amber-600">Pending Payment</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{form.amountBOT} BOT</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{form.dueDate}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient Wallet</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {form.patientWalletAddress}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{form.serviceDescription}</dd>
              </div>
            </dl>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Hash</dt>
              <dd className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 block text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono break-all">
                  {createdResult.transactionHash}
                </code>
                <a
                  href={getExplorerTxUrl(createdResult.transactionHash, networkKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </dd>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setForm(initialForm);
                  setCreatedResult(null);
                }}
              >
                Create Another Bill
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => navigate('/dashboard/provider/bills')}
              >
                Back to Bills
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create Bill"
        description={`Issue an on-chain bill to a patient on ${network.name}.`}
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard/provider/bills')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Bills
          </Button>
        }
      />

      {/* Wallet Connection Required */}
      {!account && (
        <Card className="max-w-2xl mb-6 border-amber-200 bg-amber-50/50">
          <CardBody className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Provider Wallet Required</p>
                <p className="text-xs text-amber-700">
                  Connect your wallet to {network.name} to issue on-chain medical bills.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={connect}>
              Connect Wallet
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Chain Mismatch Warning */}
      {account && isChainMismatch && (
        <Card className="max-w-2xl mb-6 border-amber-300 bg-amber-50">
          <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Wrong Network Connected</p>
                <p className="text-xs text-amber-700">
                  Wallet is on Chain ID {chainId}. Please switch to {network.name} (Chain ID{' '}
                  {network.chainId}) to create bills.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              onClick={() => switchNetwork(networkKey)}
            >
              Switch to {network.name}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Provider Registration Banner */}
      {account && !isChainMismatch && isRegistered === false && (
        <Card className="max-w-2xl mb-6 border-primary-200 bg-primary-50/40">
          <CardBody className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Provider Registration Required
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Your connected wallet (<span className="font-mono">{formatWallet(account)}</span>) is
                  not yet registered as a healthcare provider on {network.name}. You must register on-chain
                  before you can create patient bills.
                </p>

                {regError && (
                  <p className="text-xs text-error-600 mt-2 font-medium">{regError}</p>
                )}

                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={handleRegisterProvider}
                    disabled={isRegistering}
                    className="flex items-center gap-1.5"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Confirming in MetaMask…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Register as Provider on {network.name}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Registration Success Notification */}
      {regSuccessTx && (
        <Card className="max-w-2xl mb-6 border-emerald-200 bg-emerald-50/50">
          <CardBody className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800">
                Provider registration confirmed on {network.name}! Tx: {formatTxHash(regSuccessTx)}
              </span>
            </div>
            <a
              href={getExplorerTxUrl(regSuccessTx, networkKey)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-700 underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </CardBody>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {createError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                {createError}
              </div>
            )}

            <Input
              label="Patient Reference ID"
              name="patientReferenceId"
              placeholder="e.g. PAT-001"
              value={form.patientReferenceId}
              onChange={(e) => update('patientReferenceId', e.target.value)}
              error={errors.patientReferenceId}
              disabled={isCreating}
              required
            />

            <Input
              label="Patient Wallet Address"
              name="patientWalletAddress"
              placeholder="0x…"
              value={form.patientWalletAddress}
              onChange={(e) => update('patientWalletAddress', e.target.value)}
              error={errors.patientWalletAddress}
              hint="Enter the patient's 0x-prefixed wallet address on BOT Chain."
              disabled={isCreating}
              required
            />

            <Textarea
              label="Service Description"
              name="serviceDescription"
              placeholder="e.g. General Consultation, Laboratory Test — Complete Blood Count"
              value={form.serviceDescription}
              onChange={(e) => update('serviceDescription', e.target.value)}
              error={errors.serviceDescription}
              rows={3}
              disabled={isCreating}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Amount (BOT)"
                name="amountBOT"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 25"
                value={form.amountBOT}
                onChange={(e) => update('amountBOT', e.target.value)}
                error={errors.amountBOT}
                disabled={isCreating}
                required
              />
              <Input
                label="Due Date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
                error={errors.dueDate}
                disabled={isCreating}
                required
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="submit"
                disabled={isCreating || isCheckingReg || isChainMismatch || !account}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Broadcasting on {network.name}…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Create Bill on {network.name}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Network: <strong>{network.name}</strong> (Chain {network.chainId})
              </p>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
