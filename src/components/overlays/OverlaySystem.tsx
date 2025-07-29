/**
 * @fileoverview Overlay system component for rendering facial overlays.
 *
 * Manages the rendering of overlays (glasses, hats) on top of video feed
 * using facial landmarks for positioning and tracking.
 */

import React, { useRef, useEffect } from 'react';
import { useOverlays } from '@/hooks/useOverlays';
import { useTrackingStore } from '@/stores/tracking-store';

interface OverlaySystemProps {
  videoElement: HTMLVideoElement | null;
  className?: string;
}

export const OverlaySystem: React.FC<OverlaySystemProps> = ({
  videoElement,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isRendering,
    error,
    activeOverlays,
    initializeOverlays,
    loadOverlayImages,
    startRendering,
    stopRendering,
    updateOverlayPositions,
  } = useOverlays();

  // Get landmarks directly from the tracking store
  const { landmarks } = useTrackingStore();

  /**
   * @description Initialize overlay service when canvas is available
   */
  useEffect(() => {
    const initOverlays = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('OverlaySystem: Initializing overlay service...');
        initializeOverlays(canvasRef.current);
        await loadOverlayImages();
        console.log('OverlaySystem: Overlay service initialized successfully');
      } catch (error) {
        console.error(
          'OverlaySystem: Failed to initialize overlay service:',
          error
        );
      }
    };

    initOverlays();
  }, [initializeOverlays, loadOverlayImages]);

  /**
   * @description Start rendering when video element and landmarks are available
   */
  useEffect(() => {
    if (!canvasRef.current || !videoElement || isRendering) {
      return;
    }

    console.log(
      'OverlaySystem: Starting rendering with video element and landmarks:',
      landmarks?.landmarks.length || 0
    );

    // Start rendering with the video element
    startRendering(videoElement);
  }, [landmarks, videoElement, isRendering, startRendering, stopRendering]);

  /**
   * @description Update overlay positions when landmarks change
   */
  useEffect(() => {
    if (isRendering && landmarks && activeOverlays.length > 0) {
      console.log(
        'OverlaySystem: Updating overlay positions with landmarks:',
        landmarks.landmarks.length
      );
      updateOverlayPositions(landmarks);
    }
  }, [landmarks, isRendering, activeOverlays.length, updateOverlayPositions]);

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
