/**
 * @fileoverview Audio recording and management hook.
 *
 * Manages microphone access, audio recording, synchronization,
 * and audio processing with video streams.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioService, AudioServiceState, AudioServiceCallback, AUDIO_EVENTS } from '@/services/audio.service';
import { AudioConfig, AUDIO_STATES, AUDIO_ERRORS } from '@/config/audio';
import { AudioLevel, AudioAnalysis, AudioSyncData } from '@/utils/audio';

/**
 * Audio hook state
 */
export interface AudioHookState {
  // Service state
  state: AudioServiceState;
  
  // Audio levels and analysis
  levels: AudioLevel | null;
  analysis: AudioAnalysis | null;
  syncData: AudioSyncData | null;
  
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  
  // Error state
  error: string | null;
  
  // Configuration
  config: AudioConfig;
}

/**
 * Audio hook actions
 */
export interface AudioHookActions {
  // Microphone access
  requestMicrophoneAccess: () => Promise<void>;
  
  // Recording controls
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Monitoring
  startMonitoring: () => void;
  stopMonitoring: () => void;
  
  // Synchronization
  synchronizeWithVideo: (videoTimestamp: number) => void;
  
  // Configuration
  updateConfig: (config: Partial<AudioConfig>) => void;
  
  // Utilities
  getRecordedAudio: () => Blob | null;
  cleanup: () => void;
}

/**
 * Audio hook options
 */
export interface UseAudioOptions {
  autoRequestAccess?: boolean;
  autoStartMonitoring?: boolean;
  initialConfig?: Partial<AudioConfig>;
  onStateChange?: (state: AudioServiceState) => void;
  onLevelUpdate?: (levels: AudioLevel) => void;
  onAnalysisUpdate?: (analysis: AudioAnalysis) => void;
  onSyncUpdate?: (syncData: AudioSyncData) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: string) => void;
}

/**
 * Audio hook return type
 */
export type UseAudioReturn = [AudioHookState, AudioHookActions];

/**
 * Audio recording and management hook
 */
export const useAudio = (options: UseAudioOptions = {}): UseAudioReturn => {
  const {
    autoRequestAccess = false,
    autoStartMonitoring = false,
    initialConfig = {},
    onStateChange,
    onLevelUpdate,
    onAnalysisUpdate,
    onSyncUpdate,
    onRecordingStart,
    onRecordingStop,
    onError,
  } = options;

  // State
  const [state, setState] = useState<AudioHookState>(() => ({
    state: audioService.getState(),
    levels: null,
    analysis: null,
    syncData: null,
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    config: { ...audioService.getState().config, ...initialConfig },
  }));

  // Refs
  const callbackRef = useRef<AudioServiceCallback | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Create audio service callback
   */
  const createCallback = useCallback((): AudioServiceCallback => {
    return (event: keyof typeof AUDIO_EVENTS, data: any) => {
      switch (event) {
        case AUDIO_EVENTS.STATE_CHANGED:
          setState(prev => ({
            ...prev,
            state: data,
            error: data.error,
          }));
          onStateChange?.(data);
          break;

        case AUDIO_EVENTS.LEVEL_UPDATED:
          setState(prev => ({
            ...prev,
            levels: data,
          }));
          onLevelUpdate?.(data);
          break;

        case AUDIO_EVENTS.ANALYSIS_UPDATED:
          setState(prev => ({
            ...prev,
            analysis: data,
          }));
          onAnalysisUpdate?.(data);
          break;

        case AUDIO_EVENTS.SYNC_UPDATED:
          setState(prev => ({
            ...prev,
            syncData: data,
          }));
          onSyncUpdate?.(data);
          break;

        case AUDIO_EVENTS.RECORDING_STARTED:
          setState(prev => ({
            ...prev,
            isRecording: true,
            isPaused: false,
            duration: 0,
          }));
          onRecordingStart?.();
          break;

        case AUDIO_EVENTS.RECORDING_STOPPED:
          setState(prev => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            duration: data.duration,
          }));
          onRecordingStop?.();
          break;

        case AUDIO_EVENTS.RECORDING_PAUSED:
          setState(prev => ({
            ...prev,
            isPaused: true,
          }));
          break;

        case AUDIO_EVENTS.RECORDING_RESUMED:
          setState(prev => ({
            ...prev,
            isPaused: false,
          }));
          break;

        case AUDIO_EVENTS.ERROR_OCCURRED:
          setState(prev => ({
            ...prev,
            error: data,
          }));
          onError?.(data);
          break;
      }
    };
  }, [onStateChange, onLevelUpdate, onAnalysisUpdate, onSyncUpdate, onRecordingStart, onRecordingStop, onError]);

  /**
   * Request microphone access
   */
  const requestMicrophoneAccess = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await audioService.requestMicrophoneAccess();
      
      // Auto-start monitoring if enabled
      if (autoStartMonitoring) {
        audioService.startMonitoring();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  }, [autoStartMonitoring, onError]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await audioService.startRecording();
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
  const stopRecording = useCallback((): void => {
    try {
      audioService.stopRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback((): void => {
    try {
      audioService.pauseRecording();
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
      audioService.resumeRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback((): void => {
    try {
      audioService.startMonitoring();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback((): void => {
    // Note: Audio service doesn't have a direct stopMonitoring method
    // This would need to be implemented in the service
    console.log('Audio monitoring stopped');
  }, []);

  /**
   * Synchronize with video
   */
  const synchronizeWithVideo = useCallback((videoTimestamp: number): void => {
    audioService.synchronizeWithVideo(videoTimestamp);
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((config: Partial<AudioConfig>): void => {
    audioService.updateConfig(config);
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  /**
   * Get recorded audio
   */
  const getRecordedAudio = useCallback((): Blob | null => {
    return audioService.getRecordedAudio();
  }, []);

  /**
   * Cleanup
   */
  const cleanup = useCallback((): void => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    audioService.cleanup();
  }, []);

  // Set up audio service event listener
  useEffect(() => {
    const callback = createCallback();
    callbackRef.current = callback;
    
    audioService.addEventListener(callback);

    // Auto-request microphone access if enabled
    if (autoRequestAccess) {
      requestMicrophoneAccess().catch(console.error);
    }

    // Cleanup function
    const cleanupFn = () => {
      if (callbackRef.current) {
        audioService.removeEventListener(callbackRef.current);
      }
    };

    cleanupRef.current = cleanupFn;

    return cleanupFn;
  }, [autoRequestAccess, createCallback, requestMicrophoneAccess]);

  // Update state when service state changes
  useEffect(() => {
    const serviceState = audioService.getState();
    setState(prev => ({
      ...prev,
      state: serviceState,
      isRecording: serviceState.recording.isRecording,
      isPaused: serviceState.recording.isPaused,
      duration: serviceState.recording.duration,
      error: serviceState.error,
    }));
  }, []);

  // Actions object
  const actions: AudioHookActions = {
    requestMicrophoneAccess,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    startMonitoring,
    stopMonitoring,
    synchronizeWithVideo,
    updateConfig,
    getRecordedAudio,
    cleanup,
  };

  return [state, actions];
};

/**
 * Hook for audio level monitoring
 */
export const useAudioLevels = (): AudioLevel | null => {
  const [levels, setLevels] = useState<AudioLevel | null>(null);

  useEffect(() => {
    const callback: AudioServiceCallback = (event, data) => {
      if (event === AUDIO_EVENTS.LEVEL_UPDATED) {
        setLevels(data);
      }
    };

    audioService.addEventListener(callback);

    return () => {
      audioService.removeEventListener(callback);
    };
  }, []);

  return levels;
};

/**
 * Hook for audio analysis
 */
export const useAudioAnalysis = (): AudioAnalysis | null => {
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);

  useEffect(() => {
    const callback: AudioServiceCallback = (event, data) => {
      if (event === AUDIO_EVENTS.ANALYSIS_UPDATED) {
        setAnalysis(data);
      }
    };

    audioService.addEventListener(callback);

    return () => {
      audioService.removeEventListener(callback);
    };
  }, []);

  return analysis;
};

/**
 * Hook for audio synchronization
 */
export const useAudioSync = (): AudioSyncData | null => {
  const [syncData, setSyncData] = useState<AudioSyncData | null>(null);

  useEffect(() => {
    const callback: AudioServiceCallback = (event, data) => {
      if (event === AUDIO_EVENTS.SYNC_UPDATED) {
        setSyncData(data);
      }
    };

    audioService.addEventListener(callback);

    return () => {
      audioService.removeEventListener(callback);
    };
  }, []);

  return syncData;
}; 