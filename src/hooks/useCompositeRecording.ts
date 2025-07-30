/**
 * @fileoverview Composite video recording functionality hook.
 *
 * Manages MediaRecorder API with composite video stream that includes
 * both camera feed and overlay rendering for recorded videos.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CompositeRecordingService } from '@/services/composite-recording.service';
import { FileService } from '@/services/file.service';
import type {
  RecordingState,
  RecordingConfig,
  RecordingResult,
} from '@/types/recording';

export const useCompositeRecording = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    elapsedTime: 0,
    startTime: null,
    recordingBlob: null,
    error: null,
    config: {
      quality: 0.9,
      format: 'webm',
      includeAudio: false,
      width: 1280,
      height: 720,
      frameRate: 30,
    },
  });

  const recordingServiceRef = useRef<CompositeRecordingService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize recording service.
   */
  const initializeRecording = useCallback(() => {
    if (!CompositeRecordingService.isSupported()) {
      setState(prev => ({
        ...prev,
        error: 'Recording is not supported in this browser',
      }));
      return false;
    }

    if (!recordingServiceRef.current) {
      recordingServiceRef.current = new CompositeRecordingService();
    }
    return true;
  }, []);

  /**
   * Start recording with composite video stream including overlays.
   */
  const startRecording = useCallback(
    async (
      videoElement: HTMLVideoElement,
      overlayCanvases: HTMLCanvasElement[]
    ): Promise<void> => {
      if (!initializeRecording()) return;

      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        elapsedTime: 0,
        startTime: Date.now(),
        recordingBlob: null,
        error: null,
      }));

      try {
        await recordingServiceRef.current!.startRecording(
          videoElement,
          overlayCanvases,
          state.config
        );

        // Start timer
        timerRef.current = setInterval(() => {
          setState(prev => ({
            ...prev,
            elapsedTime: prev.startTime
              ? (Date.now() - prev.startTime) / 1000
              : 0,
          }));
        }, 100);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start recording';
        setState(prev => ({
          ...prev,
          isRecording: false,
          startTime: null,
          error: errorMessage,
        }));
      }
    },
    [initializeRecording, state.config]
  );

  /**
   * Stop recording and process the result.
   */
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recordingServiceRef.current || !state.isRecording) {
      return null;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
    }));

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop recording
      const blob = await recordingServiceRef.current.stopRecording();
      const duration = state.elapsedTime;
      const size = blob.size;

      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        recordingBlob: blob,
        startTime: null,
      }));

      return {
        success: true,
        blob,
        filename: FileService.generateDefaultFilename(state.config.format),
        duration,
        size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to stop recording';
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        startTime: null,
        error: errorMessage,
      }));
      return {
        success: false,
        blob: null,
        filename: '',
        duration: 0,
        size: 0,
        error: errorMessage,
      };
    }
  }, [state.isRecording, state.elapsedTime, state.config.format]);

  /**
   * Download the recorded video.
   */
  const downloadRecording = useCallback(async (): Promise<void> => {
    if (!state.recordingBlob) {
      setState(prev => ({
        ...prev,
        error: 'No recording available to download',
      }));
      return;
    }

    try {
      const defaultFilename = FileService.generateDefaultFilename(
        state.config.format
      );
      const filename = FileService.promptForFilename(defaultFilename);

      if (!filename) {
        return; // User cancelled
      }

      FileService.downloadFile(state.recordingBlob, {
        filename,
        format: state.config.format,
        quality: state.config.quality,
      });

      // Clear the recording blob after successful download
      setState(prev => ({
        ...prev,
        recordingBlob: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to download recording';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [state.recordingBlob, state.config.format, state.config.quality]);

  /**
   * Clear the current recording.
   */
  const clearRecording = useCallback((): void => {
    setState(prev => ({
      ...prev,
      recordingBlob: null,
      error: null,
    }));
  }, []);

  /**
   * Clear any recording errors.
   */
  const clearError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Update recording configuration.
   */
  const updateConfig = useCallback((config: Partial<RecordingConfig>): void => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  /**
   * Get current recording state.
   */
  const getRecordingState = useCallback((): 'inactive' | 'recording' | 'paused' => {
    return recordingServiceRef.current?.getRecordingState() || 'inactive';
  }, []);

  /**
   * Pause recording (if supported).
   */
  const pauseRecording = useCallback((): void => {
    recordingServiceRef.current?.pauseRecording();
  }, []);

  /**
   * Resume recording (if supported).
   */
  const resumeRecording = useCallback((): void => {
    recordingServiceRef.current?.resumeRecording();
  }, []);

  /**
   * Clean up resources on unmount.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      recordingServiceRef.current?.cleanup();
    };
  }, []);

  return {
    // State
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    elapsedTime: state.elapsedTime,
    recordingBlob: state.recordingBlob,
    error: state.error,
    config: state.config,

    // Actions
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording,
    clearError,
    updateConfig,
    getRecordingState,
    pauseRecording,
    resumeRecording,
  };
}; 