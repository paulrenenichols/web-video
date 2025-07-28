/**
 * @fileoverview Type definitions for video-related functionality.
 *
 * Defines interfaces and types for camera access, video streams,
 * and basic video state management.
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface VideoConfig {
  width: number;
  height: number;
  frameRate: number;
}

export interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface CameraPermissions {
  camera: PermissionState;
  microphone: PermissionState;
}

export type CameraError =
  | 'permission-denied'
  | 'not-found'
  | 'not-allowed'
  | 'constraint-not-satisfied'
  | 'not-supported'
  | 'unknown';
