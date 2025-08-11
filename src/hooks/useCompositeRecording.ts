/**
 * @fileoverview Composite recording hook for synchronized video and audio recording.
 *
 * Manages combined video and audio recording with synchronization,
 * supports multiple formats (WebM, MP4), and provides quality controls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  compositeRecordingService, 
  RecordingConfig, 
  RecordingState, 
  CompositeRecordingResult,
  RECORDING_FORMATS,
  RECORDING_QUALITY_PRESETS
} from '@/services/composite-recording.service';

/**
 * Composite recording hook state
 */
export interface CompositeRecordingHookState {
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  
  // Recording results
  videoBlob: Blob | null;
  audioBlob: Blob | null;
  compositeBlob: Blob | null;
  
  // Synchronization data
  syncData: {
    audioTimestamp: number;
    videoTimestamp: number;
    drift: number;
    latency: number;
    isInSync: boolean;
  } | null;
  
  // Configuration
  config: RecordingConfig;
  
  // Error state
  error: string | null;
  
  // Supported formats
  supportedFormats: string[];
}

/**
 * Composite recording hook actions
 */
export interface CompositeRecordingHookActions {
  // Recording controls
  startRecording: (videoStream: MediaStream, overlayCanvases?: HTMLCanvasElement[]) => Promise<void>;
  stopRecording: () => Promise<CompositeRecordingResult>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Configuration
  updateConfig: (config: Partial<RecordingConfig>) => void;
  
  // Utilities
  cleanup: () => void;
}

/**
 * Composite recording hook options
 */
export interface UseCompositeRecordingOptions {
  initialConfig?: Partial<RecordingConfig>;
  onStateChange?: (state: RecordingState) => void;
  onSyncUpdate?: (syncData: any) => void;
  onRecordingComplete?: (result: CompositeRecordingResult) => void;
  onError?: (error: string) => void;
}

/**
 * Composite recording hook return type
 */
export type UseCompositeRecordingReturn = [CompositeRecordingHookState, CompositeRecordingHookActions];

/**
 * Composite recording hook
 */
export const useCompositeRecording = (options: UseCompositeRecordingOptions = {}): UseCompositeRecordingReturn => {
  const {
    initialConfig = {},
    onStateChange,
    onSyncUpdate,
    onRecordingComplete,
    onError,
  } = options;

  // State
  const [state, setState] = useState<CompositeRecordingHookState>(() => ({
    isRecording: false,
    isPaused: false,
    duration: 0,
    videoBlob: null,
    audioBlob: null,
    compositeBlob: null,
    syncData: null,
    config: {
      format: 'WEBM',
      quality: 'MEDIUM',
      includeAudio: true,
      syncSettings: {
        latencyThreshold: 50,
        syncInterval: 100,
        maxDrift: 100,
      },
      ...initialConfig,
    },
    error: null,
    supportedFormats: compositeRecordingService.getSupportedFormats(),
  }));

  // Refs
  const stateChangeRef = useRef<((state: RecordingState) => void) | null>(null);
  const syncUpdateRef = useRef<((syncData: any) => void) | null>(null);

  /**
   * Handle state changes from the service
   */
  const handleStateChange = useCallback((serviceState: RecordingState) => {
    setState(prev => ({
      ...prev,
      isRecording: serviceState.isRecording,
      isPaused: serviceState.isPaused,
      duration: serviceState.duration,
      videoBlob: serviceState.videoBlob,
      audioBlob: serviceState.audioBlob,
      compositeBlob: serviceState.compositeBlob,
      syncData: serviceState.syncData,
      error: serviceState.error,
    }));

    onStateChange?.(serviceState);
  }, [onStateChange]);

  /**
   * Handle sync updates from the service
   */
  const handleSyncUpdate = useCallback((syncData: any) => {
    setState(prev => ({
      ...prev,
      syncData,
    }));

    onSyncUpdate?.(syncData);
  }, [onSyncUpdate]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async (
    videoStream: MediaStream, 
    overlayCanvases: HTMLCanvasElement[] = []
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await compositeRecordingService.startRecording(videoStream, overlayCanvases);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  }, [onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async (): Promise<CompositeRecordingResult> => {
    try {
      console.log('🛑 Hook: Stopping recording...');
      const result = await compositeRecordingService.stopRecording();
      console.log('✅ Hook: Recording stopped successfully:', result);
      
      // Update local state with the result
      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        duration: result.duration,
        videoBlob: result.videoBlob,
        audioBlob: result.audioBlob,
        compositeBlob: result.compositeBlob,
        error: null,
      }));
      
      onRecordingComplete?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Hook: Failed to stop recording:', errorMessage);
      
      // Update state with error
      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        error: errorMessage,
      }));
      
      onError?.(errorMessage);
      throw error;
    }
  }, [onRecordingComplete, onError]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback((): void => {
    try {
      compositeRecordingService.pauseRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback((): void => {
    try {
      compositeRecordingService.resumeRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((config: Partial<RecordingConfig>): void => {
    compositeRecordingService.updateConfig(config);
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  /**
   * Cleanup
   */
  const cleanup = useCallback((): void => {
    compositeRecordingService.cleanup();
  }, []);

  // Set up service callbacks
  useEffect(() => {
    // Store refs to avoid stale closures
    stateChangeRef.current = handleStateChange;
    syncUpdateRef.current = handleSyncUpdate;

    // Set up service callbacks
    compositeRecordingService.onStateChangeCallback(handleStateChange);
    compositeRecordingService.onSyncUpdateCallback(handleSyncUpdate);

    // Initialize state from service
    const serviceState = compositeRecordingService.getState();
    if (serviceState) {
      setState(prev => ({
        ...prev,
        isRecording: serviceState.isRecording,
        isPaused: serviceState.isPaused,
        duration: serviceState.duration,
        videoBlob: serviceState.videoBlob,
        audioBlob: serviceState.audioBlob,
        compositeBlob: serviceState.compositeBlob,
        syncData: serviceState.syncData,
        error: serviceState.error,
      }));
    }

    // Cleanup function
    return () => {
      compositeRecordingService.onStateChangeCallback(() => {});
      compositeRecordingService.onSyncUpdateCallback(() => {});
    };
  }, [handleStateChange, handleSyncUpdate]);

  // Update service config when state config changes
  useEffect(() => {
    compositeRecordingService.updateConfig(state.config);
  }, [state.config]);

  // Actions object
  const actions: CompositeRecordingHookActions = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    updateConfig,
    cleanup,
  };

  return [state, actions];
};

/**
 * Hook for recording format utilities
 */
export const useRecordingFormats = () => {
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);

  useEffect(() => {
    setSupportedFormats(compositeRecordingService.getSupportedFormats());
  }, []);

  return {
    supportedFormats,
    formats: RECORDING_FORMATS,
    qualityPresets: RECORDING_QUALITY_PRESETS,
  };
};

/**
 * Hook for recording synchronization
 */
export const useRecordingSync = () => {
  const [syncData, setSyncData] = useState<any>(null);

  useEffect(() => {
    const handleSyncUpdate = (data: any) => {
      setSyncData(data);
    };

    compositeRecordingService.onSyncUpdateCallback(handleSyncUpdate);

    return () => {
      compositeRecordingService.onSyncUpdateCallback(() => {});
    };
  }, []);

  return syncData;
}; 