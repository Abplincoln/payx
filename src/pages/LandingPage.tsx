import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, ArrowRight, FileText, Search, Wallet, CheckCircle2 } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/Button';

export function LandingPage() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const selectRole = (role: 'provider' | 'patient') => {
    setRole(role);
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">PayX</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-500" />
            BotChain Testnet
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Blockchain-verified billing
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Medical billing and payment, verified on-chain.
          </h1>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            Create, manage, and verify medical bill payments with transparent blockchain records.
            PayX connects healthcare providers and patients through a secure, auditable payment flow.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => selectRole('provider')} className="w-full sm:w-auto">
              Continue as Provider
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => selectRole('patient')} className="w-full sm:w-auto">
              Continue as Patient
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-lg font-semibold text-gray-900">How PayX works</h2>
          <p className="mt-1 text-sm text-gray-500">A simple, transparent flow from billing to verification.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Step
              number="1"
              icon={FileText}
              title="Provider creates a bill"
              description="The provider issues a bill with service details and amount in BOT."
            />
            <Step
              number="2"
              icon={Search}
              title="Patient reviews the bill"
              description="The patient receives the bill and can review all charges before paying."
            />
            <Step
              number="3"
              icon={Wallet}
              title="Patient pays with BOT"
              description="Payment is made in BOT tokens directly through the application."
            />
            <Step
              number="4"
              icon={CheckCircle2}
              title="Payment is verified on BotChain"
              description="The transaction is recorded on-chain and can be publicly verified."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Demo application.</strong> Uses testnet data and does not process real medical records or real-world payments.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          PayX — Medical billing and payment, verified on-chain. Built on BotChain Testnet.
        </p>
      </footer>
    </div>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50">
          <Icon className="h-4.5 w-4.5 text-primary-600" />
        </div>
        <span className="text-xs font-semibold text-gray-400">Step {number}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
