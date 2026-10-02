import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DEMO_PATIENT } from '@/data/mockData';
import { formatWallet } from '@/utils/format';

export function PatientSettings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your patient profile." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Patient Profile</h3>
            <div className="space-y-5">
              <Input
                label="Name"
                name="name"
                defaultValue={DEMO_PATIENT.name}
                disabled
              />
              <Input
                label="Reference ID"
                name="referenceId"
                defaultValue={DEMO_PATIENT.referenceId}
                disabled
              />
              <Input
                label="Wallet Address"
                name="walletAddress"
                defaultValue={DEMO_PATIENT.walletAddress}
                disabled
                hint={`Connected wallet: ${formatWallet(DEMO_PATIENT.walletAddress)}`}
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Profile editing and wallet connection will be available once blockchain integration is added.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Notify me when a new bill is received</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-300" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Notify me before a bill is due</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-300" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Receipt confirmation after payment</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-300" />
              </label>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
