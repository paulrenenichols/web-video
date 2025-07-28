/**
 * @fileoverview Tracking visualization toggle component.
 *
 * Provides a button to show/hide facial tracking visualization
 * with proper state management and visual feedback.
 */

import React, { useState } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';

interface TrackingToggleProps {
  onToggle?: ((showVisualization: boolean) => void) | undefined;
  className?: string;
}

export const TrackingToggle: React.FC<TrackingToggleProps> = ({
  onToggle,
  className = '',
}) => {
  const [showVisualization, setShowVisualization] = useState(false);
  const { isDetected, confidence, error } = useTrackingStore();

  /**
   * @description Handle toggle button click
   */
  const handleToggle = (): void => {
    const newState = !showVisualization;
    setShowVisualization(newState);
    onToggle?.(newState);
  };

  /**
   * @description Get button status based on tracking state
   */
  const getButtonStatus = () => {
    if (error) return 'error';
    if (isDetected && confidence > 0.7) return 'detected';
    if (isDetected) return 'detected-low';
    return 'not-detected';
  };

  const buttonStatus = getButtonStatus();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={handleToggle}
        className={`
          btn flex items-center space-x-2 px-4 py-2 text-sm font-medium
          transition-all duration-200 transform hover:scale-105 active:scale-95
          ${
            showVisualization
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
          }
        `}
        disabled={!!error}
        title={showVisualization ? 'Hide face tracking' : 'Show face tracking'}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            buttonStatus === 'error'
              ? 'bg-red-500'
              : buttonStatus === 'detected'
                ? 'bg-green-500 animate-pulse'
                : buttonStatus === 'detected-low'
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
          }`}
        />
        <span>{showVisualization ? 'Hide' : 'Show'} Tracking</span>
      </button>

      {/* Status Indicator */}
      <div className="flex items-center space-x-2 text-sm">
        {buttonStatus === 'error' && (
          <span className="text-red-600 dark:text-red-400">Error</span>
        )}
        {buttonStatus === 'detected' && (
          <span className="text-green-600 dark:text-green-400">
            Detected ({Math.round(confidence * 100)}%)
          </span>
        )}
        {buttonStatus === 'detected-low' && (
          <span className="text-yellow-600 dark:text-yellow-400">
            Low Confidence ({Math.round(confidence * 100)}%)
          </span>
        )}
        {buttonStatus === 'not-detected' && (
          <span className="text-gray-500 dark:text-gray-400">No Face</span>
        )}
      </div>
    </div>
  );
};
