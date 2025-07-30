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
  const debugLogsRef = useRef<string[]>([]);

  // Debug logging function that also stores logs
  const debugLog = useCallback((message: string, data?: any) => {
    const logMessage = `🎩 ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
    console.log(logMessage);
    
    // Store last 10 logs for UI display
    debugLogsRef.current.push(logMessage);
    if (debugLogsRef.current.length > 10) {
      debugLogsRef.current.shift();
    }
  }, []);

  // Get overlay and tracking state
  const { activeOverlays, isEnabled } = useOverlayStore();
  const { status, facialLandmarks, faceDetection } = useTrackingStore();

  // Get only hat overlays
  const hatOverlays = activeOverlays.filter(
    overlay => overlay.config.type === OverlayType.HAT && overlay.enabled
  );

  // TEST: Manually add a hat overlay for debugging if none exist
  useEffect(() => {
    debugLog('useEffect triggered - hatOverlays.length:', hatOverlays.length, 'isVisible:', isVisible, 'isEnabled:', isEnabled);
    
    if (hatOverlays.length === 0 && isVisible) {
      debugLog('No hat overlays found, checking if we should add a test hat');
      
      // Force enable the overlay system if it's not enabled
      if (!isEnabled) {
        debugLog('Overlay system not enabled, forcing enable');
        useOverlayStore.getState().setEnabled(true);
      }
      
      // Manual test: Add a baseball hat overlay directly to the store
      const { addOverlay } = useOverlayStore.getState();
      const testHatConfig = {
        id: 'test-baseball',
        type: OverlayType.HAT,
        name: 'Test Baseball',
        imageUrl: '/assets/hats/baseball.svg',
        defaultPosition: { x: 0.5, y: 0.2, width: 0.3, height: 0.2, rotation: 0, scale: 1.0, zIndex: 2 },
        defaultRendering: { opacity: 0.9, blendMode: 'normal' as const, visible: true },
        anchors: { primary: 10, secondary: [338, 151, 337], offset: { x: 0, y: -0.1 } },
        scaling: { base: 1.0, widthFactor: 1.0, heightFactor: 1.0 }
      };
      
      debugLog('Adding test hat overlay manually');
      addOverlay(testHatConfig);
    }
  }, [hatOverlays.length, isVisible, isEnabled]);

  // Debug logging
  debugLog('HatOverlay Debug:', {
    isVisible,
    isEnabled,
    activeOverlaysCount: activeOverlays.length,
    hatOverlaysCount: hatOverlays.length,
    hatOverlays: hatOverlays.map(o => ({ id: o.config.id, enabled: o.enabled, imageUrl: o.config.imageUrl })),
    status,
    hasFacialLandmarks: !!facialLandmarks,
    hasFaceDetection: !!faceDetection
  });

  // More detailed state logging
  debugLog('HatOverlay State Details:', {
    'isVisible (prop)': isVisible,
    'isEnabled (store)': isEnabled,
    'status (tracking)': status,
    'facialLandmarks exists': !!facialLandmarks,
    'faceDetection exists': !!faceDetection,
    'canvas exists': !!canvasRef.current,
    'video exists': !!videoRef.current
  });

  // Additional debugging for overlay state
  if (activeOverlays.length > 0) {
    debugLog('All active overlays:', activeOverlays.map(o => ({
      id: o.config.id,
      type: o.config.type,
      enabled: o.enabled,
      name: o.config.name
    })));
  }

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
  const calculateHatPosition = useCallback((landmarks: any, overlay: any) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Use forehead landmarks for centering (same as DebugHatsOverlay)
    const foreheadLandmarks = [108, 337, 9, 10]; // Left forehead, right forehead, top forehead, above eyes
    const foreheadLeft = landmarks[108]; // Left forehead
    const foreheadRight = landmarks[337]; // Right forehead

    // Check if we have enough landmarks
    const allLandmarks = [...foreheadLandmarks, foreheadLeft, foreheadRight];
    if (allLandmarks.some(lm => !lm)) {
      debugLog('HatOverlay - Missing landmarks');
      return null;
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

    // Calculate rotation angle from forehead landmarks (same as DebugHatsOverlay)
    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width || 640; // Default fallback
    const canvasHeight = canvas?.height || 480; // Default fallback
    
    const leftX = foreheadLeft.x * canvasWidth;
    const rightX = foreheadRight.x * canvasWidth;
    const deltaX = rightX - leftX;
    const deltaY = (foreheadRight.y - foreheadLeft.y) * canvasHeight;
    const rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return {
      x: hatX,
      y: hatY,
      width: hatWidth,
      height: hatHeight,
      rotation: rotationAngle,
      scale: overlay.rendering.scale || 1.0,
    };
  }, [faceDetection]);

  /**
   * Render hat overlays on canvas
   */
  const renderHats = useCallback(async () => {
    debugLog('renderHats called:', {
      hasCanvas: !!canvasRef.current,
      hasCtx: !!canvasRef.current?.getContext('2d'),
      hasVideo: !!videoRef.current,
      hasFacialLandmarks: !!facialLandmarks,
      isVisible,
      hatOverlaysLength: hatOverlays.length
    });

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
      debugLog('renderHats early return - missing requirements');
      return;
    }

    // Clear previous hat drawings
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Check if video is mirrored (same as DebugHatsOverlay)
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    for (const overlay of hatOverlays) {
      try {
        const position = calculateHatPosition(facialLandmarks, overlay);
        if (!position) continue;

        // Load hat image
        debugLog('Loading hat image:', overlay.config.imageUrl);
        const img = await preloadImage(overlay.config.imageUrl);
        debugLog('Hat image loaded successfully:', img.width, 'x', img.height);

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
        
        debugLog('Drawing hat at:', { drawX, drawY, drawWidth, drawHeight, isMirrored });
        
        // Apply transformations for rotation
        ctx.save();
        ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
        ctx.rotate((position.rotation * Math.PI) / 180);
        ctx.scale(position.scale, position.scale);
        
        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        
        ctx.restore();

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
    <div className="relative">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        style={{ zIndex: 10 }}
      />
      
      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute top-0 left-0 bg-black/80 text-white p-2 text-xs max-w-md max-h-40 overflow-y-auto z-20">
          <div className="font-bold mb-1">HatOverlay Debug Logs:</div>
          {debugLogsRef.current.map((log, index) => (
            <div key={index} className="mb-1 break-all">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
