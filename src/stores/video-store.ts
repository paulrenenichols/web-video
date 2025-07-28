/**
 * @fileoverview Basic video state management using Zustand.
 *
 * Manages camera state, basic video configuration, and error states.
 * Foundation for more complex state management in later phases.
 */

import { create } from 'zustand';
import type { CameraState } from '@/types/video';

interface VideoStore extends CameraState {
  // Actions
  setStream: (stream: MediaStream | null) => void;
  setIsActive: (isActive: boolean) => void;
  setDevices: (devices: CameraState['devices']) => void;
  setSelectedDeviceId: (deviceId: string | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialState: CameraState = {
  isActive: false,
  stream: null,
  devices: [],
  selectedDeviceId: null,
  error: null,
  isLoading: false,
};

export const useVideoStore = create<VideoStore>(set => ({
  ...initialState,

  setStream: stream => set({ stream }),

  setIsActive: isActive => set({ isActive }),

  setDevices: devices => set({ devices }),

  setSelectedDeviceId: selectedDeviceId => set({ selectedDeviceId }),

  setError: error => set({ error }),

  setIsLoading: isLoading => set({ isLoading }),

  reset: () => set(initialState),
}));
