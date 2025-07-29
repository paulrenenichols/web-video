/**
 * @fileoverview Main application component for the video recording application.
 *
 * Provides the main layout structure and integrates all components.
 * Handles error boundaries and loading states.
 */

import React, { Suspense, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { Footer } from '@/components/layout/Footer';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { useCamera } from '@/hooks/useCamera';
import { useRecording } from '@/hooks/useRecording';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useTrackingStore } from '@/stores/tracking-store';
import { TrackingToggle } from '@/components/tracking/TrackingToggle';
import { TrackingStatusIndicator } from '@/components/tracking/TrackingStatus';
import { FaceTracking } from '@/components/tracking/FaceTracking';
import { TrackingVisualization } from '@/components/tracking/TrackingVisualization';
import { OverlaySystem } from '@/components/overlays/OverlaySystem';
import { GlassesOverlay } from '@/components/overlays/GlassesOverlay';
import { OverlayControls } from '@/components/overlays/OverlayControls';
import { useOverlayStore } from '@/stores/overlay-store';
import { VisualizationControls } from '@/components/controls/VisualizationControls';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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

  // Initialize MediaPipe for Step 1 testing
  const { initialize, isInitialized, processVideo } = useMediaPipe();

  // Get tracking state for Step 2 testing
  const trackingState = useTrackingStore();

  // Get overlay state for Step 6 testing
  const overlayState = useOverlayStore();

  // Unified visualization state
  const [isVisualizationEnabled, setIsVisualizationEnabled] =
    React.useState(false);
  const [showTracking, setShowTracking] = React.useState(false);
  const [showEnhancedTracking, setShowEnhancedTracking] = React.useState(false);
  const [showOverlays, setShowOverlays] = React.useState(false);
  const [showDebugControls, setShowDebugControls] = React.useState(false);

  // Separate state for debug controls overlay system (independent of overlay controls)
  const [debugOverlaySystemEnabled, setDebugOverlaySystemEnabled] =
    React.useState(false);

  // Initialize overlay system when component mounts
  React.useEffect(() => {
    // Enable overlay system by default for management
    useOverlayStore.getState().setEnabled(true);
  }, []);

  // Keep overlay system enabled for management, but control visibility through debug controls
  React.useEffect(() => {
    // Always keep overlay system enabled for management
    useOverlayStore.getState().setEnabled(true);
  }, []);

  // Unified visualization logic
  React.useEffect(() => {
    if (!isVisualizationEnabled) {
      setShowTracking(false);
      setShowEnhancedTracking(false);
      setShowOverlays(false);
    }
  }, [isVisualizationEnabled]);

  // Note: All visualization types can now be enabled independently
  // No forced dependencies between tracking, enhanced tracking, and overlays

  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleStartCamera = async (): Promise<void> => {
    await startCamera(selectedDeviceId || undefined);

    // Initialize MediaPipe when camera starts (for Step 1 testing)
    if (!isInitialized) {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize MediaPipe:', error);
      }
    }
  };

  // Handle MediaPipe video processing
  const handleVideoProcess = async (
    videoElement: HTMLVideoElement
  ): Promise<void> => {
    if (isActive) {
      await processVideo(videoElement);
    } else {
      console.log('⚠️ Skipping video processing - camera not active');
    }
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
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Camera Feed
              </h2>
              <div className="relative">
                <VideoPlayer
                  stream={stream}
                  className="aspect-video w-full"
                  onVideoProcess={handleVideoProcess}
                  ref={videoRef}
                />
                <FaceTracking
                  isVisible={showTracking && !showEnhancedTracking}
                  videoRef={videoRef}
                  className="aspect-video w-full"
                  stream={stream}
                />

                {/* Enhanced tracking visualization */}
                <TrackingVisualization
                  isVisible={showEnhancedTracking}
                  videoRef={videoRef}
                  className="aspect-video w-full"
                />

                {/* Overlay system */}
                <OverlaySystem
                  isVisible={debugOverlaySystemEnabled}
                  videoRef={videoRef}
                  className="aspect-video w-full"
                />

                {/* Glasses overlay */}
                <GlassesOverlay
                  isVisible={debugOverlaySystemEnabled}
                  videoRef={videoRef}
                  className="aspect-video w-full"
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

              {/* Camera Controls - Top */}
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
              />

              {/* Overlay Controls - Always Visible */}
              <OverlayControls className="w-full" />

              {/* Debug Controls - Collapsible */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowDebugControls(!showDebugControls)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Debug Controls
                  </h3>
                  <span className="text-gray-500">
                    {showDebugControls ? '▼' : '▶'}
                  </span>
                </button>

                {showDebugControls && (
                  <div className="mt-4 space-y-4">
                    {/* Tracking State */}
                    <div className="bg-white dark:bg-gray-700 rounded p-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Tracking State
                      </h4>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>
                          Status:{' '}
                          <span className="font-mono">
                            {trackingState.status}
                          </span>
                        </div>
                        <div>
                          Face Count:{' '}
                          <span className="font-mono">
                            {trackingState.faceCount}
                          </span>
                        </div>
                        <div>
                          Confidence:{' '}
                          <span className="font-mono">
                            {(trackingState.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          Tracking:{' '}
                          <span className="font-mono">
                            {trackingState.isTracking ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          Initialized:{' '}
                          <span className="font-mono">
                            {trackingState.isInitialized ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {trackingState.error && (
                          <div className="text-red-500">
                            Error: {trackingState.error}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visualization Controls */}
                    <VisualizationControls
                      isVisualizationEnabled={isVisualizationEnabled}
                      onToggleVisualization={setIsVisualizationEnabled}
                      showTracking={showTracking}
                      showEnhancedTracking={showEnhancedTracking}
                      showOverlays={debugOverlaySystemEnabled}
                      onToggleTracking={setShowTracking}
                      onToggleEnhancedTracking={setShowEnhancedTracking}
                      onToggleOverlays={enabled => {
                        setDebugOverlaySystemEnabled(enabled);
                      }}
                      isTrackingInitialized={trackingState.isInitialized}
                      isTracking={trackingState.isTracking}
                      trackingStatus={trackingState.status}
                      trackingConfidence={trackingState.confidence}
                      faceCount={trackingState.faceCount}
                      trackingError={trackingState.error}
                      activeOverlaysCount={overlayState.activeOverlays.length}
                      overlayError={overlayState.error}
                    />
                  </div>
                )}
              </div>
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
