import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from '@/context/RoleContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LandingPage } from '@/pages/LandingPage';
import { VerifyPage } from '@/pages/VerifyPage';

// Provider pages
import { ProviderOverview } from '@/pages/provider/ProviderOverview';
import { ProviderBills } from '@/pages/provider/ProviderBills';
import { ProviderCreateBill } from '@/pages/provider/ProviderCreateBill';
import { ProviderBillDetails } from '@/pages/provider/ProviderBillDetails';
import { ProviderPayments } from '@/pages/provider/ProviderPayments';
import { ProviderVerification } from '@/pages/provider/ProviderVerification';
import { ProviderSettings } from '@/pages/provider/ProviderSettings';

// Patient pages
import { PatientOverview } from '@/pages/patient/PatientOverview';
import { PatientBills } from '@/pages/patient/PatientBills';
import { PatientBillDetails } from '@/pages/patient/PatientBillDetails';
import { PatientPaymentHistory } from '@/pages/patient/PatientPaymentHistory';
import { PatientVerification } from '@/pages/patient/PatientVerification';
import { PatientSettings } from '@/pages/patient/PatientSettings';

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<VerifyPage />} />

          {/* Provider dashboard */}
          <Route path="/dashboard/provider" element={<DashboardLayout />}>
            <Route index element={<ProviderOverview />} />
            <Route path="bills" element={<ProviderBills />} />
            <Route path="bills/:billId" element={<ProviderBillDetails />} />
            <Route path="create-bill" element={<ProviderCreateBill />} />
            <Route path="payments" element={<ProviderPayments />} />
            <Route path="verification" element={<ProviderVerification />} />
            <Route path="settings" element={<ProviderSettings />} />
          </Route>

          {/* Patient dashboard */}
          <Route path="/dashboard/patient" element={<DashboardLayout />}>
            <Route index element={<PatientOverview />} />
            <Route path="bills" element={<PatientBills />} />
            <Route path="bills/:billId" element={<PatientBillDetails />} />
            <Route path="payments" element={<PatientPaymentHistory />} />
            <Route path="verification" element={<PatientVerification />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}
