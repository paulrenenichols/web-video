/**
 * @fileoverview Main overlay management system for coordinating multiple overlays.
 *
 * Handles overlay combination logic, z-index management, and ensures
 * overlays work together seamlessly (glasses + hat combinations).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { useTrackingStore } from '@/stores/tracking-store';
import { OverlayType, ActiveOverlay } from '@/types/overlay';
import { OverlayService } from '@/services/overlay.service';

interface OverlaySystemProps {
  /** Whether overlay system is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
}

export const OverlaySystem: React.FC<OverlaySystemProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const { activeOverlays, isEnabled } = useOverlayStore();
  const { status, facialLandmarks, faceDetection } = useTrackingStore();

  /**
   * Update canvas size to match video dimensions
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [videoRef]);

  /**
   * Clear canvas
   */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Render all active overlays with combination logic
   */
  const renderOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    if (!canvas || !ctx || !facialLandmarks || !video || !isEnabled) return;

    // Clear canvas
    clearCanvas();

    // Check if video is mirrored
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Create positioning context
    const positioningContext = {
      landmarks: facialLandmarks.landmarks,
      boundingBox: faceDetection?.boundingBox || {
        x: 0.5,
        y: 0.5,
        width: 0.3,
        height: 0.4,
      },
      orientation: { yaw: 0, pitch: 0, roll: 0 }, // Will be enhanced in Step 10
      canvasSize: { width: canvasWidth, height: canvasHeight },
      isMirrored,
    };

    // Sort overlays by z-index for proper layering
    const sortedOverlays = [...activeOverlays]
      .filter(overlay => overlay.enabled && overlay.rendering.visible)
      .sort((a, b) => a.position.zIndex - b.position.zIndex);

    // Render each overlay
    sortedOverlays.forEach(overlay => {
      try {
        // Calculate position using overlay service
        const positionResult = OverlayService.calculateOverlayPosition(
          overlay.config,
          positioningContext
        );

        if (!positionResult.isValid) {
          console.warn(
            `Overlay ${overlay.config.name} position invalid:`,
            positionResult.error
          );
          return;
        }

        // Convert normalized coordinates to canvas coordinates
        let canvasX = positionResult.position.x * canvasWidth;
        const canvasY = positionResult.position.y * canvasHeight;
        const canvasWidth_px = positionResult.position.width * canvasWidth;
        const canvasHeight_px = positionResult.position.height * canvasHeight;

        // Apply mirroring if needed
        if (isMirrored) {
          canvasX = canvasWidth - canvasX;
        }

        // Set rendering properties
        ctx.globalAlpha = overlay.rendering.opacity;
        ctx.globalCompositeOperation = overlay.rendering.blendMode;

        // Apply transformations
        ctx.save();
        ctx.translate(canvasX, canvasY);
        ctx.rotate((positionResult.position.rotation * Math.PI) / 180);
        ctx.scale(positionResult.position.scale, positionResult.position.scale);

        // Draw overlay placeholder (will be replaced with actual images in future steps)
        ctx.strokeStyle =
          overlay.config.type === OverlayType.GLASSES ? '#00ff00' : '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -canvasWidth_px / 2,
          -canvasHeight_px / 2,
          canvasWidth_px,
          canvasHeight_px
        );

        // Add label for debugging
        ctx.fillStyle =
          overlay.config.type === OverlayType.GLASSES ? '#00ff00' : '#ff6600';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(overlay.config.name, 0, -canvasHeight_px / 2 - 5);

        ctx.restore();
      } catch (error) {
        console.error(`Error rendering overlay ${overlay.config.name}:`, error);
      }
    });
  }, [
    activeOverlays,
    isEnabled,
    facialLandmarks,
    faceDetection,
    videoRef,
    clearCanvas,
  ]);

  /**
   * Main render function
   */
  const render = useCallback(() => {
    if (
      !isVisible ||
      status !== 'detected' ||
      !facialLandmarks ||
      !faceDetection
    ) {
      clearCanvas();
      return;
    }

    renderOverlays();
  }, [
    isVisible,
    status,
    facialLandmarks,
    faceDetection,
    renderOverlays,
    clearCanvas,
  ]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      updateCanvasSize();
      render();
    };

    const handleResize = () => {
      updateCanvasSize();
      render();
    };

    video.addEventListener('loadedmetadata', handleVideoReady);
    window.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, updateCanvasSize, render]);

  // Render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Clear canvas when visibility changes
  useEffect(() => {
    if (!isVisible) {
      clearCanvas();
    }
  }, [isVisible, clearCanvas]);

  // Return canvas element
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 20 }}
    />
  );
};
