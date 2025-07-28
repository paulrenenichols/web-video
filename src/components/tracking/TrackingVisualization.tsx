/**
 * @fileoverview Tracking visualization component for facial landmarks.
 *
 * Displays facial feature outlines, landmarks, and tracking information
 * on the video feed to provide visual feedback for face detection.
 */

import React, { useEffect, useRef } from 'react';
import type { FacialLandmarks } from '@/types/tracking';
import { TRACKING_LANDMARKS } from '@/constants/tracking';

interface TrackingVisualizationProps {
  landmarks: FacialLandmarks;
  isDetected: boolean;
  confidence: number;
  performance: {
    fps: number;
    latency: number;
    accuracy: number;
  };
}

export const TrackingVisualization: React.FC<TrackingVisualizationProps> = ({
  landmarks,
  isDetected,
  confidence,
  performance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * @description Draw facial landmarks and outlines on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDetected) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set drawing styles
    ctx.strokeStyle = '#00ff00';
    ctx.fillStyle = '#00ff00';
    ctx.lineWidth = 2;

    // Draw face outline
    drawFaceOutline(ctx, landmarks);

    // Draw key facial features
    drawFacialFeatures(ctx, landmarks);

    // Draw confidence indicator
    drawConfidenceIndicator(ctx, confidence);

    // Draw performance metrics
    drawPerformanceMetrics(ctx, performance);
  }, [landmarks, isDetected, confidence, performance]);

  /**
   * @description Draw face outline using face outline landmarks
   */
  const drawFaceOutline = (
    ctx: CanvasRenderingContext2D,
    landmarks: FacialLandmarks
  ): void => {
    const outlinePoints = TRACKING_LANDMARKS.FACE_OUTLINE.map(
      index => landmarks.landmarks[index]
    );

    if (outlinePoints.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(outlinePoints[0].x, outlinePoints[0].y);

    for (let i = 1; i < outlinePoints.length; i++) {
      ctx.lineTo(outlinePoints[i].x, outlinePoints[i].y);
    }

    ctx.closePath();
    ctx.stroke();
  };

  /**
   * @description Draw key facial features (eyes, nose, mouth)
   */
  const drawFacialFeatures = (
    ctx: CanvasRenderingContext2D,
    landmarks: FacialLandmarks
  ): void => {
    // Draw left eye
    drawFeature(
      ctx,
      TRACKING_LANDMARKS.LEFT_EYE.map(index => landmarks.landmarks[index]),
      '#ff6b6b'
    );

    // Draw right eye
    drawFeature(
      ctx,
      TRACKING_LANDMARKS.RIGHT_EYE.map(index => landmarks.landmarks[index]),
      '#4ecdc4'
    );

    // Draw nose
    drawFeature(
      ctx,
      TRACKING_LANDMARKS.NOSE.map(index => landmarks.landmarks[index]),
      '#45b7d1'
    );

    // Draw mouth
    drawFeature(
      ctx,
      TRACKING_LANDMARKS.MOUTH.map(index => landmarks.landmarks[index]),
      '#96ceb4'
    );
  };

  /**
   * @description Draw a facial feature with given color
   */
  const drawFeature = (
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    color: string
  ): void => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();

    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  /**
   * @description Draw confidence indicator
   */
  const drawConfidenceIndicator = (
    ctx: CanvasRenderingContext2D,
    confidence: number
  ): void => {
    const canvas = ctx.canvas;
    const x = canvas.width - 100;
    const y = 20;
    const width = 80;
    const height = 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);

    // Confidence bar
    const confidenceWidth = confidence * width;
    ctx.fillStyle =
      confidence > 0.7 ? '#00ff00' : confidence > 0.4 ? '#ffff00' : '#ff0000';
    ctx.fillRect(x, y, confidenceWidth, height);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.round(confidence * 100)}%`, x, y + height + 15);
  };

  /**
   * @description Draw performance metrics
   */
  const drawPerformanceMetrics = (
    ctx: CanvasRenderingContext2D,
    performance: {
      fps: number;
      latency: number;
      accuracy: number;
    }
  ): void => {
    const canvas = ctx.canvas;
    const x = 10;
    const y = canvas.height - 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 150, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`FPS: ${Math.round(performance.fps)}`, x + 10, y + 20);
    ctx.fillText(
      `Latency: ${Math.round(performance.latency)}ms`,
      x + 10,
      y + 35
    );
    ctx.fillText(
      `Accuracy: ${Math.round(performance.accuracy * 100)}%`,
      x + 10,
      y + 50
    );
  };

  if (!isDetected) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
