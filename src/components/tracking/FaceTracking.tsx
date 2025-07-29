/**
 * @fileoverview Main face tracking component with basic visualization.
 *
 * Provides face bounding box overlay and basic tracking visualization
 * on top of the video feed. This is the foundation for more advanced
 * tracking features in later steps.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';

interface FaceTrackingProps {
  /** Whether tracking visualization is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Container className */
  className?: string;
}

export const FaceTracking: React.FC<FaceTrackingProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Get tracking state
  const {
    status,
    faceDetection,
    facialLandmarks,
    confidence,
    faceCount,
  } = useTrackingStore();

  /**
   * Draw face bounding box
   */
  const drawBoundingBox = useCallback((ctx: CanvasRenderingContext2D, detection: any) => {
    if (!detection.boundingBox || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate scale factors
    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    // Convert normalized coordinates to canvas coordinates
    const x = detection.boundingBox.x * scaleX;
    const y = detection.boundingBox.y * scaleY;
    const width = detection.boundingBox.width * scaleX;
    const height = detection.boundingBox.height * scaleY;

    // Draw bounding box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    ctx.setLineDash([]);

    // Draw confidence text
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.fillText(
      `${(confidence * 100).toFixed(1)}%`,
      x - width / 2,
      y - height / 2 - 5
    );
  }, [confidence, videoRef]);

  /**
   * Draw facial landmarks
   */
  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: any) => {
    if (!landmarks || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate scale factors
    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    // Draw key landmarks (simplified for Step 3)
    const keyLandmarks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Basic face outline
    
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;

    keyLandmarks.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility > 0.5) {
        const x = landmark.x * scaleX;
        const y = landmark.y * scaleY;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
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
   * Update canvas size to match video
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    // Get video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [videoRef]);

  /**
   * Render tracking visualization
   */
  const render = useCallback(() => {
    if (!isVisible || !canvasRef.current) {
      clearCanvas();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    clearCanvas();

    // Draw bounding box if face is detected
    if (status === 'detected' && faceDetection && faceDetection.detected) {
      drawBoundingBox(ctx, faceDetection);
    }

    // Draw landmarks if available
    if (facialLandmarks && facialLandmarks.landmarks.length > 0) {
      drawLandmarks(ctx, facialLandmarks.landmarks);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [isVisible, status, faceDetection, facialLandmarks, clearCanvas, drawBoundingBox, drawLandmarks]);

  // Handle canvas size updates
  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Handle rendering
  useEffect(() => {
    if (isVisible) {
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
  }, [isVisible, render, clearCanvas]);

  if (!isVisible) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    />
  );
}; 