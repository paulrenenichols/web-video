/**
 * @fileoverview Zustand store for facial tracking state management.
 *
 * Manages tracking initialization, status, landmarks, performance metrics,
 * and error handling for the MediaPipe face detection system.
 */

import { create } from 'zustand';
import type {
  TrackingState,
  FacialLandmarks,
  TrackingConfig,
} from '@/types/tracking';

interface TrackingStore extends TrackingState {
  // Actions
  setInitialized: (isInitialized: boolean) => void;
  setTracking: (isTracking: boolean) => void;
  setDetected: (isDetected: boolean) => void;
  setLandmarks: (landmarks: FacialLandmarks | null) => void;
  setConfidence: (confidence: number) => void;
  setError: (error: string | null) => void;
  setPerformance: (performance: TrackingState['performance']) => void;
  updateConfig: (config: Partial<TrackingConfig>) => void;
  reset: () => void;
}

const initialState: TrackingState = {
  isInitialized: false,
  isTracking: false,
  isDetected: false,
  landmarks: null,
  confidence: 0,
  error: null,
  performance: {
    fps: 0,
    latency: 0,
    accuracy: 0,
  },
};

export const useTrackingStore = create<TrackingStore>(set => ({
  ...initialState,

  setInitialized: (isInitialized: boolean) => {
    set({ isInitialized });
  },

  setTracking: (isTracking: boolean) => {
    set({ isTracking });
  },

  setDetected: (isDetected: boolean) => {
    set({ isDetected });
  },

  setLandmarks: (landmarks: FacialLandmarks | null) => {
    set({ landmarks });
  },

  setConfidence: (confidence: number) => {
    set({ confidence });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setPerformance: (performance: TrackingState['performance']) => {
    set({ performance });
  },

  updateConfig: (config: Partial<TrackingConfig>) => {
    // This would typically update the tracking service configuration
    // For now, we just store it in the state if needed
    console.log('Updating tracking config:', config);
  },

  reset: () => {
    set(initialState);
  },
}));
