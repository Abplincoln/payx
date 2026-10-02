import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SuccessState } from '@/components/ui/State';
import { isValidWalletAddress } from '@/utils/format';
import { validateField } from '@/utils/validation';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

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
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

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
    ]) ?? undefined;

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Create Bill" />
        <Card>
          <CardBody>
            <SuccessState
              title="Bill form validated successfully"
              description="Blockchain integration coming in the next stage. The bill will be created on-chain once smart contract integration is added."
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setForm(initialForm); setSubmitted(false); }}>
                    Create Another
                  </Button>
                  <Button onClick={() => navigate('/dashboard/provider/bills')}>
                    Back to Bills
                  </Button>
                </div>
              }
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create Bill"
        description="Issue a new bill to a patient."
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard/provider/bills')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Bills
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Patient Reference ID"
              name="patientReferenceId"
              placeholder="e.g. PAT-001"
              value={form.patientReferenceId}
              onChange={(e) => update('patientReferenceId', e.target.value)}
              error={errors.patientReferenceId}
              required
            />

            <Input
              label="Patient Wallet Address"
              name="patientWalletAddress"
              placeholder="0x…"
              value={form.patientWalletAddress}
              onChange={(e) => update('patientWalletAddress', e.target.value)}
              error={errors.patientWalletAddress}
              hint="Enter the patient's 0x-prefixed wallet address."
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
                required
              />
              <Input
                label="Due Date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
                error={errors.dueDate}
                required
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4" />
                Create Bill
              </Button>
              <p className="text-xs text-gray-400">
                Blockchain integration coming in the next stage
              </p>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
