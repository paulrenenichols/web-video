/**
 * @fileoverview Media service for camera access and device management.
 *
 * Handles camera permissions, device enumeration, and stream access.
 * Provides error handling and device selection functionality.
 */

import type { CameraDevice, VideoConfig, CameraError } from '@/types/video';

export class MediaService {
  /**
   * Request camera permissions and return permission status.
   *
   * @returns Promise that resolves to permission status
   */
  static async requestPermissions(): Promise<{
    camera: PermissionState;
    microphone: PermissionState;
  }> {
    try {
      const [cameraPermission, microphonePermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ]);

      return {
        camera: cameraPermission.state,
        microphone: microphonePermission.state,
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return {
        camera: 'denied',
        microphone: 'denied',
      };
    }
  }

  /**
   * Get available camera devices.
   *
   * @returns Promise that resolves to array of camera devices
   */
  static async getCameraDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Get camera stream with specified configuration.
   *
   * @param deviceId - Optional device ID to use
   * @param config - Video configuration
   * @returns Promise that resolves to MediaStream
   */
  static async getCameraStream(
    deviceId?: string,
    config?: Partial<VideoConfig>
  ): Promise<MediaStream> {
    const videoConstraints: MediaTrackConstraints = {
      width: config?.width || 1280,
      height: config?.height || 720,
      frameRate: config?.frameRate || 30,
    };

    if (deviceId) {
      videoConstraints.deviceId = { exact: deviceId };
    }

    const constraints: MediaStreamConstraints = {
      video: videoConstraints,
      audio: false, // We'll add audio in later phases
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      const mediaError = error as Error;
      throw this.handleMediaError(mediaError);
    }
  }

  /**
   * Stop all tracks in a MediaStream.
   *
   * @param stream - MediaStream to stop
   */
  static stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }

  /**
   * Handle MediaStream errors and return standardized error types.
   *
   * @param error - MediaStream error
   * @returns Standardized error type
   */
  private static handleMediaError(error: Error): CameraError {
    switch (error.name) {
      case 'NotAllowedError':
        return 'permission-denied';
      case 'NotFoundError':
        return 'not-found';
      case 'NotSupportedError':
        return 'not-supported';
      case 'ConstraintNotSatisfiedError':
        return 'constraint-not-satisfied';
      default:
        return 'unknown';
    }
  }
}
