import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  PlayCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const norm = status.toUpperCase().replace(/\s+/g, '_');

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (norm) {
    case 'ACTIVE':
    case 'ON_TRACK':
    case 'APPROVED':
    case 'PASS':
    case 'COMPLIANT':
    case 'VERIFIED':
    case 'SATISFIED':
    case 'COMPLETED':
    case 'DISBURSED':
    case 'SUCCESS':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'IN_PROGRESS':
    case 'SUBMITTED':
    case 'PROCESSING':
    case 'ELIGIBLE':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = PlayCircle;
      break;

    case 'PENDING':
    case 'PENDING_INSPECTION':
    case 'REVIEW_REQUIRED':
    case 'AMBIGUOUS':
    case 'FLAGGED':
    case 'AT_RISK':
    case 'PROBATION':
    case 'WARNING':
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertTriangle;
      break;

    case 'BLOCKED':
    case 'FAIL':
    case 'FAILED':
    case 'REJECTED':
    case 'NON_COMPLIANT':
    case 'SUSPENDED':
    case 'CRITICAL':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = ShieldAlert;
      break;

    case 'AVAILABLE':
    case 'PLANNED':
    case 'LOCKED':
    case 'UNPAID':
    default:
      bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Clock;
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs font-medium';

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${bgClass} font-medium tracking-tight whitespace-nowrap`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{formatText(status)}</span>
    </span>
  );
};
