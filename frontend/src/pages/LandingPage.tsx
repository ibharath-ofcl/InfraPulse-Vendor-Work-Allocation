import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Layers, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { healthService } from '../services/api';
import { HealthStatus } from '../types';

export const LandingPage: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<HealthStatus>({ status: 'PENDING' });
  const [aiHealth, setAiHealth] = useState<HealthStatus>({ status: 'PENDING' });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    const [bRes, aRes] = await Promise.all([
      healthService.checkBackendHealth(),
      healthService.checkAiServiceHealth(),
    ]);
    setBackendHealth(bRes);
    setAiHealth(aRes);
    setLastChecked(new Date());
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-400 p-[1px] shadow-glow">
              <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight">
              InfraPulse <span className="text-brand-400 font-extrabold">AI</span>
            </span>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Foundation Stage:</span>
              <span className="text-brand-400 font-semibold">Stage 01 Complete</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 pt-16 pb-20 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Intelligent Infrastructure Platform Foundation</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="block text-slate-100">InfraPulse AI</span>
            <span className="block text-2xl md:text-3xl font-medium text-slate-400 mt-2">
              Intelligent Infrastructure Lifecycle &amp; Quality Assurance Platform
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            A unified, multi-vendor coordination engine bridging PIN-code allocation, 
            sequential dependency blocking, and automated computer vision quality inspection.
          </p>
        </div>

        {/* Live Service Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full mb-16">
          {/* Spring Boot Backend */}
          <div className="glass-card glass-card-hover rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">Spring Boot Backend</h3>
                  <p className="text-xs text-slate-400">Java 21 • Port 8080</p>
                </div>
              </div>
              {backendHealth.status === 'UP' ? (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ONLINE</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  <span>{backendHealth.status}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>Endpoint:</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">GET /api/health</code>
            </div>
          </div>

          {/* AI Vision Service */}
          <div className="glass-card glass-card-hover rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">AI Vision Service</h3>
                  <p className="text-xs text-slate-400">Python 3.11 • Port 8000</p>
                </div>
              </div>
              {aiHealth.status === 'UP' ? (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ONLINE</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  <span>{aiHealth.status}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>Endpoint:</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">GET /health</code>
            </div>
          </div>

          {/* PostgreSQL & PostGIS */}
          <div className="glass-card glass-card-hover rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">PostGIS Database</h3>
                  <p className="text-xs text-slate-400">PostgreSQL 16 • Flyway</p>
                </div>
              </div>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>CONFIGURED</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>Database:</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">infrapulse_db</code>
            </div>
          </div>
        </div>

        {/* Core Architectural Pillars */}
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-6">
            Target Platform Architecture Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-brand-400 text-sm font-semibold mb-2">
                <MapPin className="w-4 h-4" />
                <span>PIN-Code Work Allocation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized spatial partitioning ensuring non-conflicting multi-vendor coordination in overlapping zones.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Dependency Engine</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces strict sequencing: blocks road resurfacing until preceding trenching milestones receive certified approval.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-purple-400 text-sm font-semibold mb-2">
                <Cpu className="w-4 h-4" />
                <span>AI Vision Verification</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Photographic evidence validation with automated computer vision inspection and human review escalation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>InfraPulse AI • Architecture Foundation Stage 01 • {lastChecked.toLocaleTimeString()}</p>
      </footer>
    </div>
  );
};
