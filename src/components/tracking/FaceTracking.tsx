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
    console.log('🎯 drawBoundingBox called with:', detection);
    
    if (!detection.boundingBox) {
      console.log('❌ No bounding box data');
      return;
    }

    if (!videoRef.current) {
      console.log('❌ No video ref');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ No canvas ref');
      return;
    }

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Check if video dimensions are valid
    if (videoWidth === 0 || videoHeight === 0) {
      console.log('❌ Invalid video dimensions:', { videoWidth, videoHeight });
      return;
    }

    console.log('📐 Dimensions:', {
      video: { width: videoWidth, height: videoHeight },
      canvas: { width: canvasWidth, height: canvasHeight },
      boundingBox: detection.boundingBox
    });

    // Calculate scale factors
    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    // Convert normalized coordinates to canvas coordinates
    const x = detection.boundingBox.x * scaleX;
    const y = detection.boundingBox.y * scaleY;
    const width = detection.boundingBox.width * scaleX;
    const height = detection.boundingBox.height * scaleY;

    console.log('🎨 Drawing box at:', { x, y, width, height });

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
    
    if (!canvas || !video) {
      console.log('❌ Cannot update canvas size - missing canvas or video ref');
      return false;
    }

    // Wait for video to be ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ Video not ready yet, waiting...');
      return false;
    }

    // Get video display size
    const rect = video.getBoundingClientRect();
    
    // Check if we have valid display dimensions
    if (rect.width === 0 || rect.height === 0) {
      console.log('⏳ Video display not ready yet, waiting...');
      return false;
    }
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    console.log('📏 Canvas size updated:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      videoRect: rect,
      videoVideoWidth: video.videoWidth,
      videoVideoHeight: video.videoHeight
    });
    
    return true;
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

    // Check if canvas is properly sized
    if (canvas.width === 0 || canvas.height === 0) {
      console.log('⏳ Canvas not sized yet, trying to update...');
      const success = updateCanvasSize();
      if (!success) {
        // Try again next frame
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
    }

    // Clear previous frame
    clearCanvas();

    console.log('🎨 Rendering tracking visualization:', {
      isVisible,
      status,
      hasFaceDetection: !!faceDetection,
      hasLandmarks: !!(facialLandmarks && facialLandmarks.landmarks.length > 0),
      canvasSize: { width: canvas.width, height: canvas.height }
    });

    // Draw a test rectangle to verify canvas is working (temporary)
    // ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    // ctx.fillRect(10, 10, 100, 50);
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(10, 10, 100, 50);

    // Draw bounding box if face is detected
    if (status === 'detected' && faceDetection && faceDetection.detected) {
      console.log('📦 Drawing bounding box:', faceDetection);
      drawBoundingBox(ctx, faceDetection);
    }

    // Draw landmarks if available
    if (facialLandmarks && facialLandmarks.landmarks.length > 0) {
      console.log('📍 Drawing landmarks:', facialLandmarks.landmarks.length, 'points');
      drawLandmarks(ctx, facialLandmarks.landmarks);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [isVisible, status, faceDetection, facialLandmarks, clearCanvas, drawBoundingBox, drawLandmarks, updateCanvasSize]);

  // Handle canvas size updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      console.log('🎥 Video ready event fired');
      updateCanvasSize();
    };

    const handleResize = () => {
      updateCanvasSize();
    };

    // Listen for video ready events
    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);
    
    // Also try to update immediately
    updateCanvasSize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCanvasSize, videoRef]);

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
      style={{ 
        zIndex: 10
      }}
    />
  );
}; 