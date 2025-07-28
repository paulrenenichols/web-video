/**
 * @fileoverview Main application component for the video recording application.
 *
 * Provides the main layout structure and integrates all components.
 * Handles error boundaries and loading states.
 */

import React, { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { Footer } from '@/components/layout/Footer';
import { FaceTracking } from '@/components/tracking/FaceTracking';
import { OverlaySystem } from '@/components/overlays/OverlaySystem';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { useCamera } from '@/hooks/useCamera';
import { useRecording } from '@/hooks/useRecording';
import { useTrackingStore } from '@/stores/tracking-store';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useState, useRef } from 'react';

const VideoRecorderApp: React.FC = () => {
  const {
    stream,
    isActive,
    isLoading,
    devices,
    selectedDeviceId,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    clearError,
  } = useCamera();

  const {
    isRecording,
    isProcessing,
    elapsedTime,
    recordingBlob,
    error: recordingError,
    startRecording,
    stopRecording,
    downloadRecording,
    clearError: clearRecordingError,
    reset: resetRecording,
  } = useRecording();

  const { landmarks } = useTrackingStore();
  const [showTracking, setShowTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartCamera = async (): Promise<void> => {
    await startCamera(selectedDeviceId || undefined);
  };

  const handleStopCamera = (): void => {
    stopCamera();
  };

  const handleSwitchCamera = async (deviceId: string): Promise<void> => {
    await switchCamera(deviceId);
  };

  const handleStartRecording = async (): Promise<void> => {
    if (stream) {
      await startRecording(stream);
    }
  };

  const handleStopRecording = async (): Promise<void> => {
    await stopRecording();
  };

  const handleDownloadRecording = async (): Promise<void> => {
    await downloadRecording();
  };

  const handleClearRecording = (): void => {
    resetRecording();
  };

  const currentError = error || recordingError;
  const handleClearError = (): void => {
    clearError();
    clearRecordingError();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <Main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player with Face Tracking */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Camera Feed with Face Tracking
              </h2>
              <div className="relative">
                <FaceTracking
                  stream={stream}
                  showVisualization={showTracking}
                  onTrackingUpdate={() => {
                    // Tracking updates are handled by the store
                  }}
                  onVideoRef={videoElement => {
                    videoRef.current = videoElement;
                  }}
                  className="aspect-video w-full"
                />

                {/* Overlay System */}
                <OverlaySystem
                  landmarks={landmarks}
                  videoElement={videoRef.current}
                  className="absolute inset-0"
                />
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Controls
              </h2>
              <ControlPanel
                isActive={isActive}
                isLoading={isLoading}
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onStartCamera={handleStartCamera}
                onStopCamera={handleStopCamera}
                onSwitchCamera={handleSwitchCamera}
                error={currentError}
                onClearError={handleClearError}
                isRecording={isRecording}
                isProcessing={isProcessing}
                elapsedTime={elapsedTime}
                recordingResult={
                  recordingBlob
                    ? {
                        success: true,
                        blob: recordingBlob,
                        filename: `recording-${Date.now()}.webm`,
                        duration: elapsedTime,
                        size: recordingBlob.size,
                      }
                    : null
                }
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onDownloadRecording={handleDownloadRecording}
                onClearRecording={handleClearRecording}
                showTracking={showTracking}
                onToggleTracking={setShowTracking}
              />
            </div>
          </div>
        </div>
      </Main>

      <Footer />
    </div>
  );
};

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <VideoRecorderApp />
      </Suspense>
    </ErrorBoundary>
  );
};
