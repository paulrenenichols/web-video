/**
 * @fileoverview Audio recording and processing service.
 *
 * Manages microphone access, audio recording, synchronization,
 * effects, and multiple audio track support.
 */

import { AudioConfig, AUDIO_STATES, AUDIO_ERRORS, AUDIO_CONSTRAINTS } from '@/config/audio';
import { 
  AudioLevel, 
  AudioAnalysis, 
  AudioSyncData,
  calculateAudioLevels,
  smoothAudioLevels,
  detectClipping,
  calculateFrequencySpectrum,
  detectPitch,
  detectTempo,
  synchronizeAudioVideo,
  applyAudioEffects,
  convertAudioFormat,
  validateAudioConstraints,
  getSupportedAudioFormats
} from '@/utils/audio';

/**
 * Audio stream information
 */
export interface AudioStreamInfo {
  stream: MediaStream;
  track: MediaStreamTrack;
  settings: MediaTrackSettings;
  constraints: MediaTrackConstraints;
}

/**
 * Audio recording state
 */
export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startTime: number;
  pauseTime: number;
  totalPausedTime: number;
}

/**
 * Audio service state
 */
export interface AudioServiceState {
  state: keyof typeof AUDIO_STATES;
  stream: MediaStream | null;
  streamInfo: AudioStreamInfo | null;
  recording: AudioRecordingState;
  levels: AudioLevel | null;
  analysis: AudioAnalysis | null;
  syncData: AudioSyncData | null;
  error: string | null;
  supportedFormats: string[];
}

/**
 * Audio service event types
 */
export const AUDIO_EVENTS = {
  STATE_CHANGED: 'state_changed',
  LEVEL_UPDATED: 'level_updated',
  ANALYSIS_UPDATED: 'analysis_updated',
  SYNC_UPDATED: 'sync_updated',
  RECORDING_STARTED: 'recording_started',
  RECORDING_STOPPED: 'recording_stopped',
  RECORDING_PAUSED: 'recording_paused',
  RECORDING_RESUMED: 'recording_resumed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

/**
 * Audio service event callback
 */
export type AudioServiceCallback = (event: keyof typeof AUDIO_EVENTS, data: any) => void;

/**
 * Audio service class
 */
export class AudioService {
  private config: AudioConfig;
  private state: AudioServiceState;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private levelUpdateInterval: number | null = null;
  private analysisInterval: number | null = null;
  private syncInterval: number | null = null;
  private callbacks: Set<AudioServiceCallback> = new Set();
  private previousLevel: number = 0;

  constructor(config?: Partial<AudioConfig>) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.state = this.getInitialState();
    this.initializeSupportedFormats();
  }

  /**
   * Get default audio configuration
   */
  private getDefaultConfig(): AudioConfig {
    return {
      quality: 'MEDIUM',
      format: 'WAV',
      effects: {
        NOISE_REDUCTION: true,
        ECHO_CANCELLATION: true,
        AUTO_GAIN_CONTROL: true,
        HIGH_PASS_FILTER: false,
        LOW_PASS_FILTER: false,
      },
      syncSettings: {
        BUFFER_SIZE: 4096,
        LATENCY_THRESHOLD: 50,
        SYNC_INTERVAL: 100,
        MAX_DRIFT: 100,
      },
      monitoring: {
        LEVEL_UPDATE_INTERVAL: 50,
        PEAK_HOLD_TIME: 1000,
        CLIPPING_THRESHOLD: 0.95,
        SILENCE_THRESHOLD: 0.01,
        VU_METER_SMOOTHING: 0.8,
      },
      constraints: 'DEFAULT',
    };
  }

  /**
   * Get initial state
   */
  private getInitialState(): AudioServiceState {
    return {
      state: AUDIO_STATES.INITIALIZING,
      stream: null,
      streamInfo: null,
      recording: {
        isRecording: false,
        isPaused: false,
        duration: 0,
        startTime: 0,
        pauseTime: 0,
        totalPausedTime: 0,
      },
      levels: null,
      analysis: null,
      syncData: null,
      error: null,
      supportedFormats: [],
    };
  }

  /**
   * Initialize supported audio formats
   */
  private initializeSupportedFormats(): void {
    this.state.supportedFormats = getSupportedAudioFormats();
  }

  /**
   * Add event callback
   */
  addEventListener(callback: AudioServiceCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove event callback
   */
  removeEventListener(callback: AudioServiceCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Emit event to all callbacks
   */
  private emitEvent(event: keyof typeof AUDIO_EVENTS, data: any): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in audio service callback:', error);
      }
    });
  }

  /**
   * Update service state
   */
  private updateState(updates: Partial<AudioServiceState>): void {
    this.state = { ...this.state, ...updates };
    this.emitEvent(AUDIO_EVENTS.STATE_CHANGED, this.state);
  }

  /**
   * Request microphone access
   */
  async requestMicrophoneAccess(): Promise<MediaStream> {
    try {
      this.updateState({ state: AUDIO_STATES.INITIALIZING, error: null });

      const constraints = AUDIO_CONSTRAINTS[this.config.constraints];
      
      if (!validateAudioConstraints(constraints)) {
        throw new Error('Invalid audio constraints');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const track = stream.getAudioTracks()[0];
      if (!track) {
        throw new Error('No audio track found in stream');
      }

      const streamInfo: AudioStreamInfo = {
        stream,
        track,
        settings: track.getSettings(),
        constraints: track.getConstraints(),
      };

      this.updateState({
        state: AUDIO_STATES.READY,
        stream,
        streamInfo,
        error: null,
      });

      console.log('✅ Microphone access granted:', streamInfo.settings);
      return stream;
    } catch (error) {
      const errorMessage = this.handleAudioError(error);
      this.updateState({ state: AUDIO_STATES.ERROR, error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Initialize audio context and analyzer
   */
  private async initializeAudioContext(): Promise<void> {
    if (!this.state.stream) {
      throw new Error('No audio stream available');
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaStreamSource(this.state.stream);

      // Configure analyzer
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect nodes
      this.source.connect(this.analyser);

      // Create script processor for real-time analysis
      this.processor = this.audioContext.createScriptProcessor(
        this.config.syncSettings.BUFFER_SIZE,
        1,
        1
      );

      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Set up audio processing
      this.setupAudioProcessing();

      console.log('✅ Audio context initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Set up audio processing
   */
  private setupAudioProcessing(): void {
    if (!this.processor || !this.analyser) {
      return;
    }

    this.processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Calculate audio levels
      const levels = calculateAudioLevels(inputData, this.audioContext!.sampleRate);
      const smoothedLevel = smoothAudioLevels(levels.current, this.previousLevel);
      this.previousLevel = smoothedLevel;

      const updatedLevels = { ...levels, current: smoothedLevel };
      this.updateState({ levels: updatedLevels });
      this.emitEvent(AUDIO_EVENTS.LEVEL_UPDATED, updatedLevels);

      // Check for clipping
      if (levels.isClipping) {
        console.warn('⚠️ Audio clipping detected');
      }

      // Apply audio effects if enabled
      if (Object.values(this.config.effects).some(enabled => enabled)) {
        const processedData = applyAudioEffects(inputData, this.config.effects);
        // Note: In a real implementation, you would replace the audio data
        // This is a simplified version
      }
    };
  }

  /**
   * Start audio monitoring
   */
  startMonitoring(): void {
    if (!this.state.stream) {
      throw new Error('No audio stream available');
    }

    this.initializeAudioContext().then(() => {
      this.startLevelMonitoring();
      this.startAnalysisMonitoring();
      console.log('✅ Audio monitoring started');
    }).catch(error => {
      console.error('❌ Failed to start audio monitoring:', error);
      throw error;
    });
  }

  /**
   * Start level monitoring
   */
  private startLevelMonitoring(): void {
    if (this.levelUpdateInterval) {
      clearInterval(this.levelUpdateInterval);
    }

    this.levelUpdateInterval = window.setInterval(() => {
      if (this.analyser && this.state.levels) {
        // Update levels periodically
        this.emitEvent(AUDIO_EVENTS.LEVEL_UPDATED, this.state.levels);
      }
    }, this.config.monitoring.LEVEL_UPDATE_INTERVAL);
  }

  /**
   * Start analysis monitoring
   */
  private startAnalysisMonitoring(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.analysisInterval = window.setInterval(() => {
      if (this.analyser && this.state.stream) {
        this.performAudioAnalysis();
      }
    }, 1000); // Update analysis every second
  }

  /**
   * Perform audio analysis
   */
  private performAudioAnalysis(): void {
    if (!this.analyser || !this.audioContext) {
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    const timeData = new Float32Array(bufferLength);

    this.analyser.getFloatFrequencyData(frequencyData);
    this.analyser.getFloatTimeDomainData(timeData);

    // Calculate frequency spectrum
    const { frequency, spectrum } = calculateFrequencySpectrum(timeData, this.audioContext.sampleRate);

    // Detect pitch and tempo
    const pitch = detectPitch(timeData, this.audioContext.sampleRate);
    const tempo = detectTempo(timeData, this.audioContext.sampleRate);

    const analysis: AudioAnalysis = {
      levels: this.state.levels!,
      frequency,
      spectrum,
      pitch,
      tempo,
      timestamp: Date.now(),
    };

    this.updateState({ analysis });
    this.emitEvent(AUDIO_EVENTS.ANALYSIS_UPDATED, analysis);
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<void> {
    if (!this.state.stream) {
      throw new Error('No audio stream available');
    }

    if (this.state.recording.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      const mimeType = this.getMimeType();
      this.mediaRecorder = new MediaRecorder(this.state.stream, { mimeType });
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.start();
      
      const recording: AudioRecordingState = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        startTime: Date.now(),
        pauseTime: 0,
        totalPausedTime: 0,
      };

      this.updateState({ recording });
      this.emitEvent(AUDIO_EVENTS.RECORDING_STARTED, recording);

      console.log('✅ Audio recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio recording
   */
  stopRecording(): void {
    if (!this.mediaRecorder || !this.state.recording.isRecording) {
      throw new Error('No recording in progress');
    }

    this.mediaRecorder.stop();
  }

  /**
   * Pause audio recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || !this.state.recording.isRecording) {
      throw new Error('No recording in progress');
    }

    if (this.state.recording.isPaused) {
      throw new Error('Recording already paused');
    }

    this.mediaRecorder.pause();
    
    const recording = {
      ...this.state.recording,
      isPaused: true,
      pauseTime: Date.now(),
    };

    this.updateState({ recording });
    this.emitEvent(AUDIO_EVENTS.RECORDING_PAUSED, recording);
  }

  /**
   * Resume audio recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || !this.state.recording.isRecording) {
      throw new Error('No recording in progress');
    }

    if (!this.state.recording.isPaused) {
      throw new Error('Recording not paused');
    }

    this.mediaRecorder.resume();
    
    const totalPausedTime = this.state.recording.totalPausedTime + 
      (Date.now() - this.state.recording.pauseTime);
    
    const recording = {
      ...this.state.recording,
      isPaused: false,
      totalPausedTime,
    };

    this.updateState({ recording });
    this.emitEvent(AUDIO_EVENTS.RECORDING_RESUMED, recording);
  }

  /**
   * Handle recording stop
   */
  private handleRecordingStop(): void {
    const recording = {
      ...this.state.recording,
      isRecording: false,
      isPaused: false,
      duration: Date.now() - this.state.recording.startTime - this.state.recording.totalPausedTime,
    };

    this.updateState({ recording });
    this.emitEvent(AUDIO_EVENTS.RECORDING_STOPPED, recording);

    console.log('✅ Audio recording stopped');
  }

  /**
   * Get recorded audio as blob
   */
  getRecordedAudio(): Blob | null {
    if (this.recordedChunks.length === 0) {
      return null;
    }

    const mimeType = this.getMimeType();
    return new Blob(this.recordedChunks, { type: mimeType });
  }

  /**
   * Get MIME type for current format
   */
  private getMimeType(): string {
    const format = this.config.format;
    const supportedFormats = this.state.supportedFormats;
    
    // Try to use the configured format
    if (supportedFormats.includes(`audio/${format.toLowerCase()}`)) {
      return `audio/${format.toLowerCase()}`;
    }
    
    // Fallback to first supported format
    return supportedFormats[0] || 'audio/wav';
  }

  /**
   * Synchronize with video timestamp
   */
  synchronizeWithVideo(videoTimestamp: number): void {
    const audioTimestamp = Date.now();
    const syncData = synchronizeAudioVideo(
      audioTimestamp,
      videoTimestamp,
      this.config.syncSettings.LATENCY_THRESHOLD
    );

    this.updateState({ syncData });
    this.emitEvent(AUDIO_EVENTS.SYNC_UPDATED, syncData);

    if (!syncData.isInSync) {
      console.warn('⚠️ Audio-video sync drift detected:', syncData.drift, 'ms');
    }
  }

  /**
   * Update audio configuration
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Audio configuration updated:', this.config);
  }

  /**
   * Get current service state
   */
  getState(): AudioServiceState {
    return { ...this.state };
  }

  /**
   * Handle audio errors
   */
  private handleAudioError(error: any): string {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return AUDIO_ERRORS.PERMISSION_DENIED;
        case 'NotFoundError':
          return AUDIO_ERRORS.DEVICE_NOT_FOUND;
        case 'NotSupportedError':
          return AUDIO_ERRORS.NOT_SUPPORTED;
        default:
          return error.message || 'Unknown audio error';
      }
    }
    
    return error.message || 'Unknown error';
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Stop monitoring intervals
    if (this.levelUpdateInterval) {
      clearInterval(this.levelUpdateInterval);
      this.levelUpdateInterval = null;
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Stop recording
    if (this.mediaRecorder && this.state.recording.isRecording) {
      this.mediaRecorder.stop();
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop audio tracks
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
    }

    // Clear callbacks
    this.callbacks.clear();

    // Reset state
    this.updateState(this.getInitialState());

    console.log('🧹 Audio service cleaned up');
  }
}

// Export singleton instance
export const audioService = new AudioService(); 