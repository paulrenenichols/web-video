/**
 * @fileoverview Audio-video synchronization monitor component.
 *
 * Displays real-time synchronization status, drift, and latency
 * information during recording to ensure audio and video stay in sync.
 */

import React from 'react';
import { useRecordingSync } from '@/hooks/useCompositeRecording';

/**
 * Sync monitor props
 */
export interface SyncMonitorProps {
  /** Whether to show the monitor */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sync monitor component
 */
export const SyncMonitor: React.FC<SyncMonitorProps> = ({
  visible = true,
  className = '',
}) => {
  const syncData = useRecordingSync();

  if (!visible || !syncData) {
    return null;
  }

  const { audioTimestamp, videoTimestamp, drift, latency, isInSync } = syncData;

  // Determine sync status color and icon
  const getSyncStatusInfo = () => {
    if (isInSync) {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: '✅',
        text: 'In Sync',
      };
    } else if (Math.abs(drift) < 100) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: '⚠️',
        text: 'Minor Drift',
      };
    } else {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: '❌',
        text: 'Sync Issue',
      };
    }
  };

  const statusInfo = getSyncStatusInfo();

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`p-4 rounded-lg shadow-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} min-w-64`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{statusInfo.icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sync Monitor
            </h3>
          </div>
          <div className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Sync Data */}
        <div className="space-y-2 text-sm">
          {/* Drift */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Drift:</span>
            <span className={`font-mono font-medium ${
              Math.abs(drift) < 10 ? 'text-green-600 dark:text-green-400' :
              Math.abs(drift) < 50 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {drift > 0 ? '+' : ''}{drift.toFixed(1)}ms
            </span>
          </div>

          {/* Latency */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Latency:</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {latency.toFixed(1)}ms
            </span>
          </div>

          {/* Timestamps */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Audio:</span>
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {audioTimestamp.toFixed(0)}ms
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Video:</span>
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {videoTimestamp.toFixed(0)}ms
            </span>
          </div>
        </div>

        {/* Sync Quality Indicator */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sync Quality:</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3].map((level) => {
                const isActive = Math.abs(drift) < (level + 1) * 25;
                return (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full ${
                      isActive
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {!isInSync && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <div className="font-medium mb-1">Recommendations:</div>
              <ul className="space-y-1">
                {Math.abs(drift) > 100 && (
                  <li>• Check system performance</li>
                )}
                {Math.abs(drift) > 50 && (
                  <li>• Close other applications</li>
                )}
                <li>• Ensure stable internet connection</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact sync indicator for use in other components
 */
export const SyncIndicator: React.FC<{ syncData: any }> = ({ syncData }) => {
  if (!syncData) return null;

  const { drift, isInSync } = syncData;
  const isMinorDrift = !isInSync && Math.abs(drift) < 100;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        isInSync ? 'bg-green-500' :
        isMinorDrift ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
      <span className="text-xs text-gray-600 dark:text-gray-300">
        {isInSync ? 'Sync' : isMinorDrift ? 'Minor Drift' : 'Sync Issue'}
      </span>
    </div>
  );
}; 