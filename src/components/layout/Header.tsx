/**
 * @fileoverview Header component for the application layout.
 *
 * Provides the main navigation and branding for the video recording application.
 */

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
        <div className="lg:col-span-2 flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Web Video Recorder
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Phase 3: Enhancement
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
