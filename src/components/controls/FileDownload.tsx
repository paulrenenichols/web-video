/**
 * @fileoverview File download component for recorded video files.
 *
 * Provides download interface with file information and download controls.
 */

import React from 'react';
import { FileService } from '@/services/file.service';
import type { RecordingResult } from '@/types/recording';

interface FileDownloadProps {
  recordingResult: RecordingResult | null;
  onDownload: () => void;
  onClear: () => void;
  className?: string;
}

export const FileDownload: React.FC<FileDownloadProps> = ({
  recordingResult,
  onDownload,
  onClear,
  className = '',
}) => {
  if (!recordingResult || !recordingResult.success) {
    return null;
  }

  const { filename, duration, size } = recordingResult;
  const formattedSize = FileService.formatFileSize(size);
  const formattedDuration = FileService.formatDuration(duration);

  return (
    <div
      className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
            Recording Complete
          </h3>

          <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
            <p>
              <strong>Filename:</strong> {filename}
            </p>
            <p>
              <strong>Duration:</strong> {formattedDuration}
            </p>
            <p>
              <strong>Size:</strong> {formattedSize}
            </p>
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={onDownload}
              className="btn btn-primary text-sm px-3 py-1"
            >
              Download Video
            </button>

            <button
              onClick={onClear}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
