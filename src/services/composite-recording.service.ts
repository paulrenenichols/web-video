/**
 * @fileoverview Composite recording service for video recording with overlays.
 *
 * Handles MediaRecorder API with composite video stream that includes
 * both camera feed and overlay rendering for recorded videos.
 */

import type { RecordingConfig, RecordingError } from '@/types/recording';
import type { ActiveOverlay } from '@/types/overlay';

export class CompositeRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private overlayCanvasElements: HTMLCanvasElement[] = [];
  private animationFrameId: number | null = null;

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
   * Initialize the composite canvas for recording.
   */
  private initializeCompositeCanvas(
    videoElement: HTMLVideoElement,
    width: number,
    height: number
  ): void {
    this.videoElement = videoElement;
    
    // Create composite canvas
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = width;
    this.compositeCanvas.height = height;
    
    this.compositeCtx = this.compositeCanvas.getContext('2d');
    if (!this.compositeCtx) {
      throw new Error('Failed to get canvas context for composite recording');
    }
  }

  /**
   * Check if video is mirrored.
   */
  private isVideoMirrored(): boolean {
    return this.videoElement?.style.transform?.includes('scaleX(-1)') || false;
  }

  /**
   * Set overlay canvas elements to be included in recording.
   */
  setOverlayCanvases(overlayCanvases: HTMLCanvasElement[]): void {
    this.overlayCanvasElements = overlayCanvases;
  }

  /**
   * Render composite frame with video and overlays.
   */
  private renderCompositeFrame(): void {
    if (!this.compositeCtx || !this.videoElement || !this.compositeCanvas) {
      return;
    }

    // Clear canvas
    this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);

    // Check if video is mirrored
    const isMirrored = this.isVideoMirrored();

    // Apply mirroring transformation if needed
    if (isMirrored) {
      this.compositeCtx.save();
      this.compositeCtx.scale(-1, 1);
      this.compositeCtx.translate(-this.compositeCanvas.width, 0);
    }

    // Draw video frame
    this.compositeCtx.drawImage(
      this.videoElement,
      0,
      0,
      this.compositeCanvas.width,
      this.compositeCanvas.height
    );

    // Draw overlay canvases on top
    this.overlayCanvasElements.forEach(overlayCanvas => {
      if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
        this.compositeCtx!.drawImage(
          overlayCanvas,
          0,
          0,
          this.compositeCanvas!.width,
          this.compositeCanvas!.height
        );
      }
    });

    // Restore transformation if mirrored
    if (isMirrored) {
      this.compositeCtx.restore();
    }
  }

  /**
   * Start recording with composite video stream.
   */
  async startRecording(
    videoElement: HTMLVideoElement,
    overlayCanvases: HTMLCanvasElement[],
    config: Partial<RecordingConfig> = {}
  ): Promise<void> {
    try {
      this.recordedChunks = [];
      this.setOverlayCanvases(overlayCanvases);

      const defaultConfig: RecordingConfig = {
        quality: 0.9,
        format: 'webm',
        includeAudio: false,
        width: 1280,
        height: 720,
        frameRate: 30,
        ...config,
      };

      // Initialize composite canvas
      this.initializeCompositeCanvas(
        videoElement,
        defaultConfig.width,
        defaultConfig.height
      );

      const mimeType = this.getMimeType(defaultConfig.format);
      if (!mimeType) {
        throw new Error('Unsupported recording format');
      }

      // Create composite stream from canvas
      const compositeStream = this.compositeCanvas!.captureStream(defaultConfig.frameRate);

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: this.calculateBitrate(defaultConfig),
      };

      this.mediaRecorder = new MediaRecorder(compositeStream, options);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = event => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      // Start rendering composite frames
      this.startCompositeRendering();

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      throw this.handleRecordingError(error);
    }
  }

  /**
   * Start rendering composite frames for recording.
   */
  private startCompositeRendering(): void {
    let lastFrameTime = 0;
    const targetFrameRate = 30; // Match video frame rate
    const frameInterval = 1000 / targetFrameRate;

    const renderFrame = (currentTime: number) => {
      // Throttle to target frame rate to reduce lag
      if (currentTime - lastFrameTime >= frameInterval) {
        this.renderCompositeFrame();
        lastFrameTime = currentTime;
      }
      this.animationFrameId = requestAnimationFrame(renderFrame);
    };
    
    this.animationFrameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Stop rendering composite frames.
   */
  private stopCompositeRendering(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
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

      // Stop composite rendering
      this.stopCompositeRendering();

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
      this.stopCompositeRendering();
    }
  }

  /**
   * Resume recording (if supported).
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.startCompositeRendering();
    }
  }

  /**
   * Clean up resources.
   */
  cleanup(): void {
    this.stopCompositeRendering();
    
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    
    this.recordedChunks = [];
    this.compositeCanvas = null;
    this.compositeCtx = null;
    this.videoElement = null;
    this.overlayCanvasElements = [];
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