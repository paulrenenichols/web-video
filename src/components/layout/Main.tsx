/**
 * @fileoverview Main content component for the application layout.
 *
 * Provides the main content area with proper spacing and responsive design.
 */

import React from 'react';

interface MainProps {
  children: React.ReactNode;
  className?: string;
}

export const Main: React.FC<MainProps> = ({ children, className = '' }) => {
  return (
    <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </main>
  );
};
