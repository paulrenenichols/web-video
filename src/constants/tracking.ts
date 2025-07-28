/**
 * @fileoverview Tracking configuration constants for MediaPipe Face Detection.
 *
 * Defines default settings, performance thresholds, and MediaPipe
 * configuration options for facial tracking functionality.
 */

import type { TrackingConfig } from '@/types/tracking';

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  modelComplexity: 0, // Lite model for better performance
  smoothLandmarks: true,
  enableSegmentation: false, // Not needed for basic tracking
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  maxNumFaces: 1, // Focus on single face for overlay positioning
};

export const PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 15,
  TARGET_FPS: 30,
  MAX_LATENCY: 100, // milliseconds
  MIN_ACCURACY: 0.7,
  CONFIDENCE_THRESHOLD: 0.6,
} as const;

export const TRACKING_LANDMARKS = {
  // Key facial landmarks for overlay positioning
  LEFT_EYE: [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  ],
  RIGHT_EYE: [
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
    398,
  ],
  NOSE: [
    1, 2, 3, 4, 5, 6, 168, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 200, 199,
    175,
  ],
  MOUTH: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
  FACE_OUTLINE: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],
} as const;

export const TRACKING_ERROR_MESSAGES = {
  'initialization-failed': 'Failed to initialize facial tracking',
  'model-loading-failed': 'Failed to load tracking model',
  'tracking-failed': 'Facial tracking encountered an error',
  'performance-degraded': 'Tracking performance is degraded',
  'not-supported': 'Facial tracking is not supported in this browser',
  unknown: 'An unknown tracking error occurred',
} as const;

export const TRACKING_STATUS_MESSAGES = {
  INITIALIZING: 'Initializing facial tracking...',
  TRACKING: 'Tracking active',
  DETECTED: 'Face detected',
  NOT_DETECTED: 'No face detected',
  ERROR: 'Tracking error',
  DISABLED: 'Tracking disabled',
} as const;
