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
  const calculateHatPosition = useCallback((landmarks: any) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Use head landmarks for hat positioning
    // Landmarks 10, 338, 151, 337 define the head area
    const headLandmarks = [
      landmarks[10],   // Top of head
      landmarks[338],  // Top of head (right)
      landmarks[151],  // Top of head (left)
      landmarks[337],  // Top of head (center)
    ];

    // Calculate head bounding box
    const xCoords = headLandmarks.map(lm => lm.x);
    const yCoords = headLandmarks.map(lm => lm.y);

    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const width = maxX - minX;
    const height = maxY - minY;

    // Position hat above the head
    const hatY = minY - height * 0.3; // 30% above the head
    const hatHeight = height * 0.8;   // 80% of head height
    const hatWidth = width * 1.2;     // 120% of head width

    return {
      x: minX - (hatWidth - width) / 2, // Center the hat
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

    if (!canvas || !ctx || !facialLandmarks) return;

    // Clear canvas
    clearCanvas();

    // Calculate hat position
    const hatPosition = calculateHatPosition(facialLandmarks);
    if (!hatPosition) return;

    // Draw head landmarks (red dots)
    const headLandmarks = [10, 338, 151, 337];
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    headLandmarks.forEach(landmarkIndex => {
      const landmark = facialLandmarks[landmarkIndex];
      if (landmark) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          3,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });

    // Draw center point between head landmarks
    const centerX = headLandmarks.reduce((sum, index) => sum + facialLandmarks[index].x, 0) / headLandmarks.length;
    const centerY = headLandmarks.reduce((sum, index) => sum + facialLandmarks[index].y, 0) / headLandmarks.length;
    
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

    // Draw hat bounding box (green rectangle)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      hatPosition.x * canvas.width,
      hatPosition.y * canvas.height,
      hatPosition.width * canvas.width,
      hatPosition.height * canvas.height
    );

    // Draw hat label
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText(
      'Hat Position',
      hatPosition.x * canvas.width,
      hatPosition.y * canvas.height - 5
    );
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