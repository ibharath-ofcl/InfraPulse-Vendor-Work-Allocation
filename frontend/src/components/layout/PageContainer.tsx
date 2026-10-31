import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
};
