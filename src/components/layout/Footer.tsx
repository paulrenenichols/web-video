/**
 * @fileoverview Footer component for the application layout.
 *
 * Provides footer information and links for the video recording application.
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Web Video Recorder. Built with React and TypeScript.
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Development Phase 1
          </div>
        </div>
      </div>
    </footer>
  );
};
