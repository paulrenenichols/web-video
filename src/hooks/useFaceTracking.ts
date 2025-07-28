/**
 * @fileoverview React hook for MediaPipe facial tracking integration.
 *
 * Manages MediaPipe Face Detection initialization, real-time tracking,
 * performance monitoring, and integration with the tracking store.
 */

import { useCallback, useEffect, useRef } from 'react';
import { TrackingService } from '@/services/tracking.service';
import { useTrackingStore } from '@/stores/tracking-store';
import type { TrackingConfig, FaceDetectionResult } from '@/types/tracking';

export const useFaceTracking = () => {
  const trackingServiceRef = useRef<TrackingService | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const {
    isInitialized,
    isTracking,
    isDetected,
    landmarks,
    confidence,
    error,
    performance,
    setInitialized,
    setTracking,
    setDetected,
    setLandmarks,
    setConfidence,
    setError,
    setPerformance,
  } = useTrackingStore();

  /**
   * @description Initialize MediaPipe tracking service
   * @param config - Optional tracking configuration
   */
  const initializeTracking = useCallback(
    async (config: Partial<TrackingConfig> = {}): Promise<void> => {
      try {
        setError(null);
        setInitialized(false);

        // Create tracking service instance
        trackingServiceRef.current = new TrackingService();

        // Initialize with configuration
        await trackingServiceRef.current.initialize(config);

        setInitialized(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to initialize tracking';
        setError(errorMessage);
        console.error('Tracking initialization failed:', error);
      }
    },
    [setError, setInitialized]
  );

  /**
   * @description Start tracking on a video element
   * @param videoElement - HTML video element to track
   * @param canvasElement - Optional canvas for visualization
   */
  const startTracking = useCallback(
    (
      videoElement: HTMLVideoElement,
      canvasElement?: HTMLCanvasElement
    ): void => {
      if (!trackingServiceRef.current || !isInitialized) {
        setError('Tracking service not initialized');
        return;
      }

      try {
        videoElementRef.current = videoElement;
        canvasElementRef.current = canvasElement || null;

        // Start tracking with result callback
        trackingServiceRef.current.startTracking(
          videoElement,
          (result: FaceDetectionResult) => {
            handleTrackingResult(result);
          }
        );

        setTracking(true);
        setError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start tracking';
        setError(errorMessage);
        console.error('Failed to start tracking:', error);
      }
    },
    [isInitialized, setError, setTracking]
  );

  /**
   * @description Stop tracking and clean up resources
   */
  const stopTracking = useCallback((): void => {
    if (trackingServiceRef.current) {
      trackingServiceRef.current.stopTracking();
    }

    setTracking(false);
    setDetected(false);
    setLandmarks(null);
    setConfidence(0);

    videoElementRef.current = null;
    canvasElementRef.current = null;
  }, [setTracking, setDetected, setLandmarks, setConfidence]);

  /**
   * @description Handle tracking results from MediaPipe
   * @param result - Face detection result
   */
  const handleTrackingResult = useCallback(
    (result: FaceDetectionResult): void => {
      if (result.success && result.landmarks) {
        setDetected(true);
        setLandmarks(result.landmarks);
        setConfidence(result.landmarks.faceInViewConfidence);
        setError(null);
      } else {
        setDetected(false);
        setLandmarks(null);
        setConfidence(0);

        if (result.error) {
          setError(result.error);
        }
      }

      // Update performance metrics
      if (trackingServiceRef.current) {
        const metrics = trackingServiceRef.current.getPerformanceMetrics();
        setPerformance({
          fps: metrics.fps,
          latency: metrics.latency,
          accuracy: metrics.accuracy,
        });
      }
    },
    [setDetected, setLandmarks, setConfidence, setError, setPerformance]
  );

  /**
   * @description Update tracking configuration
   * @param config - New tracking configuration
   */
  const updateConfig = useCallback(
    async (config: Partial<TrackingConfig>): Promise<void> => {
      if (!trackingServiceRef.current) {
        return;
      }

      try {
        // Stop current tracking
        stopTracking();

        // Reinitialize with new config
        await initializeTracking(config);

        // Restart tracking if video element is available
        if (videoElementRef.current) {
          startTracking(
            videoElementRef.current,
            canvasElementRef.current || undefined
          );
        }
      } catch (error) {
        console.error('Failed to update tracking config:', error);
      }
    },
    [stopTracking, initializeTracking, startTracking]
  );

  /**
   * @description Check if tracking performance is acceptable
   */
  const isPerformanceAcceptable = useCallback((): boolean => {
    return trackingServiceRef.current?.isPerformanceAcceptable() || false;
  }, []);

  /**
   * @description Get current performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return (
      trackingServiceRef.current?.getPerformanceMetrics() || {
        fps: 0,
        latency: 0,
        accuracy: 0,
        frameCount: 0,
        lastFrameTime: 0,
      }
    );
  }, []);

  /**
   * @description Clean up resources on unmount
   */
  useEffect(() => {
    return () => {
      if (trackingServiceRef.current) {
        trackingServiceRef.current.cleanup();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isTracking,
    isDetected,
    landmarks,
    confidence,
    error,
    performance,

    // Actions
    initializeTracking,
    startTracking,
    stopTracking,
    updateConfig,
    isPerformanceAcceptable,
    getPerformanceMetrics,
  };
};
