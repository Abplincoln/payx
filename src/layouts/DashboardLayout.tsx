import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  CreditCard,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  HeartPulse,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const navConfig: Record<UserRole, NavItem[]> = {
  provider: [
    { label: 'Overview', path: '/dashboard/provider', icon: LayoutDashboard },
    { label: 'Bills', path: '/dashboard/provider/bills', icon: FileText },
    { label: 'Create Bill', path: '/dashboard/provider/create-bill', icon: FilePlus },
    { label: 'Payments', path: '/dashboard/provider/payments', icon: CreditCard },
    { label: 'Verification', path: '/dashboard/provider/verification', icon: ShieldCheck },
    { label: 'Settings', path: '/dashboard/provider/settings', icon: Settings },
  ],
  patient: [
    { label: 'Overview', path: '/dashboard/patient', icon: LayoutDashboard },
    { label: 'My Bills', path: '/dashboard/patient/bills', icon: FileText },
    { label: 'Payment History', path: '/dashboard/patient/payments', icon: CreditCard },
    { label: 'Verification', path: '/dashboard/patient/verification', icon: ShieldCheck },
    { label: 'Settings', path: '/dashboard/patient/settings', icon: Settings },
  ],
};

export function DashboardLayout() {
  const { role, setRole } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!role) {
    navigate('/');
    return null;
  }

  const navItems = navConfig[role];
  const roleLabel = role === 'provider' ? 'Provider Portal' : 'Patient Portal';

  const handleLogout = () => {
    setRole(null);
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === `/dashboard/${role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <SidebarContent
          role={role}
          roleLabel={roleLabel}
          navItems={navItems}
          isActive={isActive}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white border-r border-gray-200 flex flex-col">
            <button
              className="absolute top-4 right-3 p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              role={role}
              roleLabel={roleLabel}
              navItems={navItems}
              isActive={isActive}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2 ml-2 lg:ml-0">
              <span className="text-sm font-medium text-gray-700">{roleLabel}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">Demo Mode</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent-500" />
                BotChain Testnet
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  role: UserRole;
  roleLabel: string;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ roleLabel, navItems, isActive, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600">
          <HeartPulse className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">PayX</span>
          <p className="text-xs text-gray-400 -mt-0.5">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 shrink-0">
        <Link
          to="/verify"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ShieldCheck className="h-4.5 w-4.5 text-gray-400" />
          Public Verification
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 text-gray-400" />
          Switch Role
        </button>
      </div>
    </>
  );
}
