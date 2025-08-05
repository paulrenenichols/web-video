/**
 * @fileoverview Enhanced control panel component for camera, audio, and recording controls.
 *
 * Provides comprehensive controls for camera management, audio recording, and video recording.
 * Integrates recording functionality with camera and audio controls.
 */

import React from 'react';
import { RecordButton } from './RecordButton';
import { RecordingTimer } from './RecordingTimer';
import { FileDownload } from './FileDownload';
import { useAudio, useAudioLevels } from '@/hooks/useAudio';
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
  // Audio hook
  const [audioState, audioActions] = useAudio({
    autoRequestAccess: false,
    autoStartMonitoring: false,
  });
  
  const audioLevels = useAudioLevels();
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg animate-fade-in">
      <div className="space-y-6">
        {/* Camera and Audio Controls */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>📹🎤</span>
            <span>Camera & Audio Controls</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camera Control */}
            <button
              onClick={isActive ? onStopCamera : onStartCamera}
              disabled={isLoading}
              className="btn btn-primary transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
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

            {/* Microphone Control */}
            <button
              onClick={audioState.state.state === 'READY' ? audioActions.cleanup : audioActions.requestMicrophoneAccess}
              disabled={audioState.state.state === 'INITIALIZING'}
              className={`btn transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                audioState.state.state === 'READY' 
                  ? 'btn-secondary' 
                  : audioState.state.state === 'INITIALIZING'
                  ? 'btn-disabled'
                  : 'btn-primary'
              }`}
            >
              {audioState.state.state === 'INITIALIZING' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Requesting...</span>
                </div>
              ) : audioState.state.state === 'READY' ? (
                <span className="flex items-center space-x-2">
                  <span>🔇</span>
                  <span>Disable Mic</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🎤</span>
                  <span>Enable Mic</span>
                </span>
              )}
            </button>
          </div>

          {/* Audio Level Meter */}
          {audioLevels && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audio Level</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(audioLevels.current * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-100 ${
                    audioLevels.isClipping 
                      ? 'bg-red-500' 
                      : audioLevels.current > 0.9 
                      ? 'bg-yellow-500' 
                      : audioLevels.current > 0.6 
                      ? 'bg-green-500' 
                      : audioLevels.current > 0.3 
                      ? 'bg-blue-500' 
                      : audioLevels.current > 0.1 
                      ? 'bg-gray-500' 
                      : 'bg-gray-300'
                  }`}
                  style={{ width: `${Math.min(audioLevels.current * 100, 100)}%` }}
                />
              </div>
              {audioLevels.isClipping && (
                <p className="text-xs text-red-600 dark:text-red-400">⚠️ Audio clipping detected</p>
              )}
            </div>
          )}

          {/* Audio Error Display */}
          {audioState.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">{audioState.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        {isActive && audioState.state.state === 'READY' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>🎬</span>
              <span>Recording Controls (Video + Audio)</span>
            </h3>

            <div className="space-y-4">
              <RecordButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
                disabled={!isActive || audioState.state.state !== 'READY'}
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

        {/* Recording Not Ready Message */}
        {isActive && audioState.state.state !== 'READY' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {audioState.state.state === 'INITIALIZING' 
                    ? 'Requesting microphone access...' 
                    : 'Microphone access required for audio recording'
                  }
                </p>
              </div>
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
          <p>Audio Status: {audioState.state.state}</p>
          <p>Available Devices: {devices.length}</p>
        </div>
      </div>
    </div>
  );
};
