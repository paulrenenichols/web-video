/**
 * @fileoverview Tracking utilities for facial landmark analysis and confidence scoring.
 *
 * Provides utility functions for analyzing facial landmarks, calculating confidence scores,
 * and processing tracking data.
 */

import { LandmarkPoint, FacialLandmarks } from '@/types/tracking';

/**
 * Calculate confidence score based on landmark visibility and distribution
 */
export function calculateLandmarkConfidence(landmarks: LandmarkPoint[]): number {
  if (landmarks.length === 0) return 0;

  // Calculate average visibility
  const avgVisibility = landmarks.reduce((sum, landmark) => sum + (landmark.visibility || 0), 0) / landmarks.length;
  
  // Calculate visibility distribution (how many landmarks are well-visible)
  const wellVisibleCount = landmarks.filter(landmark => (landmark.visibility || 0) > 0.7).length;
  const visibilityRatio = wellVisibleCount / landmarks.length;
  
  // Calculate spatial distribution (how well landmarks are spread across the face)
  const xCoords = landmarks.map(l => l.x);
  const yCoords = landmarks.map(l => l.y);
  const xRange = Math.max(...xCoords) - Math.min(...xCoords);
  const yRange = Math.max(...yCoords) - Math.min(...yCoords);
  const spatialScore = Math.min(xRange + yRange, 1.0); // Normalize to 0-1
  
  // Combine scores (weighted average)
  const confidence = (avgVisibility * 0.4) + (visibilityRatio * 0.4) + (spatialScore * 0.2);
  
  return Math.min(confidence, 1.0);
}

/**
 * Get key facial landmarks for specific features
 */
export function getKeyLandmarks(landmarks: LandmarkPoint[]): {
  eyes: number[];
  nose: number[];
  mouth: number[];
  faceOutline: number[];
} {
  // MediaPipe FaceMesh landmark indices for key features
  return {
    // Eyes (left and right)
    eyes: [
      // Left eye
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
      // Right eye
      362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398
    ],
    // Nose
    nose: [1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    // Mouth (full mouth including upper lip, lower lip, and corners)
    mouth: [
      // Upper lip outline
      0, 267, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      // Lower lip outline  
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 78,
      // Mouth corners and edges
      61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      // Inner mouth contour
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 78,
      // Additional mouth landmarks for better coverage
      0, 267, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308
    ],
    // Face outline
    faceOutline: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ]
  };
}

/**
 * Calculate face orientation based on landmark positions
 */
export function calculateFaceOrientation(landmarks: LandmarkPoint[]): {
  yaw: number; // Left-right rotation
  pitch: number; // Up-down rotation
  roll: number; // Tilt rotation
} {
  if (landmarks.length < 468) return { yaw: 0, pitch: 0, roll: 0 };

  // Use key landmarks for orientation calculation
  const leftEye = landmarks[33]; // Left eye center
  const rightEye = landmarks[263]; // Right eye center
  const nose = landmarks[1]; // Nose tip
  
  if (!leftEye || !rightEye || !nose) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // Calculate roll (tilt) from eye positions
  const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const roll = (eyeAngle * 180) / Math.PI;

  // Calculate yaw (left-right) from eye distance and nose position
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
  );
  const expectedEyeDistance = 0.15; // Normalized expected distance
  const yaw = ((eyeDistance - expectedEyeDistance) / expectedEyeDistance) * 30; // Rough approximation

  // Calculate pitch (up-down) from nose position relative to eyes
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const pitch = ((nose.y - eyeCenterY) / 0.1) * 30; // Rough approximation

  return {
    yaw: Math.max(-45, Math.min(45, yaw)),
    pitch: Math.max(-30, Math.min(30, pitch)),
    roll: Math.max(-30, Math.min(30, roll))
  };
}

/**
 * Check if landmarks indicate a stable face detection
 */
export function isStableDetection(landmarks: LandmarkPoint[], minVisibleRatio: number = 0.7): boolean {
  if (landmarks.length === 0) return false;
  
  const visibleCount = landmarks.filter(landmark => (landmark.visibility || 0) > 0.5).length;
  const visibleRatio = visibleCount / landmarks.length;
  
  return visibleRatio >= minVisibleRatio;
}

/**
 * Get landmark statistics for debugging and analysis
 */
export function getLandmarkStats(landmarks: LandmarkPoint[]): {
  totalCount: number;
  visibleCount: number;
  avgVisibility: number;
  minVisibility: number;
  maxVisibility: number;
  confidence: number;
} {
  if (landmarks.length === 0) {
    return {
      totalCount: 0,
      visibleCount: 0,
      avgVisibility: 0,
      minVisibility: 0,
      maxVisibility: 0,
      confidence: 0
    };
  }

  const visibilities = landmarks.map(l => l.visibility || 0);
  const visibleCount = visibilities.filter(v => v > 0.5).length;
  
  return {
    totalCount: landmarks.length,
    visibleCount,
    avgVisibility: visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length,
    minVisibility: Math.min(...visibilities),
    maxVisibility: Math.max(...visibilities),
    confidence: calculateLandmarkConfidence(landmarks)
  };
} 