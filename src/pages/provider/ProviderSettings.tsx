import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DEMO_PROVIDER } from '@/data/mockData';
import { formatWallet } from '@/utils/format';

export function ProviderSettings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your provider profile." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Provider Profile</h3>
            <div className="space-y-5">
              <Input
                label="Provider Name"
                name="providerName"
                defaultValue={DEMO_PROVIDER.name}
                disabled
              />
              <Input
                label="Facility"
                name="facility"
                defaultValue={DEMO_PROVIDER.facility}
                disabled
              />
              <Input
                label="Wallet Address"
                name="walletAddress"
                defaultValue={DEMO_PROVIDER.walletAddress}
                disabled
                hint={`Connected wallet: ${formatWallet(DEMO_PROVIDER.walletAddress)}`}
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Profile editing and wallet connection will be available once blockchain integration is added.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email notifications for new payments</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-300" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Auto-mark overdue bills after due date</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-300" />
              </label>
            </div>
            <div className="mt-5">
              <Button disabled>Save Changes</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
