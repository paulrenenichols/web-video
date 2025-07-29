/**
 * @fileoverview Glasses overlay component for facial tracking.
 *
 * Handles glasses positioning, rendering, and state management.
 * Positions glasses based on eye landmarks and provides realistic
 * head movement tracking.
 */

import React, { useRef, useEffect, useCallback } from 'react';
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
}

export const GlassesOverlay: React.FC<GlassesOverlayProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

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
  const calculateGlassesPosition = useCallback((
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
  }, []);

  /**
   * Render glasses overlays
   */
  const renderGlasses = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    clearCanvas();

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

    // Calculate glasses position
    const glassesPosition = calculateGlassesPosition(
      facialLandmarks.landmarks,
      canvasWidth,
      canvasHeight,
      isMirrored
    );

    if (!glassesPosition) {
      return;
    }

    // Render each glasses overlay
    glassesOverlays.forEach(overlay => {
      if (!overlay.rendering.visible) return;

      try {
        // Set rendering properties
        ctx.globalAlpha = overlay.rendering.opacity;
        ctx.globalCompositeOperation = overlay.rendering.blendMode;

        // Apply transformations
        ctx.save();
        ctx.translate(glassesPosition.x, glassesPosition.y);
        ctx.rotate((glassesPosition.rotation * Math.PI) / 180);
        ctx.scale(overlay.position.scale, overlay.position.scale);

        // Draw glasses placeholder (green rectangle)
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
        ctx.fillText(
          overlay.config.name,
          0,
          -glassesPosition.height / 2 - 10
        );

        // Restore context
        ctx.restore();

      } catch (error) {
        console.error(`Error rendering glasses overlay ${overlay.config.name}:`, error);
      }
    });

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
  ]);

  /**
   * Main render loop
   */
  const render = useCallback(() => {
    // Update canvas size if needed
    if (!updateCanvasSize()) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    // Render glasses
    renderGlasses();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateCanvasSize, renderGlasses]);

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
      }}
    />
  );
}; 