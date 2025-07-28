/**
 * @fileoverview Main overlay management system.
 *
 * Coordinates overlay positioning, rendering, and state management.
 * Handles multiple overlays and their interactions.
 */

import React, { useEffect, useRef } from 'react';
import { useOverlays } from '@/hooks/useOverlays';
import type { FacialLandmarks } from '@/types/tracking';

interface OverlaySystemProps {
  landmarks: FacialLandmarks | null;
  videoElement: HTMLVideoElement | null;
  className?: string;
}

export const OverlaySystem: React.FC<OverlaySystemProps> = ({
  landmarks,
  videoElement,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const {
    activeOverlays,
    isRendering,
    error,
    initializeOverlays,
    loadOverlayImages,
    startRendering,
    stopRendering,
    updateOverlayPositions,
  } = useOverlays();

  /**
   * @description Initialize overlay system when component mounts
   */
  useEffect(() => {
    const initOverlays = async () => {
      if (!canvasRef.current) return;

      try {
        initializeOverlays(canvasRef.current);
        await loadOverlayImages();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize overlay system:', error);
      }
    };

    if (!isInitialized) {
      initOverlays();
    }
  }, [isInitialized, initializeOverlays, loadOverlayImages]);

  /**
   * @description Start/stop rendering when landmarks or video element changes
   */
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) {
      if (isRendering) {
        stopRendering();
      }
      return;
    }

    // Start rendering even without video element for testing
    if (!isRendering) {
      const mockVideoElement =
        videoElement ||
        ({
          videoWidth: 640,
          videoHeight: 480,
          clientWidth: 640,
          clientHeight: 480,
        } as HTMLVideoElement);

      startRendering(
        mockVideoElement,
        landmarks || {
          landmarks: [],
          faceInViewConfidence: 0,
          faceBoundingBox: { x: 0, y: 0, width: 0, height: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      );
    }
  }, [
    isInitialized,
    landmarks,
    videoElement,
    isRendering,
    startRendering,
    stopRendering,
  ]);

  /**
   * @description Update overlay positions when landmarks change
   */
  useEffect(() => {
    if (isRendering && landmarks && activeOverlays.length > 0) {
      updateOverlayPositions(landmarks);
    }
  }, [landmarks, isRendering, activeOverlays.length]);

  /**
   * @description Update canvas size to match video element
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoElement;

    if (!canvas || !video) return;

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
  }, [videoElement]);

  /**
   * @description Clean up rendering on unmount
   */
  useEffect(() => {
    return () => {
      if (isRendering) {
        stopRendering();
      }
    };
  }, [isRendering, stopRendering]);

  // Don't return null if no landmarks - still render the canvas for overlays
  // that don't require facial tracking

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Overlay Rendering Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Overlay Error: {error}</p>
        </div>
      )}

      {/* Debug Information */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
        <div>Landmarks: {landmarks ? 'Yes' : 'No'}</div>
        <div>Video: {videoElement ? 'Yes' : 'No'}</div>
        <div>Overlays: {activeOverlays.length}</div>
        <div>Rendering: {isRendering ? 'Yes' : 'No'}</div>
        {error && <div>Error: {error}</div>}
      </div>

      {/* Overlay Count Indicator */}
      {activeOverlays.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {activeOverlays.length} Overlay
          {activeOverlays.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
