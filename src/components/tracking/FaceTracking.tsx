/**
 * @fileoverview Main facial tracking component using MediaPipe.
 *
 * Integrates MediaPipe Face Detection for real-time facial landmark tracking.
 * Provides tracking data for overlay positioning and visualization.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { TrackingVisualization } from './TrackingVisualization';
import type { FacialLandmarks } from '@/types/tracking';

interface FaceTrackingProps {
  stream: MediaStream | null;
  onTrackingUpdate?: (landmarks: FacialLandmarks | null) => void;
  showVisualization?: boolean;
  className?: string;
  onVideoRef?: (videoElement: HTMLVideoElement | null) => void;
}

export const FaceTracking: React.FC<FaceTrackingProps> = ({
  stream,
  onTrackingUpdate,
  showVisualization = false,
  className = '',
  onVideoRef,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isInitialized: trackingInitialized,
    isTracking,
    isDetected,
    landmarks,
    confidence,
    error,
    performance,
    initializeTracking,
    startTracking,
    stopTracking,
  } = useFaceTracking();

  /**
   * @description Initialize tracking when component mounts
   */
  useEffect(() => {
    const initTracking = async () => {
      try {
        await initializeTracking();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize face tracking:', error);
      }
    };

    if (!trackingInitialized) {
      initTracking();
    }
  }, [trackingInitialized, initializeTracking]);

  /**
   * @description Start/stop tracking when stream changes
   */
  useEffect(() => {
    if (!isInitialized || !stream || !videoRef.current) {
      return;
    }

    if (isTracking) {
      stopTracking();
    }

    // Start tracking with current stream
    startTracking(
      videoRef.current,
      showVisualization ? canvasRef.current || undefined : undefined
    );
  }, [
    stream,
    isInitialized,
    isTracking,
    startTracking,
    stopTracking,
    showVisualization,
  ]);

  /**
   * @description Update video element when stream changes
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch(error => {
      console.error('Error playing video:', error);
    });
  }, [stream]);

  /**
   * @description Notify parent of video element reference
   */
  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef]);

  /**
   * @description Notify parent component of tracking updates
   */
  useEffect(() => {
    onTrackingUpdate?.(landmarks);
  }, [landmarks, onTrackingUpdate]);

  /**
   * @description Update canvas size to match video
   */
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const updateCanvasSize = () => {
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
    };

    video.addEventListener('loadedmetadata', updateCanvasSize);
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  if (!stream) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No video stream available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        style={{ transform: 'scaleX(-1)' }} // Mirror the video
      />

      {/* Tracking Visualization Canvas */}
      {showVisualization && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Tracking Visualization Overlay */}
      {showVisualization && landmarks && (
        <TrackingVisualization
          landmarks={landmarks}
          isDetected={isDetected}
          confidence={confidence}
          performance={performance}
        />
      )}

      {/* Tracking Status Indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded">
          {isDetected ? 'Face Detected' : 'No Face'}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Tracking Error: {error}</p>
        </div>
      )}

      {/* Performance Indicator */}
      {isTracking && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {Math.round(performance.fps)} FPS
        </div>
      )}
    </div>
  );
};
