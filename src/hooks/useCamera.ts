/**
 * @fileoverview Camera access hook for managing camera state and functionality.
 *
 * Provides camera permissions, device enumeration, and stream management.
 * Handles error states and device selection.
 */

import { useState, useEffect, useCallback } from 'react';
import { MediaService } from '@/services/media.service';
import type { CameraState, VideoConfig } from '@/types/video';

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    stream: null,
    devices: [],
    selectedDeviceId: null,
    error: null,
    isLoading: false,
  });

  /**
   * Request camera permissions and update state.
   */
  const requestPermissions = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissions = await MediaService.requestPermissions();

      if (permissions.camera === 'denied') {
        setState(prev => ({
          ...prev,
          error: 'Camera permission denied. Please enable camera access.',
          isLoading: false,
        }));
        return;
      }

      // Get available devices
      const devices = await MediaService.getCameraDevices();
      setState(prev => ({
        ...prev,
        devices,
        selectedDeviceId: devices[0]?.deviceId || null,
        isLoading: false,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to request camera permissions.',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Start camera stream with selected device.
   */
  const startCamera = useCallback(
    async (deviceId?: string, config?: Partial<VideoConfig>): Promise<void> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Stop existing stream if any
        if (state.stream) {
          MediaService.stopStream(state.stream);
        }

        const stream = await MediaService.getCameraStream(deviceId, config);

        setState(prev => ({
          ...prev,
          stream,
          isActive: true,
          selectedDeviceId: deviceId || prev.selectedDeviceId,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start camera';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    },
    [state.stream]
  );

  /**
   * Stop camera stream.
   */
  const stopCamera = useCallback((): void => {
    if (state.stream) {
      MediaService.stopStream(state.stream);
    }

    setState(prev => ({
      ...prev,
      stream: null,
      isActive: false,
    }));
  }, [state.stream]);

  /**
   * Switch to a different camera device.
   */
  const switchCamera = useCallback(
    async (deviceId: string): Promise<void> => {
      if (deviceId === state.selectedDeviceId) return;

      await startCamera(deviceId);
    },
    [state.selectedDeviceId, startCamera]
  );

  /**
   * Refresh available camera devices.
   */
  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      const devices = await MediaService.getCameraDevices();
      setState(prev => ({
        ...prev,
        devices,
        selectedDeviceId: devices[0]?.deviceId || null,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh camera devices.',
      }));
    }
  }, []);

  /**
   * Clear error state.
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        MediaService.stopStream(state.stream);
      }
    };
  }, [state.stream]);

  return {
    ...state,
    requestPermissions,
    startCamera,
    stopCamera,
    switchCamera,
    refreshDevices,
    clearError,
  };
};
