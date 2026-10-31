import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { UserRole } from '../types';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Network,
  MapPin,
  Cpu
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

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
      case 'VENDOR': return '/my-work';
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
    <div className="min-h-screen flex bg-[#F3F5F6] text-[#202B36]">
      {/* Left Column: Infrastructure Command Visual & Brand Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#10243A] flex-col justify-between p-12 relative overflow-hidden text-white border-r border-[#24445F]">
        {/* Engineering Blueprint Grid Overlay */}
        <div className="absolute inset-0 blueprint-grid-dark opacity-30 pointer-events-none" />

        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#13A89E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand Logo */}
        <div className="relative z-10">
          <BrandLogo size="lg" showText={true} showTagline={true} theme="dark" />
        </div>

        {/* Middle: Civil Infrastructure & AI Vision Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13A89E]/15 border border-[#13A89E]/30 text-[#13A89E] text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-[#13A89E]" />
            <span>AI-Driven Civil Infrastructure Governance</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Infrastructure. <br />
            <span className="text-[#F5A623]">Connected Execution.</span> <br />
            <span className="text-[#13A89E]">Verified Quality.</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Centralized PIN-code based contractor work allocation, sequential dependency conflict prevention, 
            geotagged AI vision evidence verification, and cryptographic milestone authorization.
          </p>

          {/* Infrastructure System Features */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded bg-[#24445F] border border-[#13A89E]/30 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#13A89E]" />
              </div>
              <span>Geographic Work-Zone &amp; PIN-Code Allocation Ledger</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded bg-[#24445F] border border-[#F5A623]/30 flex items-center justify-center shrink-0">
                <Network className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <span>Sequential DAG Dependency Clearance (Trenching &rarr; Cable &rarr; Resurfacing)</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded bg-[#24445F] border border-[#219653]/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#219653]" />
              </div>
              <span>Computer Vision Excavation Quality &amp; Barricade Detection</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 pt-6 border-t border-[#24445F] flex items-center justify-between text-[11px] text-[#718096]">
          <span>InfraPulse AI Enterprise Platform</span>
          <span className="font-mono text-[#F5A623]">v1.0.0 Release</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative blueprint-grid">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Branding */}
          <div className="lg:hidden flex items-center justify-center mb-4">
            <BrandLogo size="md" showText={true} showTagline={true} theme="light" />
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DCE3E8] shadow-card">
            <div>
              <h2 className="text-xl font-bold text-[#10243A] tracking-tight">Sign In to Command Portal</h2>
              <p className="text-xs text-[#718096] mt-1">
                Enter your official departmental or contractor credentials to access assigned infrastructure operations.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-lg bg-[#FFEBEE] border border-[#D64545]/30 text-[#D64545] text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Denied</p>
                  <p className="mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@infrapulse.gov.in"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F3F5F6] border border-[#DCE3E8] rounded-lg text-[#202B36] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#13A89E]/20 focus:border-[#13A89E] transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password recovery is managed by your departmental Platform Administrator.')}
                    className="text-[11px] text-[#13A89E] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#F3F5F6] border border-[#DCE3E8] rounded-lg text-[#202B36] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#13A89E]/20 focus:border-[#13A89E] transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#202B36]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#10243A] hover:bg-[#24445F] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 touch-target border border-[#24445F]"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Role Selector */}
            <div className="pt-5 mt-5 border-t border-[#DCE3E8]">
              <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Quick Role Demo Selector</span>
                <span className="text-[10px] text-[#13A89E] font-normal">Auto-fills credentials</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@infrapulse.gov.in', 'Admin@InfraPulse2025!')}
                  className="p-2 text-left bg-[#F3F5F6] hover:bg-[#EAEFF2] border border-[#DCE3E8] rounded-lg transition-colors group"
                >
                  <p className="text-[11px] font-semibold text-[#10243A] group-hover:text-[#13A89E]">Platform Admin</p>
                  <p className="text-[10px] text-[#718096] truncate">admin@infrapulse.gov.in</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('pm@infrapulse.gov.in', 'Password123!')}
                  className="p-2 text-left bg-[#F3F5F6] hover:bg-[#EAEFF2] border border-[#DCE3E8] rounded-lg transition-colors group"
                >
                  <p className="text-[11px] font-semibold text-[#10243A] group-hover:text-[#13A89E]">Project Manager</p>
                  <p className="text-[10px] text-[#718096] truncate">pm@infrapulse.gov.in</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('vendor@infrapulse.gov.in', 'Password123!')}
                  className="p-2 text-left bg-[#F3F5F6] hover:bg-[#EAEFF2] border border-[#DCE3E8] rounded-lg transition-colors group"
                >
                  <p className="text-[11px] font-semibold text-[#10243A] group-hover:text-[#F5A623]">Vendor Contractor</p>
                  <p className="text-[10px] text-[#718096] truncate">vendor@infrapulse.gov.in</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('field@infrapulse.gov.in', 'Password123!')}
                  className="p-2 text-left bg-[#F3F5F6] hover:bg-[#EAEFF2] border border-[#DCE3E8] rounded-lg transition-colors group"
                >
                  <p className="text-[11px] font-semibold text-[#10243A] group-hover:text-[#13A89E]">Field QA Engineer</p>
                  <p className="text-[10px] text-[#718096] truncate">field@infrapulse.gov.in</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('finance@infrapulse.gov.in', 'Password123!')}
                  className="col-span-2 p-2 text-left bg-[#F3F5F6] hover:bg-[#EAEFF2] border border-[#DCE3E8] rounded-lg transition-colors group"
                >
                  <p className="text-[11px] font-semibold text-[#10243A] group-hover:text-[#219653]">Finance Officer</p>
                  <p className="text-[10px] text-[#718096] truncate">finance@infrapulse.gov.in</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
