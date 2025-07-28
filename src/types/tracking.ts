/**
 * @fileoverview TypeScript types and interfaces for facial tracking functionality.
 *
 * Defines types for MediaPipe Face Detection integration, facial landmarks,
 * tracking states, and performance metrics for the enhancement phase.
 */

export interface FacialLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface FacialLandmarks {
  landmarks: FacialLandmark[];
  faceInViewConfidence: number;
  faceBoundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: {
    x: number; // pitch
    y: number; // yaw
    z: number; // roll
  };
}

export interface TrackingState {
  isInitialized: boolean;
  isTracking: boolean;
  isDetected: boolean;
  landmarks: FacialLandmarks | null;
  confidence: number;
  error: string | null;
  performance: {
    fps: number;
    latency: number;
    accuracy: number;
  };
}

export interface TrackingConfig {
  modelComplexity: 0 | 1; // 0 = Lite, 1 = Full
  smoothLandmarks: boolean;
  enableSegmentation: boolean;
  smoothSegmentation: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  maxNumFaces: number;
}

export type TrackingError =
  | 'initialization-failed'
  | 'model-loading-failed'
  | 'tracking-failed'
  | 'performance-degraded'
  | 'not-supported'
  | 'unknown';

export interface TrackingMetrics {
  averageFPS: number;
  averageLatency: number;
  trackingAccuracy: number;
  detectionRate: number;
  falsePositives: number;
}

export interface FaceDetectionResult {
  success: boolean;
  landmarks: FacialLandmarks | null;
  error?: string;
  timestamp: number;
}
