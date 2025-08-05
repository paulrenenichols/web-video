/**
 * @fileoverview Composite recording service for synchronized video and audio recording.
 *
 * Handles combined video and audio recording with synchronization,
 * supports multiple formats (WebM, MP4), and provides quality controls.
 */

import { audioService } from './audio.service';
import { synchronizeAudioVideo } from '@/utils/audio';

/**
 * Recording format options
 */
export const RECORDING_FORMATS = {
  WEBM: {
    mimeType: 'video/webm',
    extension: '.webm',
    description: 'WebM format - good compression, web optimized',
    supported: true,
  },
  MP4: {
    mimeType: 'video/mp4',
    extension: '.mp4',
    description: 'MP4 format - universal compatibility',
    supported: true,
  },
} as const;

/**
 * Recording quality presets
 */
export const RECORDING_QUALITY_PRESETS = {
  LOW: {
    video: {
      width: 640,
      height: 480,
      frameRate: 24,
      bitrate: 1000000, // 1 Mbps
    },
    audio: {
      sampleRate: 22050,
      channelCount: 1,
      bitrate: 64000, // 64 kbps
    },
    description: 'Low quality - suitable for quick sharing',
  },
  MEDIUM: {
    video: {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrate: 2500000, // 2.5 Mbps
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      bitrate: 128000, // 128 kbps
    },
    description: 'Medium quality - good for most recordings',
  },
  HIGH: {
    video: {
      width: 1920,
      height: 1080,
      frameRate: 30,
      bitrate: 5000000, // 5 Mbps
    },
    audio: {
      sampleRate: 48000,
      channelCount: 2,
      bitrate: 192000, // 192 kbps
    },
    description: 'High quality - professional recordings',
  },
  ULTRA: {
    video: {
      width: 3840,
      height: 2160,
      frameRate: 30,
      bitrate: 15000000, // 15 Mbps
    },
    audio: {
      sampleRate: 96000,
      channelCount: 2,
      bitrate: 320000, // 320 kbps
    },
    description: 'Ultra high quality - 4K recordings',
  },
} as const;

/**
 * Recording configuration
 */
export interface RecordingConfig {
  format: keyof typeof RECORDING_FORMATS;
  quality: keyof typeof RECORDING_QUALITY_PRESETS;
  includeAudio: boolean;
  syncSettings: {
    latencyThreshold: number;
    syncInterval: number;
    maxDrift: number;
  };
}

/**
 * Recording state
 */
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startTime: number;
  pauseTime: number;
  totalPausedTime: number;
  videoBlob: Blob | null;
  audioBlob: Blob | null;
  compositeBlob: Blob | null;
  syncData: {
    audioTimestamp: number;
    videoTimestamp: number;
    drift: number;
    latency: number;
    isInSync: boolean;
  } | null;
  error: string | null;
}

/**
 * Recording result
 */
export interface CompositeRecordingResult {
  videoBlob: Blob | null;
  audioBlob: Blob | null;
  compositeBlob: Blob | null;
  duration: number;
  format: string;
  quality: string;
  size: number;
  syncData: {
    averageDrift: number;
    maxDrift: number;
    syncQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

/**
 * Composite recording service class
 */
export class CompositeRecordingService {
  private config: RecordingConfig;
  private state: RecordingState;
  private videoRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  private audioChunks: Blob[] = [];
  private syncInterval: number | null = null;
  private syncDataPoints: Array<{ drift: number; timestamp: number }> = [];
  private onStateChange: ((state: RecordingState) => void) | null = null;
  private onSyncUpdate: ((syncData: any) => void) | null = null;

  constructor(config?: Partial<RecordingConfig>) {
    this.config = {
      format: 'WEBM',
      quality: 'MEDIUM',
      includeAudio: true,
      syncSettings: {
        latencyThreshold: 50,
        syncInterval: 100,
        maxDrift: 100,
      },
      ...config,
    };

    this.state = this.getInitialState();
  }

  /**
   * Get initial state
   */
  private getInitialState(): RecordingState {
    return {
      isRecording: false,
      isPaused: false,
      duration: 0,
      startTime: 0,
      pauseTime: 0,
      totalPausedTime: 0,
      videoBlob: null,
      audioBlob: null,
      compositeBlob: null,
      syncData: null,
      error: null,
    };
  }

  /**
   * Set state change callback
   */
  onStateChangeCallback(callback: (state: RecordingState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Set sync update callback
   */
  onSyncUpdateCallback(callback: (syncData: any) => void): void {
    this.onSyncUpdate = callback;
  }

  /**
   * Update state
   */
  private updateState(updates: Partial<RecordingState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Recording configuration updated:', this.config);
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    const formats: string[] = [];
    
    Object.entries(RECORDING_FORMATS).forEach(([key, format]) => {
      if (format.supported && MediaRecorder.isTypeSupported(format.mimeType)) {
        formats.push(key);
      }
    });
    
    return formats;
  }

  /**
   * Get MIME type for current format
   */
  private getMimeType(): string {
    const format = RECORDING_FORMATS[this.config.format];
    return format.mimeType;
  }

  /**
   * Start composite recording
   */
  async startRecording(videoStream: MediaStream, overlayCanvases: HTMLCanvasElement[] = []): Promise<void> {
    if (this.state.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      console.log('🎬 Starting composite recording...');
      
      // Reset state
      this.videoChunks = [];
      this.audioChunks = [];
      this.syncDataPoints = [];
      
      // Create composite stream
      const compositeStream = await this.createCompositeStream(videoStream, overlayCanvases);
      
      // Start video recording
      await this.startVideoRecording(compositeStream);
      
      // Start audio recording if enabled
      if (this.config.includeAudio) {
        await this.startAudioRecording();
      }
      
      // Start synchronization monitoring
      this.startSyncMonitoring();
      
      // Update state
      this.updateState({
        isRecording: true,
        isPaused: false,
        startTime: Date.now(),
        pauseTime: 0,
        totalPausedTime: 0,
        error: null,
      });
      
      console.log('✅ Composite recording started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Create composite stream with overlays
   */
  private async createCompositeStream(
    videoStream: MediaStream, 
    overlayCanvases: HTMLCanvasElement[]
  ): Promise<MediaStream> {
    // Create a canvas to composite video and overlays
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Get video track
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track found');
    }

    // Set canvas size to video dimensions
    const settings = videoTrack.getSettings();
    canvas.width = settings.width || 1280;
    canvas.height = settings.height || 720;

    // Create video element for the stream
    const video = document.createElement('video');
    video.srcObject = videoStream;
    video.muted = true;
    video.autoplay = true;

    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    // Create MediaStream from canvas
    const canvasStream = canvas.captureStream(30); // 30 FPS

    // Composite video and overlays
    const compositeFrame = () => {
      if (!this.state.isRecording) return;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw overlays
      overlayCanvases.forEach(overlayCanvas => {
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
      });

      // Request next frame
      requestAnimationFrame(compositeFrame);
    };

    // Start compositing
    compositeFrame();

    return canvasStream;
  }

  /**
   * Start video recording
   */
  private async startVideoRecording(stream: MediaStream): Promise<void> {
    const mimeType = this.getMimeType();
    const options = {
      mimeType,
      videoBitsPerSecond: RECORDING_QUALITY_PRESETS[this.config.quality].video.bitrate,
    };

    this.videoRecorder = new MediaRecorder(stream, options);
    
    this.videoRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.videoChunks.push(event.data);
      }
    };

    this.videoRecorder.onstop = () => {
      console.log('📹 Video recording stopped');
    };

    this.videoRecorder.start();
    console.log('📹 Video recording started');
  }

  /**
   * Start audio recording
   */
  private async startAudioRecording(): Promise<void> {
    try {
      const audioState = audioService.getState();
      if (audioState.state === 'READY') {
        await audioService.startRecording();
        console.log('🎤 Audio recording started');
      } else {
        console.warn('⚠️ Audio service not ready, recording video only');
      }
    } catch (error) {
      console.error('❌ Failed to start audio recording:', error);
    }
  }

  /**
   * Start synchronization monitoring
   */
  private startSyncMonitoring(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.state.isRecording) {
        this.updateSyncData();
      }
    }, this.config.syncSettings.syncInterval);
  }

  /**
   * Update synchronization data
   */
  private updateSyncData(): void {
    const videoTimestamp = Date.now();
    const audioTimestamp = videoTimestamp; // In a real implementation, get from audio service
    
    const syncData = synchronizeAudioVideo(
      audioTimestamp,
      videoTimestamp,
      this.config.syncSettings.latencyThreshold
    );

    // Store sync data point
    this.syncDataPoints.push({
      drift: syncData.drift,
      timestamp: videoTimestamp,
    });

    this.updateState({ syncData });
    this.onSyncUpdate?.(syncData);

    if (!syncData.isInSync) {
      console.warn('⚠️ Audio-video sync drift detected:', syncData.drift, 'ms');
    }
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.state.isRecording || this.state.isPaused) {
      throw new Error('Recording not active or already paused');
    }

    this.videoRecorder?.pause();
    
    if (this.config.includeAudio) {
      try {
        const audioState = audioService.getState();
        if (audioState.recording.isRecording) {
          audioService.pauseRecording();
        }
      } catch (error) {
        console.error('❌ Failed to pause audio recording:', error);
      }
    }

    this.updateState({
      isPaused: true,
      pauseTime: Date.now(),
    });

    console.log('⏸️ Recording paused');
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.state.isRecording || !this.state.isPaused) {
      throw new Error('Recording not active or not paused');
    }

    this.videoRecorder?.resume();
    
    if (this.config.includeAudio) {
      try {
        const audioState = audioService.getState();
        if (audioState.recording.isRecording && audioState.recording.isPaused) {
          audioService.resumeRecording();
        }
      } catch (error) {
        console.error('❌ Failed to resume audio recording:', error);
      }
    }

    const totalPausedTime = this.state.totalPausedTime + 
      (Date.now() - this.state.pauseTime);

    this.updateState({
      isPaused: false,
      totalPausedTime,
    });

    console.log('▶️ Recording resumed');
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<CompositeRecordingResult> {
    if (!this.state.isRecording) {
      throw new Error('No recording in progress');
    }

    try {
      console.log('🛑 Stopping composite recording...');

      // Stop video recording
      if (this.videoRecorder) {
        this.videoRecorder.stop();
      }

      // Stop audio recording
      if (this.config.includeAudio) {
        try {
          const audioState = audioService.getState();
          if (audioState.recording.isRecording) {
            audioService.stopRecording();
          }
        } catch (error) {
          console.error('❌ Failed to stop audio recording:', error);
        }
      }

      // Stop sync monitoring
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Calculate duration
      const duration = Date.now() - this.state.startTime - this.state.totalPausedTime;

      // Get video blob
      const videoBlob = this.videoChunks.length > 0 
        ? new Blob(this.videoChunks, { type: this.getMimeType() })
        : null;

      // Get audio blob
      const audioBlob = this.config.includeAudio ? audioService.getRecordedAudio() : null;

      // Create composite blob (for now, just return video blob)
      // In a real implementation, you would merge video and audio
      const compositeBlob = videoBlob;

      // Calculate sync quality
      const syncQuality = this.calculateSyncQuality();

      // Create result
      const result: CompositeRecordingResult = {
        videoBlob,
        audioBlob,
        compositeBlob,
        duration,
        format: this.config.format,
        quality: this.config.quality,
        size: compositeBlob?.size || 0,
        syncData: syncQuality,
      };

      // Update state
      this.updateState({
        isRecording: false,
        isPaused: false,
        duration,
        videoBlob,
        audioBlob,
        compositeBlob,
      });

      console.log('✅ Composite recording stopped:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Calculate sync quality
   */
  private calculateSyncQuality(): { averageDrift: number; maxDrift: number; syncQuality: 'excellent' | 'good' | 'fair' | 'poor' } {
    if (this.syncDataPoints.length === 0) {
      return { averageDrift: 0, maxDrift: 0, syncQuality: 'excellent' };
    }

    const drifts = this.syncDataPoints.map(point => Math.abs(point.drift));
    const averageDrift = drifts.reduce((sum, drift) => sum + drift, 0) / drifts.length;
    const maxDrift = Math.max(...drifts);

    let syncQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageDrift < 10) {
      syncQuality = 'excellent';
    } else if (averageDrift < 25) {
      syncQuality = 'good';
    } else if (averageDrift < 50) {
      syncQuality = 'fair';
    } else {
      syncQuality = 'poor';
    }

    return { averageDrift, maxDrift, syncQuality };
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.state.isRecording) {
      this.stopRecording().catch(console.error);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.videoChunks = [];
    this.audioChunks = [];
    this.syncDataPoints = [];
    this.updateState(this.getInitialState());

    console.log('🧹 Composite recording service cleaned up');
  }
}

// Export singleton instance
export const compositeRecordingService = new CompositeRecordingService();
