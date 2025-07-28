/**
 * @fileoverview Recording timer component for elapsed time display.
 *
 * Shows recording duration in a human-readable format with real-time updates.
 */

import React from 'react';
import { FileService } from '@/services/file.service';

interface RecordingTimerProps {
  elapsedTime: number;
  isRecording: boolean;
  className?: string;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  elapsedTime,
  isRecording,
  className = '',
}) => {
  const formattedTime = FileService.formatDuration(elapsedTime);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isRecording && (
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      <span className="font-mono text-lg font-semibold text-gray-700 dark:text-gray-300">
        {formattedTime}
      </span>
      {isRecording && (
        <span className="text-sm text-red-500 font-medium">REC</span>
      )}
    </div>
  );
};
