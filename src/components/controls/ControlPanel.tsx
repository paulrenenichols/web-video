/**
 * @fileoverview Enhanced control panel component for camera and recording controls.
 *
 * Provides comprehensive controls for camera management and video recording.
 * Integrates recording functionality with camera controls.
 */

import React from 'react';
import { RecordButton } from './RecordButton';
import { RecordingTimer } from './RecordingTimer';
import { FileDownload } from './FileDownload';
import type { CameraDevice } from '@/types/video';
import type { RecordingResult } from '@/types/recording';

interface ControlPanelProps {
  // Camera controls
  isActive: boolean;
  isLoading: boolean;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: (deviceId: string) => void;
  error: string | null;
  onClearError: () => void;

  // Recording controls
  isRecording: boolean;
  isProcessing: boolean;
  elapsedTime: number;
  recordingResult: RecordingResult | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownloadRecording: () => void;
  onClearRecording: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  // Camera props
  isActive,
  isLoading,
  devices,
  selectedDeviceId,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  error,
  onClearError,

  // Recording props
  isRecording,
  isProcessing,
  elapsedTime,
  recordingResult,
  onStartRecording,
  onStopRecording,
  onDownloadRecording,
  onClearRecording,
}) => {
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg animate-fade-in">
      <div className="space-y-6">
        {/* Camera Controls */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>📹</span>
            <span>Camera Controls</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={isActive ? onStopCamera : onStartCamera}
              disabled={isLoading}
              className="btn btn-primary flex-1 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Initializing...</span>
                </div>
              ) : isActive ? (
                <span className="flex items-center space-x-2">
                  <span>⏹️</span>
                  <span>Stop Camera</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>▶️</span>
                  <span>Start Camera</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Recording Controls */}
        {isActive && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>🎬</span>
              <span>Recording Controls</span>
            </h3>

            <div className="space-y-4">
              <RecordButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
                disabled={!isActive}
                className="w-full"
              />

              {isRecording && (
                <RecordingTimer
                  elapsedTime={elapsedTime}
                  isRecording={isRecording}
                  className="justify-center"
                />
              )}
            </div>
          </div>
        )}

        {/* File Download */}
        {recordingResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recording Results
            </h3>

            <FileDownload
              recordingResult={recordingResult}
              onDownload={onDownloadRecording}
              onClear={onClearRecording}
            />
          </div>
        )}

        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Camera Device
            </label>
            <select
              value={selectedDeviceId || ''}
              onChange={e => onSwitchCamera(e.target.value)}
              disabled={isLoading}
              className="input"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
              <button
                onClick={onClearError}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Camera Status: {isActive ? 'Active' : 'Inactive'}</p>
          <p>Available Devices: {devices.length}</p>
        </div>
      </div>
    </div>
  );
};
