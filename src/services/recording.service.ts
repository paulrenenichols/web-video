/**
 * @fileoverview MediaRecorder service for video recording.
 *
 * Handles MediaRecorder API configuration, recording lifecycle,
 * and file generation with proper error handling.
 */

import type { RecordingConfig, RecordingError } from '@/types/recording';

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  /**
   * Check if MediaRecorder is supported in the current browser.
   */
  static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined';
  }

  /**
   * Get supported MIME types for recording.
   */
  static getSupportedFormats(): string[] {
    const formats = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
      'video/ogg;codecs=theora',
    ];

    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  }

  /**
   * Get the best available format for recording.
   */
  static getBestFormat(): string {
    const supportedFormats = this.getSupportedFormats();
    return supportedFormats[0] || 'video/webm';
  }

  /**
   * Start recording with the given stream and configuration.
   */
  async startRecording(
    stream: MediaStream,
    config: Partial<RecordingConfig> = {}
  ): Promise<void> {
    try {
      this.recordedChunks = [];

      const defaultConfig: RecordingConfig = {
        quality: 0.8,
        format: 'webm',
        includeAudio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        ...config,
      };

      const mimeType = this.getMimeType(defaultConfig.format);
      if (!mimeType) {
        throw new Error('Unsupported recording format');
      }

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: this.calculateBitrate(defaultConfig),
      };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = event => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      throw this.handleRecordingError(error);
    }
  }

  /**
   * Stop recording and return the recorded blob.
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder?.mimeType || 'video/webm',
          });
          resolve(blob);
        } catch (error) {
          reject(this.handleRecordingError(error));
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the current recording state.
   */
  getRecordingState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Pause recording (if supported).
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording (if supported).
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Clean up resources.
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    this.recordedChunks = [];
  }

  /**
   * Get MIME type for the specified format.
   */
  private getMimeType(format: string): string | null {
    const formatMap: Record<string, string[]> = {
      webm: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'],
      mp4: ['video/mp4'],
      ogg: ['video/ogg;codecs=theora'],
    };

    const formats = formatMap[format] || [];
    return formats.find(f => MediaRecorder.isTypeSupported(f)) || null;
  }

  /**
   * Calculate bitrate based on quality and resolution.
   */
  private calculateBitrate(config: RecordingConfig): number {
    const baseBitrate = config.width * config.height * config.frameRate * 0.1;
    return Math.round(baseBitrate * config.quality);
  }

  /**
   * Handle recording errors and return standardized error types.
   */
  private handleRecordingError(error: unknown): RecordingError {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return 'permission-denied';
      }
      if (error.name === 'NotSupportedError') {
        return 'not-supported';
      }
      if (error.message.includes('recording')) {
        return 'recording-failed';
      }
    }
    return 'unknown';
  }
}
