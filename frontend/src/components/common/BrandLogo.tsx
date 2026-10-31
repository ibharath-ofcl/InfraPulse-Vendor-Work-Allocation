import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  theme = 'dark',
  className = '',
}) => {
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const titleSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Infrastructure Vector Shield & Pulse Emblem */}
      <div className={`${iconDimensions} relative shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        >
          {/* Outer Work-Zone Hexagonal Shield Perimeter */}
          <polygon
            points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
            fill={isDark ? '#10243A' : '#FFFFFF'}
            stroke={isDark ? '#24445F' : '#DCE3E8'}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Blueprint Engineering Grid Watermark */}
          <line x1="5" y1="24" x2="43" y2="24" stroke={isDark ? '#24445F' : '#E2E8F0'} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="24" y1="3" x2="24" y2="45" stroke={isDark ? '#24445F' : '#E2E8F0'} strokeWidth="1" strokeDasharray="2 2" />

          {/* Underground Utility & Road Arterial Network */}
          <path
            d="M12 30 L24 24 L36 30"
            stroke="#13A89E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 10 L24 24"
            stroke="#F5A623"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Connected Work-Zone Waypoint Nodes */}
          <circle cx="12" cy="30" r="3" fill="#13A89E" />
          <circle cx="36" cy="30" r="3" fill="#13A89E" />
          <circle cx="24" cy="10" r="2.5" fill="#F5A623" />

          {/* Central AI Pulse Beacon (Construction Amber Center with Teal Ring) */}
          <circle cx="24" cy="24" r="5.5" fill="#F5A623" />
          <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
          <circle cx="24" cy="24" r="7.5" stroke="#13A89E" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      </div>

      {/* Typography Brand Treatment */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${titleSizes} ${
                isDark ? 'text-white' : 'text-[#10243A]'
              }`}
            >
              InfraPulse
            </span>
            <span className="font-bold text-[#F5A623] px-1 py-0.2 rounded text-[10px] bg-amber-500/10 border border-amber-500/30 font-mono">
              AI
            </span>
          </div>
          {showTagline && (
            <span
              className={`text-[10px] font-medium tracking-wide uppercase mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-[#718096]'
              }`}
            >
              Intelligent Infrastructure Operations
            </span>
          )}
        </div>
      )}
    </div>
  );
};
