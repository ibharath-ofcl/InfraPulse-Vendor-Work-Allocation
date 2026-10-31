import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRoleLandingRoute = (role: UserRole): string => {
    switch (role) {
      case 'PLATFORM_ADMIN': return '/overview';
      case 'PROJECT_MANAGER': return '/overview';
      case 'VENDOR': return '/work-allocation';
      case 'FIELD_ENGINEER': return '/quality-inspection';
      case 'FINANCE_OFFICER': return '/milestones';
      default: return '/overview';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your registered email and password.');
      return;
    }

    setLoading(true);
    try {
      const authenticatedUser = await login({ email, password });
      
      // Determine destination route
      const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname 
        || getRoleLandingRoute(authenticatedUser.role);
        
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosError.response?.data?.message || 'Authentication failed. Please verify credentials.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication service temporarily unavailable. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex bg-surface-canvas text-ink-primary">
      {/* Left Column: Enterprise Infrastructure Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-950 flex-col justify-between p-12 relative overflow-hidden text-white border-r border-navy-800">
        {/* Subtle decorative grid overlay */}
        <div 
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px]" 
        />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-navy-700/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">InfraPulse AI</span>
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-teal-400">
                Infrastructure Operations Command
              </span>
            </div>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Security &amp; RBAC Active</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Infrastructure. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400">
              Verified Execution.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Centralized PIN-code based contractor work allocation, sequential dependency conflict prevention, 
            geotagged evidence verification, and cryptographic milestone authorization.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Multi-Role Access Control across Admin, PM, Vendor, QA &amp; Finance</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Sequential Work Order Enforcements (Trenching &rarr; Cable &rarr; Resurfacing)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Bangalore Municipal GIS Zones with PIN Code Precision</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 pt-6 border-t border-navy-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Backend Security: Spring Security 3.x &amp; JWT Rotation</span>
          <span>v1.0.0 Enterprise</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Branding */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-navy-900 border border-teal-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <span className="text-lg font-bold text-ink-primary">InfraPulse AI</span>
              <span className="block text-[10px] text-teal-600 font-semibold uppercase">Command Portal</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Sign In to Command Center</h2>
            <p className="text-xs text-ink-secondary mt-1">
              Enter your official credentials to access your designated infrastructure operational workspace.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Authentication Denied</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@infrapulse.gov.in"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-surface-border rounded-lg text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink-primary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery is managed by your departmental Platform Administrator.')}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-surface-border rounded-lg text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4 text-teal-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demonstration Selector */}
          <div className="pt-4 border-t border-surface-border">
            <p className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Test Role Selector</span>
              <span className="text-[10px] text-teal-600 font-normal">Auto-fills credentials</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@infrapulse.gov.in', 'Admin@InfraPulse2025!')}
                className="p-2 text-left bg-white hover:bg-slate-50 border border-surface-border rounded-lg transition-colors group"
              >
                <p className="text-[11px] font-semibold text-navy-900 group-hover:text-teal-600">Platform Admin</p>
                <p className="text-[10px] text-ink-muted">admin@infrapulse.gov.in</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('pm@infrapulse.gov.in', 'Password123!')}
                className="p-2 text-left bg-white hover:bg-slate-50 border border-surface-border rounded-lg transition-colors group"
              >
                <p className="text-[11px] font-semibold text-navy-900 group-hover:text-teal-600">Project Manager</p>
                <p className="text-[10px] text-ink-muted">pm@infrapulse.gov.in</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('vendor@infrapulse.gov.in', 'Password123!')}
                className="p-2 text-left bg-white hover:bg-slate-50 border border-surface-border rounded-lg transition-colors group"
              >
                <p className="text-[11px] font-semibold text-navy-900 group-hover:text-teal-600">Vendor / Contractor</p>
                <p className="text-[10px] text-ink-muted">vendor@infrapulse.gov.in</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('field@infrapulse.gov.in', 'Password123!')}
                className="p-2 text-left bg-white hover:bg-slate-50 border border-surface-border rounded-lg transition-colors group"
              >
                <p className="text-[11px] font-semibold text-navy-900 group-hover:text-teal-600">Field QA Engineer</p>
                <p className="text-[10px] text-ink-muted">field@infrapulse.gov.in</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('finance@infrapulse.gov.in', 'Password123!')}
                className="col-span-2 p-2 text-left bg-white hover:bg-slate-50 border border-surface-border rounded-lg transition-colors group"
              >
                <p className="text-[11px] font-semibold text-navy-900 group-hover:text-teal-600">Finance Officer</p>
                <p className="text-[10px] text-ink-muted">finance@infrapulse.gov.in</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
