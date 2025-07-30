/**
 * @fileoverview Tracking status indicator component.
 *
 * Displays the current status of facial tracking with visual indicators
 * and status messages for user feedback.
 */

import React from 'react';
import { TrackingStatus } from '@/types/tracking';

interface TrackingStatusProps {
  /** Current tracking status */
  status: TrackingStatus;
  /** Current confidence score */
  confidence: number;
  /** Number of faces detected */
  faceCount: number;
  /** Whether tracking is active */
  isTracking: boolean;
  /** Current error message if any */
  error: string | null;
}

export const TrackingStatusIndicator: React.FC<TrackingStatusProps> = ({
  status,
  confidence,
  faceCount,
  isTracking,
  error,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case TrackingStatus.DETECTED:
        return 'text-green-600 bg-green-100 border-green-200';
      case TrackingStatus.MULTIPLE_FACES:
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case TrackingStatus.NOT_DETECTED:
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case TrackingStatus.INITIALIZING:
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case TrackingStatus.ERROR:
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case TrackingStatus.DETECTED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case TrackingStatus.MULTIPLE_FACES:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case TrackingStatus.NOT_DETECTED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case TrackingStatus.INITIALIZING:
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case TrackingStatus.ERROR:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case TrackingStatus.DETECTED:
        return 'Face Detected';
      case TrackingStatus.MULTIPLE_FACES:
        return 'Multiple Faces';
      case TrackingStatus.NOT_DETECTED:
        return 'No Face Detected';
      case TrackingStatus.INITIALIZING:
        return 'Initializing...';
      case TrackingStatus.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {isTracking && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Confidence Bar */}
      {status === TrackingStatus.DETECTED && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Confidence</span>
            <span>{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Face Count */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Faces: {faceCount}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}; 