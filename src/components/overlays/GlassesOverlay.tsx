/**
 * @fileoverview Glasses overlay component for facial tracking.
 *
 * Handles glasses positioning, rendering, and state management.
 * Positions glasses based on eye landmarks and provides realistic
 * head movement tracking.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { useTrackingStore } from '@/stores/tracking-store';
import { OverlayType } from '@/types/overlay';

interface GlassesOverlayProps {
  /** Whether glasses overlay is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
  /** Data attribute for overlay type */
  'data-overlay'?: string;
}

export const GlassesOverlay: React.FC<GlassesOverlayProps> = React.memo(({
  isVisible,
  videoRef,
  className = '',
  'data-overlay': dataOverlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Get overlay and tracking state
  const { activeOverlays, isEnabled } = useOverlayStore();
  const { status, facialLandmarks, faceDetection } = useTrackingStore();

  // Get only glasses overlays
  const glassesOverlays = activeOverlays.filter(
    overlay => overlay.config.type === OverlayType.GLASSES && overlay.enabled
  );

  /**
   * Update canvas size to match video
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return false;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) return false;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    return true;
  }, [videoRef]);

  /**
   * Preload image if not already cached
   */
  const preloadImage = useCallback(
    (imageUrl: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        if (imageCache.current.has(imageUrl)) {
          resolve(imageCache.current.get(imageUrl)!);
          return;
        }

        const img = new Image();
        img.onload = () => {
          imageCache.current.set(imageUrl, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = imageUrl;
      });
    },
    []
  );

  /**
   * Clear canvas
   */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Calculate glasses position based on eye landmarks
   */
  const calculateGlassesPosition = useCallback(
    (
      landmarks: any[],
      canvasWidth: number,
      canvasHeight: number,
      isMirrored: boolean
    ) => {
      // Get eye landmarks
      const leftEye = landmarks[159]; // Left eye center
      const rightEye = landmarks[386]; // Right eye center
      const leftEyeOuter = landmarks[33]; // Left eye outer corner
      const rightEyeOuter = landmarks[263]; // Right eye outer corner

      if (!leftEye || !rightEye || !leftEyeOuter || !rightEyeOuter) {
        return null;
      }

      if (leftEye.visibility < 0.5 || rightEye.visibility < 0.5) {
        return null;
      }

      // Calculate eye positions
      let leftEyeX = leftEye.x * canvasWidth;
      const leftEyeY = leftEye.y * canvasHeight;
      let rightEyeX = rightEye.x * canvasWidth;
      const rightEyeY = rightEye.y * canvasHeight;

      // Handle mirroring
      if (isMirrored) {
        leftEyeX = canvasWidth - leftEyeX;
        rightEyeX = canvasWidth - rightEyeX;
      }

      // Calculate center between eyes
      const centerX = (leftEyeX + rightEyeX) / 2;
      const centerY = (leftEyeY + rightEyeY) / 2;

      // Calculate eye span for width
      let leftOuterX = leftEyeOuter.x * canvasWidth;
      let rightOuterX = rightEyeOuter.x * canvasWidth;

      if (isMirrored) {
        leftOuterX = canvasWidth - leftOuterX;
        rightOuterX = canvasWidth - rightOuterX;
      }

      const eyeSpan = Math.abs(rightOuterX - leftOuterX);
      const glassesWidth = eyeSpan * 1.3; // 30% wider than eye span
      const glassesHeight = glassesWidth * 0.4; // Aspect ratio for glasses

      // Calculate rotation from eye positions
      const deltaX = rightEyeX - leftEyeX;
      const deltaY = rightEyeY - leftEyeY;
      const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      return {
        x: centerX,
        y: centerY,
        width: glassesWidth,
        height: glassesHeight,
        rotation,
      };
    },
    []
  );

  /**
   * Render glasses overlays
   */
  const renderGlasses = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas completely and reset context
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix

    // Check if we have valid tracking data
    if (
      !isEnabled ||
      status !== 'detected' ||
      !facialLandmarks ||
      !faceDetection ||
      glassesOverlays.length === 0
    ) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Check if video is mirrored
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    // Calculate glasses position (only if landmarks changed)
    const glassesPosition = calculateGlassesPosition(
      facialLandmarks.landmarks,
      canvasWidth,
      canvasHeight,
      isMirrored
    );

    if (!glassesPosition) {
      return;
    }

    // Check if position is within bounds
    if (
      glassesPosition.x < 0 ||
      glassesPosition.y < 0 ||
      glassesPosition.x + glassesPosition.width > canvasWidth ||
      glassesPosition.y + glassesPosition.height > canvasHeight
    ) {
      return; // Don't render if outside bounds
    }

    // Render each glasses overlay
    for (const overlay of glassesOverlays) {
      if (!overlay.rendering.visible) continue;

      try {
        // Set rendering properties
        ctx.globalAlpha = overlay.rendering.opacity;
        ctx.globalCompositeOperation = overlay.rendering.blendMode;

        // Apply transformations
        ctx.save();
        ctx.translate(glassesPosition.x, glassesPosition.y);
        ctx.rotate((glassesPosition.rotation * Math.PI) / 180);
        ctx.scale(overlay.position.scale, overlay.position.scale);

        // Get cached image or load it
        const img = await preloadImage(overlay.config.imageUrl);

        // Calculate aspect ratio to maintain proportions
        const aspectRatio = img.width / img.height;
        const targetWidth = glassesPosition.width;
        const targetHeight = targetWidth / aspectRatio;

        // Draw the image
        ctx.drawImage(
          img,
          -targetWidth / 2,
          -targetHeight / 2,
          targetWidth,
          targetHeight
        );

        // Restore context
        ctx.restore();
      } catch (error) {
        console.error(
          `Error rendering glasses overlay ${overlay.config.name}:`,
          error
        );

        // Fallback to green rectangle if image fails to load
        ctx.save();
        ctx.translate(glassesPosition.x, glassesPosition.y);
        ctx.rotate((glassesPosition.rotation * Math.PI) / 180);
        ctx.scale(overlay.position.scale, overlay.position.scale);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          -glassesPosition.width / 2,
          -glassesPosition.height / 2,
          glassesPosition.width,
          glassesPosition.height
        );

        // Draw glasses label
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(overlay.config.name, 0, -glassesPosition.height / 2 - 10);

        ctx.restore();
      }
    }

    // Reset global properties
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [
    isEnabled,
    status,
    facialLandmarks,
    faceDetection,
    glassesOverlays,
    clearCanvas,
    videoRef,
    calculateGlassesPosition,
    preloadImage,
  ]);

  /**
   * Main render function
   */
  const render = useCallback(async () => {
    if (
      !isVisible ||
      status !== 'detected' ||
      !facialLandmarks ||
      !faceDetection
    ) {
      // Clear the canvas when overlay is disabled
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }
      return;
    }

    // Update canvas size if needed
    if (!updateCanvasSize()) {
      return;
    }

    // Render glasses
    await renderGlasses();
  }, [
    isVisible,
    status,
    facialLandmarks,
    faceDetection,
    updateCanvasSize,
    renderGlasses,
    glassesOverlays.length,
  ]);

  // Handle canvas size updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      updateCanvasSize();
    };

    const handleResize = () => {
      updateCanvasSize();
    };

    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);
    window.addEventListener('resize', handleResize);

    updateCanvasSize();

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCanvasSize, videoRef]);

  // Handle rendering
  useEffect(() => {
    if (isVisible && isEnabled && glassesOverlays.length > 0) {
      render();
    } else {
      clearCanvas();
    }
  }, [isVisible, isEnabled, glassesOverlays.length, render, clearCanvas]);

  if (!isVisible || !isEnabled || glassesOverlays.length === 0) {
    return null;
  }
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 25, // Higher than general overlays
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden', // Prevent content from extending beyond bounds
      }}
      data-overlay={dataOverlay}
    />
  );
});
