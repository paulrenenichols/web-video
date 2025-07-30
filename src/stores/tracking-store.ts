/**
 * @fileoverview Tracking store for facial tracking state management.
 *
 * Manages the state of facial tracking, including detection status,
 * confidence scores, and tracking data using Zustand.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TrackingStatus,
  FaceDetection,
  FacialLandmarks,
  MediaPipeState,
} from '@/types/tracking';

/**
 * Tracking store state interface
 */
interface TrackingState {
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
  /** Overall tracking confidence score */
  confidence: number;
  /** Whether tracking is active */
  isTracking: boolean;
  /** Timestamp of last update */
  lastUpdate: number | null;
}

/**
 * Tracking store actions interface
 */
interface TrackingActions {
  /** Set tracking status */
  setStatus: (status: TrackingStatus) => void;
  /** Update face detection data */
  updateFaceDetection: (detection: FaceDetection) => void;
  /** Update facial landmarks data */
  updateFacialLandmarks: (landmarks: FacialLandmarks) => void;
  /** Set MediaPipe initialization state */
  setInitialized: (initialized: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Update face count */
  setFaceCount: (count: number) => void;
  /** Update tracking confidence */
  setConfidence: (confidence: number) => void;
  /** Set tracking active state */
  setTracking: (tracking: boolean) => void;
  /** Reset tracking state */
  reset: () => void;
  /** Get current MediaPipe state */
  getMediaPipeState: () => MediaPipeState;
}

/**
 * Initial tracking state
 */
const initialState: TrackingState = {
  status: TrackingStatus.NOT_DETECTED,
  faceDetection: null,
  facialLandmarks: null,
  isInitialized: false,
  error: null,
  faceCount: 0,
  confidence: 0,
  isTracking: false,
  lastUpdate: null,
};

/**
 * Tracking store using Zustand
 */
export const useTrackingStore = create<TrackingState & TrackingActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Set tracking status
       */
      setStatus: (status: TrackingStatus) => {
        set({ status, lastUpdate: Date.now() });
      },

      /**
       * Update face detection data
       */
      updateFaceDetection: (detection: FaceDetection) => {
        const currentState = get();
        const newFaceCount = detection.detected ? 1 : 0;
        const newStatus = detection.detected 
          ? TrackingStatus.DETECTED 
          : TrackingStatus.NOT_DETECTED;

        set({
          faceDetection: detection,
          faceCount: newFaceCount,
          status: newStatus,
          confidence: detection.confidence,
          isTracking: detection.detected,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Update facial landmarks data
       */
      updateFacialLandmarks: (landmarks: FacialLandmarks) => {
        const currentState = get();
        
        set({
          facialLandmarks: landmarks,
          confidence: Math.max(currentState.confidence, landmarks.confidence),
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set MediaPipe initialization state
       */
      setInitialized: (initialized: boolean) => {
        set({ 
          isInitialized: initialized,
          status: initialized ? TrackingStatus.NOT_DETECTED : TrackingStatus.INITIALIZING,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ 
          error,
          status: error ? TrackingStatus.ERROR : TrackingStatus.NOT_DETECTED,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Update face count
       */
      setFaceCount: (count: number) => {
        const currentState = get();
        let newStatus = currentState.status;

        if (count === 0) {
          newStatus = TrackingStatus.NOT_DETECTED;
        } else if (count === 1) {
          newStatus = TrackingStatus.DETECTED;
        } else {
          newStatus = TrackingStatus.MULTIPLE_FACES;
        }

        set({
          faceCount: count,
          status: newStatus,
          isTracking: count > 0,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Update tracking confidence
       */
      setConfidence: (confidence: number) => {
        set({ 
          confidence,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set tracking active state
       */
      setTracking: (tracking: boolean) => {
        set({ 
          isTracking: tracking,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Reset tracking state
       */
      reset: () => {
        set(initialState);
      },

      /**
       * Get current MediaPipe state
       */
      getMediaPipeState: (): MediaPipeState => {
        const state = get();
        return {
          status: state.status,
          faceDetection: state.faceDetection,
          facialLandmarks: state.facialLandmarks,
          isInitialized: state.isInitialized,
          error: state.error,
          faceCount: state.faceCount,
        };
      },
    }),
    {
      name: 'tracking-store',
    }
  )
); 