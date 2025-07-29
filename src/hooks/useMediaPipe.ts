/**
 * @fileoverview MediaPipe hook for facial tracking integration.
 *
 * Provides a React hook interface for MediaPipe services.
 * Handles initialization, processing, and cleanup of MediaPipe resources.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { MediaPipeService } from '@/services/mediapipe.service';
import { MediaPipeOptions, FaceDetection, FacialLandmarks } from '@/types/tracking';
import { useTrackingStore } from '@/stores/tracking-store';

/**
 * MediaPipe hook for facial tracking
 */
export const useMediaPipe = (options: MediaPipeOptions = {}) => {
  const mediaPipeRef = useRef<MediaPipeService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get tracking store actions
  const {
    updateFaceDetection,
    updateFacialLandmarks,
    setInitialized,
    setError,
    setStatus,
  } = useTrackingStore();

  /**
   * Initialize MediaPipe service
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (isInitialized) {
      console.log('MediaPipe already initialized');
      return;
    }

    try {
      console.log('Initializing MediaPipe hook...');
      
      mediaPipeRef.current = new MediaPipeService(options);
      
      // Set up detection callback for logging and state management
      mediaPipeRef.current.onDetection((detection: FaceDetection) => {
        console.log('🎯 Face Detection Event:', {
          detected: detection.detected,
          confidence: detection.confidence,
          boundingBox: detection.boundingBox,
          timestamp: new Date(detection.timestamp).toISOString(),
        });
        
        // Update tracking store
        updateFaceDetection(detection);
      });

      // Set up landmarks callback for logging and state management
      mediaPipeRef.current.onLandmarks((landmarks: FacialLandmarks) => {
        console.log('📍 Facial Landmarks Event:', {
          landmarkCount: landmarks.landmarks.length,
          confidence: landmarks.confidence,
          timestamp: new Date(landmarks.timestamp).toISOString(),
        });
        
        // Update tracking store
        updateFacialLandmarks(landmarks);
      });

      await mediaPipeRef.current.initialize();
      setIsInitialized(true);
      setInitialized(true);
      setStatus('not_detected');
      
      console.log('✅ MediaPipe hook initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe hook:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setStatus('error');
      throw error;
    }
  }, [options]);

  /**
   * Process video element with MediaPipe
   */
  const processVideo = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
    if (!mediaPipeRef.current) {
      console.warn('MediaPipe not initialized, initializing now...');
      await initialize();
    }

    try {
      console.log('🔄 Processing video frame with MediaPipe...');
      await mediaPipeRef.current.processFrame(videoElement);
    } catch (error) {
      console.error('Error processing video with MediaPipe:', error);
    }
  }, [initialize]);

  /**
   * Start continuous processing
   */
  const startProcessing = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
    if (!mediaPipeRef.current || !isInitialized) {
      console.warn('MediaPipe not initialized, initializing now...');
      await initialize();
    }

    try {
      await mediaPipeRef.current.startProcessing(videoElement);
      console.log('🎬 Started MediaPipe processing');
    } catch (error) {
      console.error('Error starting MediaPipe processing:', error);
    }
  }, [initialize]);

  /**
   * Get current MediaPipe state
   */
  const getState = useCallback(() => {
    if (!mediaPipeRef.current) {
      return {
        isInitialized: false,
        status: 'not_initialized',
        error: 'MediaPipe not initialized',
      };
    }

    return mediaPipeRef.current.getState();
  }, []);

  /**
   * Clean up MediaPipe resources
   */
  const dispose = useCallback(() => {
    if (mediaPipeRef.current) {
      console.log('🧹 Disposing MediaPipe hook...');
      mediaPipeRef.current.dispose();
      mediaPipeRef.current = null;
      setIsInitialized(false);
      setInitialized(false);
      setStatus('not_detected');
      console.log('✅ MediaPipe hook disposed');
    }
  }, [setInitialized, setStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    initialize,
    processVideo,
    startProcessing,
    getState,
    dispose,
    isInitialized,
  };
}; 