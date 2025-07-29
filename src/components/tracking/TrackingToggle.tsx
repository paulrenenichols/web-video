/**
 * @fileoverview Tracking toggle component for showing/hiding face tracking visualization.
 *
 * Provides a simple toggle button to control the visibility of face tracking
 * visualization elements like bounding boxes and landmarks.
 */

import React from 'react';

interface TrackingToggleProps {
  /** Whether tracking visualization is currently shown */
  isVisible: boolean;
  /** Whether tracking is currently active */
  isTracking: boolean;
  /** Callback when toggle state changes */
  onToggle: (visible: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

export const TrackingToggle: React.FC<TrackingToggleProps> = ({
  isVisible,
  isTracking,
  onToggle,
  disabled = false,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onToggle(!isVisible);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          isVisible
            ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
        }
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        }
        dark:bg-gray-800 dark:border-gray-700
      `}
      title={isVisible ? 'Hide face tracking' : 'Show face tracking'}
    >
      <div className="relative">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {isTracking && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      <span>
        {isVisible ? 'Hide Tracking' : 'Show Tracking'}
      </span>
    </button>
  );
}; 