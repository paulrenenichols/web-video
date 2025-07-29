/**
 * @fileoverview Basic overlay system component.
 *
 * Provides foundation for overlay positioning, rendering, and management.
 * Handles canvas setup and basic rendering logic for facial overlays.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { useTrackingStore } from '@/stores/tracking-store';
import { OverlayService } from '@/services/overlay.service';
import { calculateFaceOrientation } from '@/utils/tracking';

interface OverlaySystemProps {
  /** Whether overlay system is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement>;
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

  // Get overlay and tracking state
  const {
    activeOverlays,
    isEnabled,
    mode,
    error,
  } = useOverlayStore();

  const {
    status,
    facialLandmarks,
    faceDetection,
  } = useTrackingStore();

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
   * Render overlays on canvas
   */
  const renderOverlays = useCallback(() => {
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
      activeOverlays.length === 0
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
    
    // Debug mirroring detection
    console.log('🔍 Mirroring check - Video transform:', video.style.transform);
    console.log('🔍 Mirroring check - isMirrored:', isMirrored);

    // Calculate face orientation
    const orientation = calculateFaceOrientation(facialLandmarks.landmarks);

    // Create positioning context
    const positioningContext = {
      landmarks: facialLandmarks.landmarks,
      boundingBox: {
        x: faceDetection.boundingBox.x,
        y: faceDetection.boundingBox.y,
        width: faceDetection.boundingBox.width,
        height: faceDetection.boundingBox.height,
      },
      orientation,
      canvasSize: { width: canvasWidth, height: canvasHeight },
      isMirrored,
    };

    // Sort overlays by z-index
    const sortedOverlays = [...activeOverlays].sort((a, b) => a.position.zIndex - b.position.zIndex);

    // Render each overlay
    sortedOverlays.forEach(overlay => {
      if (!overlay.enabled || !overlay.rendering.visible) return;

      try {
        // Calculate overlay position
        const positionResult = OverlayService.calculateOverlayPosition(
          overlay.config,
          positioningContext
        );

        if (!positionResult.isValid) {
          console.warn(`Overlay ${overlay.config.name} position invalid:`, positionResult.error);
          return;
        }

        // Convert normalized coordinates to canvas coordinates
        const canvasX = positionResult.position.x * canvasWidth;
        const canvasY = positionResult.position.y * canvasHeight;
        const canvasWidth_px = positionResult.position.width * canvasWidth;
        const canvasHeight_px = positionResult.position.height * canvasHeight;

        console.log('🎨 Rendering overlay - Name:', overlay.config.name);
        console.log('🎨 Rendering overlay - Normalized position:', positionResult.position.x.toFixed(3), positionResult.position.y.toFixed(3));
        console.log('🎨 Rendering overlay - Canvas position:', canvasX.toFixed(1), canvasY.toFixed(1));
        console.log('🎨 Rendering overlay - Size:', canvasWidth_px.toFixed(1), 'x', canvasHeight_px.toFixed(1));
        console.log('🎨 Rendering overlay - Canvas:', canvasWidth, 'x', canvasHeight);

        // Set rendering properties
        ctx.globalAlpha = overlay.rendering.opacity;
        ctx.globalCompositeOperation = overlay.rendering.blendMode;

        // Apply transformations
        ctx.save();
        
        // Note: MediaPipe landmarks are already in the correct coordinate system for mirrored video
        // No additional canvas mirroring needed
        
        // Apply overlay transformations
        ctx.translate(canvasX + canvasWidth_px / 2, canvasY + canvasHeight_px / 2);
        ctx.rotate((positionResult.position.rotation * Math.PI) / 180);
        ctx.scale(positionResult.position.scale, positionResult.position.scale);

        // For now, draw a placeholder rectangle
        // In future steps, this will be replaced with actual overlay images
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-canvasWidth_px / 2, -canvasHeight_px / 2, canvasWidth_px, canvasHeight_px);

        // Draw overlay label
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(overlay.config.name, 0, -canvasHeight_px / 2 - 5);

        // Restore context
        ctx.restore();

      } catch (error) {
        console.error(`Error rendering overlay ${overlay.config.name}:`, error);
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
    activeOverlays,
    clearCanvas,
    videoRef,
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

    // Render overlays
    renderOverlays();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateCanvasSize, renderOverlays]);

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
    if (isVisible && isEnabled) {
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
  }, [isVisible, isEnabled, render, clearCanvas]);

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error('Overlay system error:', error);
    }
  }, [error]);

  if (!isVisible || !isEnabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 20,
      }}
    />
  );
}; 