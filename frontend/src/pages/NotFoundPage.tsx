import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';

export const NotFoundPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-ink-primary tracking-tight mb-2">
          Route Not Found (404)
        </h1>
        <p className="text-sm text-ink-secondary max-w-md mb-6">
          The requested infrastructure route does not exist or has been relocated to another municipal zone.
        </p>
        <NavLink
          to="/overview"
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </NavLink>
      </div>
    </PageContainer>
  );
};
