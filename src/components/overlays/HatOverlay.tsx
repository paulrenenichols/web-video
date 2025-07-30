/**
 * @fileoverview Hat overlay component for rendering hat overlays on video feed.
 *
 * Positions and renders hat overlays based on facial landmarks,
 * specifically using head landmarks for positioning.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { useTrackingStore } from '@/stores/tracking-store';
import { OverlayType } from '@/types/overlay';

interface HatOverlayProps {
  /** Whether hat overlay is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Container className */
  className?: string;
}

export const HatOverlay: React.FC<HatOverlayProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Get overlay and tracking state
  const { activeOverlays, isEnabled } = useOverlayStore();
  const { status, facialLandmarks, faceDetection } = useTrackingStore();

  // Get only hat overlays
  const hatOverlays = activeOverlays.filter(
    overlay => overlay.config.type === OverlayType.HAT && overlay.enabled
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
   * Preload and cache hat images
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
   * Calculate hat position based on head landmarks
   */
  const calculateHatPosition = useCallback((landmarks: any, overlay: any) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Use head landmarks for hat positioning
    // Landmarks 10, 338 for head top, 151, 337 for head sides
    const headTop = landmarks[10];
    const headTopRight = landmarks[338];
    const headLeft = landmarks[151];
    const headRight = landmarks[337];

    if (!headTop || !headTopRight || !headLeft || !headRight) return null;

    // Calculate head center and size
    const headCenterX = (headLeft.x + headRight.x) / 2;
    const headCenterY = (headTop.y + headTopRight.y) / 2;
    const headWidth = Math.abs(headRight.x - headLeft.x);
    const headHeight = Math.abs(headTop.y - headTopRight.y);

    // Position hat above the head
    const hatX = headCenterX;
    const hatY = headTop.y - headHeight * 0.3; // Position above head
    const hatWidth = headWidth * 1.2; // Slightly wider than head
    const hatHeight = headHeight * 0.8; // Proportional to head height

    return {
      x: hatX - hatWidth / 2,
      y: hatY - hatHeight / 2,
      width: hatWidth,
      height: hatHeight,
      rotation: 0,
      scale: overlay.rendering.scale || 1.0,
    };
  }, []);

  /**
   * Render hat overlays on canvas
   */
  const renderHats = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    if (
      !canvas ||
      !ctx ||
      !video ||
      !facialLandmarks ||
      !isVisible ||
      hatOverlays.length === 0
    ) {
      return;
    }

    // Clear previous hat drawings
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    for (const overlay of hatOverlays) {
      try {
        const position = calculateHatPosition(facialLandmarks, overlay);
        if (!position) continue;

        // Load hat image
        const img = await preloadImage(overlay.config.imageUrl);

        // Apply opacity
        ctx.globalAlpha = overlay.rendering.opacity;

        // Draw hat image
        ctx.drawImage(
          img,
          position.x * canvas.width,
          position.y * canvas.height,
          position.width * canvas.width,
          position.height * canvas.height
        );

        // Draw label for debugging
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.font = '12px Arial';
        ctx.fillText(
          overlay.config.name,
          position.x * canvas.width,
          position.y * canvas.height - 5
        );
      } catch (error) {
        console.error('Error rendering hat overlay:', error);

        // Fallback: draw green rectangle
        const position = calculateHatPosition(facialLandmarks, overlay);
        if (position) {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
          ctx.fillRect(
            position.x * canvas.width,
            position.y * canvas.height,
            position.width * canvas.width,
            position.height * canvas.height
          );

          ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.font = '12px Arial';
          ctx.fillText(
            overlay.config.name,
            position.x * canvas.width,
            position.y * canvas.height - 5
          );
        }
      }
    }

    ctx.restore();
  }, [
    canvasRef,
    videoRef,
    facialLandmarks,
    hatOverlays,
    isVisible,
    calculateHatPosition,
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
      return;
    }

    await renderHats();
  }, [
    isVisible,
    status,
    facialLandmarks,
    faceDetection,
    renderHats,
    hatOverlays.length,
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
  }, [render, activeOverlays, isVisible]);

  // Return canvas element
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    />
  );
};
