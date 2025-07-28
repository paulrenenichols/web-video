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
    if (!isInitialized || !landmarks || !videoElement || !canvasRef.current) {
      if (isRendering) {
        stopRendering();
      }
      return;
    }

    if (!isRendering) {
      startRendering(videoElement, landmarks);
    } else {
      updateOverlayPositions(landmarks);
    }
  }, [
    isInitialized,
    landmarks,
    videoElement,
    isRendering,
    startRendering,
    stopRendering,
    updateOverlayPositions,
  ]);

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

  if (!landmarks) {
    return null;
  }

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
