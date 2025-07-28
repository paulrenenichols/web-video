/**
 * @fileoverview Application configuration constants.
 *
 * Centralized configuration for the video recording application.
 * Contains default values and feature flags.
 */

export const APP_CONFIG = {
  name: 'Web Video Recorder',
  version: '0.0.0',
  environment: import.meta.env.MODE || 'development',
} as const;

export const CAMERA_CONFIG = {
  defaultWidth: 1280,
  defaultHeight: 720,
  defaultFrameRate: 30,
  maxWidth: 1920,
  maxHeight: 1080,
  maxFrameRate: 60,
} as const;

export const FEATURE_FLAGS = {
  enableFaceTracking: false,
  enableOverlays: false,
  enableAudioRecording: false,
} as const;

export const UI_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: ['webm', 'mp4'] as const,
  defaultQuality: 0.8,
} as const;
