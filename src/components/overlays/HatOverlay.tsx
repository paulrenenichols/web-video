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

  // Clear canvas when overlays are removed
  useEffect(() => {
    if (hatOverlays.length === 0 && isVisible) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [hatOverlays.length, isVisible]);

  // Clean component - no debug logging needed

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
   * Calculate hat position based on head landmarks (using DebugHatsOverlay logic)
   */
  const calculateHatPosition = useCallback((landmarks: any) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Use forehead landmarks for centering (exactly like DebugHatsOverlay)
    const foreheadLandmarks = [108, 337, 9, 10]; // Left forehead, right forehead, top forehead, above eyes
    const foreheadLeft = landmarks[108]; // Left forehead
    const foreheadRight = landmarks[337]; // Right forehead

    // Check if we have enough landmarks (exactly like DebugHatsOverlay)
    const allLandmarks = [...foreheadLandmarks, foreheadLeft, foreheadRight];
    const missingLandmarks = allLandmarks.map((lm, i) => ({ index: [108, 337, 9, 10, 108, 337][i], exists: !!lm }));
    if (allLandmarks.some(lm => !lm)) {
      console.log('🎩 Missing landmarks for hat positioning:', missingLandmarks);
      
      // Try fallback landmarks if primary landmarks are missing
      const fallbackLeft = landmarks[151]; // Left head side
      const fallbackRight = landmarks[337]; // Right head side
      const fallbackTop = landmarks[10]; // Head top
      
      if (fallbackLeft && fallbackRight && fallbackTop) {
        console.log('🎩 Using fallback landmarks for hat positioning');
        const headCenterX = (fallbackLeft.x + fallbackRight.x) / 2;
        const headWidth = Math.abs(fallbackRight.x - fallbackLeft.x);
        const hatWidth = headWidth * 1.2;
        const hatHeight = headWidth * 0.8;
        const hatX = headCenterX - hatWidth / 2;
        const hatY = fallbackTop.y - hatHeight * 0.5;
        
        return {
          x: hatX,
          y: hatY,
          width: hatWidth,
          height: hatHeight,
          rotation: 0,
          scale: 1.0,
        };
      }
      
      return null; // Return null if all landmarks missing
    }

    // Use face detection bounding box for accurate head width (same as DebugHatsOverlay)
    const headWidth = faceDetection?.boundingBox?.width || 0.3; // Fallback to 30% of screen width

    // Calculate head height from forehead to chin (same as DebugHatsOverlay)
    const foreheadY = Math.min(...foreheadLandmarks.map(lm => lm.y));
    const chinY = Math.max(...landmarks.slice(0, 50).map(lm => lm.y)); // Use first 50 landmarks for chin
    const headHeight = chinY - foreheadY;

    // Position hat above the forehead (same as DebugHatsOverlay)
    const hatY = foreheadY - headHeight * 0.4; // 40% above forehead
    const hatHeight = headHeight * 0.6; // 60% of head height
    const hatWidth = headWidth * 1.1; // 110% of head width for hat coverage

    // Center the hat horizontally using forehead landmarks (same as DebugHatsOverlay)
    const headCenterX = (foreheadLeft.x + foreheadRight.x) / 2;
    const hatX = headCenterX - hatWidth / 2;

    return {
      x: hatX,
      y: hatY,
      width: hatWidth,
      height: hatHeight,
                rotation: 0, // No rotation for now - match DebugHatsOverlay
          scale: 1.0,
    };
  }, [faceDetection]);

  /**
   * Render hat overlays on canvas
   */
  const renderHats = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    console.log('🎩 renderHats called:', {
      hasCanvas: !!canvas,
      hasCtx: !!ctx,
      hasVideo: !!video,
      hasFacialLandmarks: !!facialLandmarks,
      isVisible,
      hatOverlaysLength: hatOverlays.length
    });

    if (
      !canvas ||
      !ctx ||
      !video ||
      !facialLandmarks ||
      !isVisible
    ) {
      console.log('🎩 renderHats early return - missing requirements');
      // Clear canvas when not rendering
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Always clear canvas at the start of each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If no hat overlays, we're done (canvas is already cleared)
    if (hatOverlays.length === 0) {
      return;
    }

    // Clear previous hat drawings
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Check if video is mirrored (same as DebugHatsOverlay)
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    for (const overlay of hatOverlays) {
      try {
        console.log('🎩 Processing hat overlay:', overlay.config.name);
        const position = calculateHatPosition(facialLandmarks.landmarks);
        console.log('🎩 Position calculation result:', position);
        if (!position) {
          console.log('🎩 Hat position calculation failed for:', overlay.config.name);
          continue;
        }

        // Load hat image
        console.log('🎩 Loading hat image:', overlay.config.imageUrl);
        const img = await preloadImage(overlay.config.imageUrl);
        console.log('🎩 Hat image loaded successfully:', !!img);

        // Apply opacity
        ctx.globalAlpha = overlay.rendering.opacity;

        // Calculate drawing coordinates
        let drawX = position.x * canvas.width;
        const drawY = position.y * canvas.height;
        const drawWidth = position.width * canvas.width;
        const drawHeight = position.height * canvas.height;
        
        // Apply mirroring if needed (same as DebugHatsOverlay)
        if (isMirrored) {
          drawX = canvas.width - drawX - drawWidth;
        }
        
        // Calculate rotation angle from forehead landmarks (like DebugHatsOverlay)
        const foreheadLeft = facialLandmarks.landmarks[108]; // Left forehead
        const foreheadRight = facialLandmarks.landmarks[337]; // Right forehead

        let rotationAngle = 0;
        if (
          foreheadLeft &&
          foreheadRight &&
          (foreheadLeft.visibility || 0) > 0.5 &&
          (foreheadRight.visibility || 0) > 0.5
        ) {
          let leftX = foreheadLeft.x * canvas.width;
          let rightX = foreheadRight.x * canvas.width;

          // Apply mirroring to forehead positions if needed
          if (isMirrored) {
            leftX = canvas.width - leftX;
            rightX = canvas.width - rightX;
          }

          const deltaX = rightX - leftX;
          const deltaY = (foreheadRight.y - foreheadLeft.y) * canvas.height;
          rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        }

        // Calculate hat center for rotation
        const hatCenterX = drawX + drawWidth / 2;
        const hatCenterY = drawY + drawHeight / 2;

        // Draw hat image with rotation (like DebugHatsOverlay)
        ctx.save();
        ctx.translate(hatCenterX, hatCenterY);
        ctx.rotate((rotationAngle * Math.PI) / 180);
        
        // Rotate 180 degrees to fix upside down issue
        ctx.rotate(Math.PI);

        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );

        ctx.restore();
      } catch (error) {
        console.error('Error rendering hat overlay:', error);

        // No fallback visuals - just log the error
        console.error('Failed to render hat overlay:', overlay.config.name);
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
