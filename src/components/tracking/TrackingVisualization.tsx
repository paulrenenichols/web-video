/**
 * @fileoverview Enhanced tracking visualization component.
 *
 * Provides detailed facial feature outlines, labels, and accuracy indicators
 * for advanced face tracking visualization.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';
import { getKeyLandmarks, calculateFaceOrientation, isStableDetection } from '@/utils/tracking';

interface TrackingVisualizationProps {
  /** Whether visualization is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
}

export const TrackingVisualization: React.FC<TrackingVisualizationProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Get tracking state
  const { status, faceDetection, facialLandmarks, confidence, faceCount } =
    useTrackingStore();

  /**
   * Draw facial feature outlines
   */
  const drawFeatureOutlines = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Get key landmarks
      const keyLandmarksData = getKeyLandmarks(landmarks);
      const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

      // Set up drawing styles
      ctx.lineWidth = 2;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      // Draw face outline
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';
      drawLandmarkPath(ctx, keyLandmarksData.faceOutline, landmarks, canvasWidth, canvasHeight, isMirrored);
      drawFeatureLabel(ctx, 'Face', keyLandmarksData.faceOutline, landmarks, canvasWidth, canvasHeight, isMirrored);

      // Draw eyes
      ctx.strokeStyle = '#ff6b6b';
      ctx.fillStyle = '#ff6b6b';
      drawLandmarkPath(ctx, keyLandmarksData.eyes, landmarks, canvasWidth, canvasHeight, isMirrored);
      drawFeatureLabel(ctx, 'Eyes', keyLandmarksData.eyes, landmarks, canvasWidth, canvasHeight, isMirrored);

      // Draw nose
      ctx.strokeStyle = '#4ecdc4';
      ctx.fillStyle = '#4ecdc4';
      drawLandmarkPath(ctx, keyLandmarksData.nose, landmarks, canvasWidth, canvasHeight, isMirrored);
      drawFeatureLabel(ctx, 'Nose', keyLandmarksData.nose, landmarks, canvasWidth, canvasHeight, isMirrored);

      // Draw mouth
      ctx.strokeStyle = '#ffd93d';
      ctx.fillStyle = '#ffd93d';
      drawLandmarkPath(ctx, keyLandmarksData.mouth, landmarks, canvasWidth, canvasHeight, isMirrored);
      drawFeatureLabel(ctx, 'Mouth', keyLandmarksData.mouth, landmarks, canvasWidth, canvasHeight, isMirrored);
    },
    [videoRef]
  );

  /**
   * Draw a path connecting landmarks
   */
  const drawLandmarkPath = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarkIndices: number[],
    landmarks: any[],
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ) => {
    ctx.beginPath();
    let firstPoint = true;

    landmarkIndices.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility > 0.5) {
        let x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;

        if (isMirrored) {
          x = canvasWidth - x;
        }

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });

    ctx.stroke();
  }, []);

  /**
   * Draw feature label
   */
  const drawFeatureLabel = useCallback((
    ctx: CanvasRenderingContext2D,
    label: string,
    landmarkIndices: number[],
    landmarks: any[],
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ) => {
    // Find center point of the feature
    let centerX = 0;
    let centerY = 0;
    let visibleCount = 0;

    landmarkIndices.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility > 0.5) {
        let x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;

        if (isMirrored) {
          x = canvasWidth - x;
        }

        centerX += x;
        centerY += y;
        visibleCount++;
      }
    });

    if (visibleCount > 0) {
      centerX /= visibleCount;
      centerY /= visibleCount;

      // Draw label background
      const textMetrics = ctx.measureText(label);
      const padding = 4;
      const labelWidth = textMetrics.width + padding * 2;
      const labelHeight = 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(centerX - labelWidth / 2, centerY - labelHeight - 5, labelWidth, labelHeight);

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, centerX, centerY - 5);
    }
  }, []);

  /**
   * Draw accuracy indicator
   */
  const drawAccuracyIndicator = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Draw accuracy bar
      const barWidth = 200;
      const barHeight = 8;
      const barX = 20;
      const barY = 20;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Accuracy fill
      const accuracyWidth = (confidence || 0) * barWidth;
      const accuracyColor = confidence > 0.8 ? '#00ff00' : confidence > 0.6 ? '#ffff00' : '#ff0000';
      ctx.fillStyle = accuracyColor;
      ctx.fillRect(barX, barY, accuracyWidth, barHeight);

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Accuracy: ${Math.round((confidence || 0) * 100)}%`, barX, barY - 5);
    },
    [confidence]
  );

  /**
   * Draw face orientation indicator
   */
  const drawOrientationIndicator = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      if (!canvasRef.current || landmarks.length === 0) return;

      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const orientation = calculateFaceOrientation(landmarks);
      const isStable = isStableDetection(landmarks);

      // Draw orientation info
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      
      const infoX = 20;
      const infoY = 50;
      const lineHeight = 16;

      ctx.fillText(`Yaw: ${orientation.yaw.toFixed(1)}°`, infoX, infoY);
      ctx.fillText(`Pitch: ${orientation.pitch.toFixed(1)}°`, infoX, infoY + lineHeight);
      ctx.fillText(`Roll: ${orientation.roll.toFixed(1)}°`, infoX, infoY + lineHeight * 2);
      ctx.fillText(`Stable: ${isStable ? 'Yes' : 'No'}`, infoX, infoY + lineHeight * 3);
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
   * Main render function
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas();

    // Update canvas size if needed
    if (!updateCanvasSize()) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    // Draw enhanced visualization if face is detected
    if (status === 'detected' && facialLandmarks && facialLandmarks.landmarks.length > 0) {
      drawFeatureOutlines(ctx, facialLandmarks.landmarks);
      drawAccuracyIndicator(ctx);
      drawOrientationIndicator(ctx, facialLandmarks.landmarks);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    isVisible,
    status,
    facialLandmarks,
    clearCanvas,
    updateCanvasSize,
    drawFeatureOutlines,
    drawAccuracyIndicator,
    drawOrientationIndicator,
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
        zIndex: 15,
      }}
    />
  );
}; 