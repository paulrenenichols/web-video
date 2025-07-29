/**
 * @fileoverview MediaPipe tracking types and interfaces.
 *
 * Defines the data structures for facial tracking, landmark detection,
 * and tracking state management.
 */

/**
 * Basic face detection result from MediaPipe
 */
export interface FaceDetection {
  /** Whether a face was detected */
  detected: boolean;
  /** Confidence score of the detection (0-1) */
  confidence: number;
  /** Bounding box of the detected face */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Timestamp of the detection */
  timestamp: number;
}

/**
 * Facial landmark point with position and visibility
 */
export interface LandmarkPoint {
  /** X coordinate (0-1 normalized) */
  x: number;
  /** Y coordinate (0-1 normalized) */
  y: number;
  /** Z coordinate (depth, 0-1 normalized) */
  z: number;
  /** Visibility score (0-1) */
  visibility?: number;
}

/**
 * Complete facial landmarks data (468 points)
 */
export interface FacialLandmarks {
  /** Array of 468 landmark points */
  landmarks: LandmarkPoint[];
  /** Overall confidence score */
  confidence: number;
  /** Timestamp of the detection */
  timestamp: number;
}

/**
 * Tracking status enumeration
 */
export enum TrackingStatus {
  /** No face detected */
  NOT_DETECTED = 'not_detected',
  /** Single face detected */
  DETECTED = 'detected',
  /** Multiple faces detected */
  MULTIPLE_FACES = 'multiple_faces',
  /** Tracking is initializing */
  INITIALIZING = 'initializing',
  /** Tracking error occurred */
  ERROR = 'error',
}

/**
 * MediaPipe initialization options
 */
export interface MediaPipeOptions {
  /** Whether to enable face mesh (468 landmarks) */
  enableFaceMesh?: boolean;
  /** Whether to enable face detection (basic) */
  enableFaceDetection?: boolean;
  /** Detection confidence threshold */
  minDetectionConfidence?: number;
  /** Tracking confidence threshold */
  minTrackingConfidence?: number;
}

/**
 * MediaPipe service state
 */
export interface MediaPipeState {
  /** Current tracking status */
  status: TrackingStatus;
  /** Latest face detection result */
  faceDetection: FaceDetection | null;
  /** Latest facial landmarks result */
  facialLandmarks: FacialLandmarks | null;
  /** Whether MediaPipe is initialized */
  isInitialized: boolean;
  /** Current error message if any */
  error: string | null;
  /** Number of faces currently detected */
  faceCount: number;
} 