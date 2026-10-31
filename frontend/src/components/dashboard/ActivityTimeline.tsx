import { 
  AlertTriangle, 
  ShieldAlert, 
  UploadCloud, 
  UserCheck, 
  CreditCard 
} from 'lucide-react';

export interface ActivityTimelineItem {
  id: string;
  time: string;
  title: string;
  desc: string;
  type: 'ALLOCATION' | 'EVIDENCE' | 'INSPECTION' | 'CONFLICT' | 'PAYMENT';
}

export const mockRecentActivities: ActivityTimelineItem[] = [
  {
    id: 'ACT-01',
    time: '12m ago',
    title: 'Work Package Blocked: Dependency Conflict',
    desc: 'Road Resurfacing in Zone 560001-B blocked pending Trenching verification.',
    type: 'CONFLICT',
  },
  {
    id: 'ACT-02',
    time: '45m ago',
    title: 'Photographic Evidence Submitted',
    desc: 'Apex Infra uploaded 4 trench depth inspection photos in Zone 560001-A.',
    type: 'EVIDENCE',
  },
  {
    id: 'ACT-03',
    time: '2h ago',
    title: 'AI Vision Flagged for Human Review',
    desc: 'Granular bedding anomaly detected on Sector 4B excavation contour.',
    type: 'INSPECTION',
  },
  {
    id: 'ACT-04',
    time: '4h ago',
    title: 'Milestone Disbursed (₹ 42,00,000)',
    desc: 'Yelahanka road reinstatement milestone released to Apex Infra Utilities.',
    type: 'PAYMENT',
  },
  {
    id: 'ACT-05',
    time: '1d ago',
    title: 'New Vendor Allocation Issued',
    desc: 'TransGrid Power Infrastructure assigned 11kV feeder ducting in Koramangala.',
    type: 'ALLOCATION',
  },
];

export const ActivityTimeline: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'CONFLICT':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'EVIDENCE':
        return <UploadCloud className="w-4 h-4 text-blue-600" />;
      case 'INSPECTION':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'ALLOCATION':
      default:
        return <UserCheck className="w-4 h-4 text-teal-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'CONFLICT':
        return 'bg-rose-50 border-rose-200';
      case 'EVIDENCE':
        return 'bg-blue-50 border-blue-200';
      case 'INSPECTION':
        return 'bg-amber-50 border-amber-200';
      case 'PAYMENT':
        return 'bg-emerald-50 border-emerald-200';
      case 'ALLOCATION':
      default:
        return 'bg-teal-50 border-teal-200';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
        <div>
          <h3 className="font-bold text-sm text-ink-primary">
            Live Operational Activity
          </h3>
          <p className="text-xs text-ink-secondary">
            Continuous sequence tracking and audit triggers
          </p>
        </div>
        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          Sample Log
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {mockRecentActivities.map((act) => (
          <div key={act.id} className="relative group">
            <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center bg-white ${getBg(act.type)}`}>
              {getIcon(act.type)}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-ink-primary group-hover:text-teal-600 transition-colors">
                  {act.title}
                </h4>
                <span className="text-[10px] text-ink-muted">
                  {act.time}
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                {act.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
