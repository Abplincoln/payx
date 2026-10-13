import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DEMO_PATIENT } from '@/data/mockData';
import { formatWallet } from '@/utils/format';
import { useWallet } from '@/context/WalletContext';

export function PatientSettings() {
  const { account, network } = useWallet();

  return (
    <div>
      <PageHeader title="Settings" description={`Manage your patient profile on ${network.name}.`} />

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
                value={account || DEMO_PATIENT.walletAddress}
                disabled
                hint={account ? `Connected wallet on ${network.name}: ${formatWallet(account)}` : 'Connect your wallet in the header to manage your profile.'}
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Patient profiles are linked directly to your connected Web3 wallet address.
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
