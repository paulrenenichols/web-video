/**
 * @fileoverview Type definitions for video recording functionality.
 *
 * Updated to use the new composite recording system while maintaining
 * backward compatibility for existing components.
 */

// Legacy types for backward compatibility (deprecated - use CompositeRecordingResult instead)
export interface RecordingConfig {
  quality: number; // 0.1 to 1.0
  format: RecordingFormat;
  includeAudio: boolean;
  width: number;
  height: number;
  frameRate: number;
}

export type RecordingFormat = 'webm' | 'mp4' | 'ogg';

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  elapsedTime: number; // in seconds
  startTime: number | null;
  recordingBlob: Blob | null;
  error: string | null;
  config: RecordingConfig;
}

// Updated RecordingResult to be compatible with CompositeRecordingResult
export interface RecordingResult {
  success: boolean;
  blob: Blob | null;
  filename: string;
  duration: number;
  size: number;
  error?: string;
}

export interface FileDownloadOptions {
  filename: string;
  format: RecordingFormat;
  quality: number;
}

export type RecordingError =
  | 'permission-denied'
  | 'not-supported'
  | 'recording-failed'
  | 'file-creation-failed'
  | 'download-failed'
  | 'unknown';
