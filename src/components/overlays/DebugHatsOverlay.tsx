/**
 * @fileoverview Debug visualization component for hat overlays.
 *
 * Shows green bounding boxes and positioning indicators for hat overlays
 * when debug mode is enabled, regardless of active overlays.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';

interface DebugHatsOverlayProps {
  /** Whether debug hat overlay is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
}

export const DebugHatsOverlay: React.FC<DebugHatsOverlayProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

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
   * Calculate hat position based on head landmarks
   */
  const calculateHatPosition = useCallback((facialLandmarksData: any) => {
    // Check if we have facial landmarks data and it has the landmarks array
    if (!facialLandmarksData || !facialLandmarksData.landmarks || !Array.isArray(facialLandmarksData.landmarks) || facialLandmarksData.landmarks.length < 468) {
      console.log('🎩 DebugHatsOverlay - Invalid facial landmarks data:', {
        exists: !!facialLandmarksData,
        hasLandmarks: !!facialLandmarksData?.landmarks,
        isArray: Array.isArray(facialLandmarksData?.landmarks),
        length: facialLandmarksData?.landmarks?.length || 0
      });
      return null;
    }

    const landmarks = facialLandmarksData.landmarks;

    // Debug: Check what landmarks are available
    console.log('🎩 DebugHatsOverlay - Total landmarks available:', landmarks.length);
    console.log('🎩 DebugHatsOverlay - Sample landmarks 0-10:', landmarks.slice(0, 10).map((lm, i) => `[${i}]: ${lm ? 'exists' : 'missing'}`));

    // Use forehead and head landmarks for better hat positioning
    // These landmarks represent the top of the head and forehead area
    const foreheadLandmarks = [
      landmarks[10],   // Forehead center
      landmarks[338],  // Forehead left
      landmarks[297],  // Forehead right
      landmarks[332],  // Top of head
    ];

    // Use eye landmarks for width calculation and rotation
    const eyeLandmarks = [
      landmarks[159],  // Left eye center
      landmarks[386],  // Right eye center
    ];

    // Check if we have enough landmarks
    const allLandmarks = [...foreheadLandmarks, ...eyeLandmarks];
    if (allLandmarks.some(lm => !lm)) {
      console.log('🎩 DebugHatsOverlay - Missing landmarks:', allLandmarks.map((lm, i) => lm ? 'exists' : `missing at index ${[10, 338, 297, 332, 159, 386][i]}`));
      return null;
    }

    // Calculate head width from eye span
    const eyeWidth = Math.abs(eyeLandmarks[1].x - eyeLandmarks[0].x);
    const headWidth = eyeWidth * 2.5; // Head is typically 2.5x eye span

    // Calculate head height from forehead to chin
    const foreheadY = Math.min(...foreheadLandmarks.map(lm => lm.y));
    const chinY = Math.max(...landmarks.slice(0, 50).map(lm => lm.y)); // Use first 50 landmarks for chin
    const headHeight = chinY - foreheadY;

    // Position hat above the forehead
    const hatY = foreheadY - headHeight * 0.4; // 40% above forehead
    const hatHeight = headHeight * 0.6;        // 60% of head height
    const hatWidth = headWidth * 1.1;          // 110% of head width

    // Center the hat horizontally
    const headCenterX = (eyeLandmarks[0].x + eyeLandmarks[1].x) / 2;
    const hatX = headCenterX - hatWidth / 2;

    return {
      x: hatX,
      y: hatY,
      width: hatWidth,
      height: hatHeight,
    };
  }, []);

  /**
   * Render debug hat visualization
   */
  const renderDebugHatsVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    if (!canvas || !ctx || !facialLandmarks || !video) return;

    // Clear canvas
    clearCanvas();

    // Check if video is mirrored
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    // Calculate hat position
    const hatPosition = calculateHatPosition(facialLandmarks);
    if (!hatPosition) return;

    // Draw forehead landmarks (red dots)
    const foreheadLandmarks = [10, 338, 297, 332];
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    foreheadLandmarks.forEach(landmarkIndex => {
      const landmark = facialLandmarks.landmarks[landmarkIndex];
      if (landmark) {
        let x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        // Apply mirroring if needed
        if (isMirrored) {
          x = canvas.width - x;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw eye landmarks (blue dots) for reference
    const eyeLandmarks = [159, 386];
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    eyeLandmarks.forEach(landmarkIndex => {
      const landmark = facialLandmarks.landmarks[landmarkIndex];
      if (landmark) {
        let x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        // Apply mirroring if needed
        if (isMirrored) {
          x = canvas.width - x;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw center point between forehead landmarks (only if all landmarks exist)
    const existingForeheadLandmarks = foreheadLandmarks.filter(index => facialLandmarks.landmarks[index]);
    if (existingForeheadLandmarks.length === foreheadLandmarks.length) {
      let centerX = existingForeheadLandmarks.reduce((sum, index) => sum + facialLandmarks.landmarks[index].x, 0) / existingForeheadLandmarks.length;
      const centerY = existingForeheadLandmarks.reduce((sum, index) => sum + facialLandmarks.landmarks[index].y, 0) / existingForeheadLandmarks.length;
      
      // Apply mirroring to center point if needed
      if (isMirrored) {
        centerX = 1 - centerX;
      }
      
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(
        centerX * canvas.width,
        centerY * canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Calculate rotation angle from eye positions for hat orientation
    const leftEye = facialLandmarks.landmarks[159]; // Left eye center
    const rightEye = facialLandmarks.landmarks[386]; // Right eye center
    
    let rotationAngle = 0;
    if (leftEye && rightEye && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
      let leftEyeX = leftEye.x * canvas.width;
      let rightEyeX = rightEye.x * canvas.width;
      
      // Apply mirroring to eye positions if needed
      if (isMirrored) {
        leftEyeX = canvas.width - leftEyeX;
        rightEyeX = canvas.width - rightEyeX;
      }
      
      const deltaX = rightEyeX - leftEyeX;
      const deltaY = (rightEye.y - leftEye.y) * canvas.height;
      rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    }

    // Draw hat bounding box (green rectangle) with rotation
    let hatX = hatPosition.x * canvas.width;
    const hatY = hatPosition.y * canvas.height;
    const hatWidth = hatPosition.width * canvas.width;
    const hatHeight = hatPosition.height * canvas.height;
    
    // Apply mirroring to hat position if needed
    if (isMirrored) {
      hatX = canvas.width - hatX - hatWidth;
    }
    
    // Calculate hat center for rotation
    const hatCenterX = hatX + hatWidth / 2;
    const hatCenterY = hatY + hatHeight / 2;
    
    // Draw rotated hat bounding box
    ctx.save();
    ctx.translate(hatCenterX, hatCenterY);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hatWidth / 2, -hatHeight / 2, hatWidth, hatHeight);
    
    ctx.restore();

    // Draw hat label (also rotated)
    ctx.save();
    ctx.translate(hatCenterX, hatCenterY);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    
    // Rotate text 180 degrees so it reads left to right from viewer's perspective
    ctx.rotate(Math.PI);
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText(
      'Hat Position',
      -hatWidth / 2,
      -hatHeight / 2 - 15
    );
    
    ctx.restore();
  }, [canvasRef, facialLandmarks, calculateHatPosition, clearCanvas]);

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
      return;
    }

    renderDebugHatsVisualization();
  }, [isVisible, status, facialLandmarks, faceDetection, renderDebugHatsVisualization]);

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

  // Return canvas element
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 15 }}
    />
  );
}; 