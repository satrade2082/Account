import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Store, 
  ShoppingCart, 
  Boxes, 
  Receipt,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, users, businessProfile } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials.');
        setIsLoading(false);
      }
    }, 200);
  };

  const handleQuickLogin = (roleUsername: string, rolePassword: string) => {
    setUsername(roleUsername);
    setPassword(rolePassword);
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(roleUsername, rolePassword);
      if (!res.success) {
        setError(res.error || 'Quick login failed.');
        setIsLoading(false);
      }
    }, 200);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'sales_cashier':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'inventory_manager':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'accountant':
        return <Receipt className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-stone-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'sales_cashier':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'inventory_manager':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'accountant':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin (Full Control)';
      case 'sales_cashier':
        return 'Sales & POS Cashier';
      case 'inventory_manager':
        return 'Inventory & Purchases';
      case 'accountant':
        return 'Accountant & Finance';
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-5 border-b border-stone-800/80 backdrop-blur bg-stone-950/40 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-100 tracking-tight flex items-center gap-2">
                {businessProfile.companyName}
              </h1>
              <p className="text-xs text-stone-400 font-medium">
                {businessProfile.tagline}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 bg-stone-800/60 px-3 py-1.5 rounded-lg border border-stone-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{businessProfile.taxRegistrationNumber || 'PAN Verified System'}</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4 sm:my-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
          
          {/* Left / Top: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-medium mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Staff Access • प्रयोगकर्ता लगइन</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-stone-400 mt-1">
                Enter your credentials or 4-digit PIN to access your workspace.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  Username / प्रयोगकर्ता नाम or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="login-username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. admin, cashier, storekeeper"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Password / 4-Digit PIN (पासवर्ड / पिन)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password or quick PIN"
                    className="w-full pl-10 pr-11 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying Access...
                  </span>
                ) : (
                  <>
                    <span>Sign In to System (लगइन गर्नुहोस्)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Role-Based Permission Guard
              </span>
              <span className="text-stone-500">
                Managed by Admin
              </span>
            </div>
          </div>

          {/* Right / Bottom: Quick Demo Switcher */}
          <div className="lg:col-span-5 bg-stone-900/90 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Quick Login Profiles (द्रुत लगइन)</span>
                </div>
                <span className="text-[11px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                  Demo
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Click any pre-configured staff account below to test roles and permissions instantly:
              </p>

              <div className="space-y-2.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.username, u.password || u.pin || '')}
                    className="w-full text-left p-3 rounded-xl bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700/60 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: u.avatarColor || '#3E4A3D' }}
                        >
                          {u.fullName.charAt(0)}
                        </span>
                        <span className="text-xs font-semibold text-stone-200 group-hover:text-emerald-400 transition">
                          {u.fullName}
                        </span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeColor(u.role)} flex items-center gap-1`}>
                        {getRoleIcon(u.role)}
                        {u.role.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pl-8">
                      <span>User: <strong className="text-stone-300">{u.username}</strong></span>
                      <span>Pass: <strong className="text-stone-300">{u.password}</strong> | PIN: <strong className="text-stone-300">{u.pin}</strong></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800 text-[11px] text-stone-400 leading-relaxed">
              <p className="flex items-center gap-1.5 font-medium text-stone-300 mb-1">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                Administrative Privilege Control:
              </p>
              <p>
                Admins can add, edit, lock, delete, and set passwords/PINs for all staff from the <strong>Settings &gt; User Management</strong> section.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Bar */}
      <footer className="px-6 py-4 border-t border-stone-800/60 text-center text-xs text-stone-400 relative z-10">
        <p>
          {businessProfile.companyName} • OmniStock ERP & POS Nepal • Authorized Access Only
        </p>
      </footer>
    </div>
  );
};
