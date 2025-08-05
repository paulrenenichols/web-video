/**
 * @fileoverview Audio configuration and settings.
 *
 * Defines audio quality settings, format options, and configuration
 * parameters for audio recording and processing.
 */

/**
 * Audio quality presets
 */
export const AUDIO_QUALITY_PRESETS = {
  LOW: {
    sampleRate: 22050,
    channelCount: 1,
    bitDepth: 16,
    description: 'Low quality - suitable for voice recording',
  },
  MEDIUM: {
    sampleRate: 44100,
    channelCount: 1,
    bitDepth: 16,
    description: 'Medium quality - good for most recordings',
  },
  HIGH: {
    sampleRate: 48000,
    channelCount: 2,
    bitDepth: 24,
    description: 'High quality - professional audio',
  },
  ULTRA: {
    sampleRate: 96000,
    channelCount: 2,
    bitDepth: 32,
    description: 'Ultra high quality - studio grade',
  },
} as const;

/**
 * Audio format options
 */
export const AUDIO_FORMATS = {
  WAV: {
    mimeType: 'audio/wav',
    extension: '.wav',
    description: 'Uncompressed audio format',
    supported: true,
  },
  MP3: {
    mimeType: 'audio/mp3',
    extension: '.mp3',
    description: 'Compressed audio format',
    supported: true,
  },
  AAC: {
    mimeType: 'audio/aac',
    extension: '.aac',
    description: 'Advanced audio coding',
    supported: true,
  },
  OGG: {
    mimeType: 'audio/ogg',
    extension: '.ogg',
    description: 'Open source audio format',
    supported: true,
  },
} as const;

/**
 * Audio effects and filters
 */
export const AUDIO_EFFECTS = {
  NOISE_REDUCTION: {
    name: 'noise_reduction',
    description: 'Reduce background noise',
    enabled: true,
    intensity: 0.5,
  },
  ECHO_CANCELLATION: {
    name: 'echo_cancellation',
    description: 'Remove echo and feedback',
    enabled: true,
    intensity: 0.7,
  },
  AUTO_GAIN_CONTROL: {
    name: 'auto_gain_control',
    description: 'Automatically adjust volume levels',
    enabled: true,
    intensity: 0.6,
  },
  HIGH_PASS_FILTER: {
    name: 'high_pass_filter',
    description: 'Remove low frequency noise',
    enabled: false,
    frequency: 80,
  },
  LOW_PASS_FILTER: {
    name: 'low_pass_filter',
    description: 'Remove high frequency noise',
    enabled: false,
    frequency: 8000,
  },
} as const;

/**
 * Audio synchronization settings
 */
export const AUDIO_SYNC_SETTINGS = {
  BUFFER_SIZE: 4096,
  LATENCY_THRESHOLD: 50, // milliseconds
  SYNC_INTERVAL: 100, // milliseconds
  MAX_DRIFT: 100, // milliseconds
} as const;

/**
 * Audio monitoring settings
 */
export const AUDIO_MONITORING = {
  LEVEL_UPDATE_INTERVAL: 50, // milliseconds
  PEAK_HOLD_TIME: 1000, // milliseconds
  CLIPPING_THRESHOLD: 0.95,
  SILENCE_THRESHOLD: 0.01,
  VU_METER_SMOOTHING: 0.8,
} as const;

/**
 * Audio permissions and constraints
 */
export const AUDIO_CONSTRAINTS = {
  DEFAULT: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
    },
  },
  HIGH_QUALITY: {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 96000,
      channelCount: 2,
    },
  },
  VOICE_OPTIMIZED: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1,
    },
  },
} as const;

/**
 * Audio configuration interface
 */
export interface AudioConfig {
  quality: keyof typeof AUDIO_QUALITY_PRESETS;
  format: keyof typeof AUDIO_FORMATS;
  effects: Partial<Record<keyof typeof AUDIO_EFFECTS, boolean>>;
  syncSettings: typeof AUDIO_SYNC_SETTINGS;
  monitoring: typeof AUDIO_MONITORING;
  constraints: keyof typeof AUDIO_CONSTRAINTS;
}

/**
 * Default audio configuration
 */
export const defaultAudioConfig: AudioConfig = {
  quality: 'MEDIUM',
  format: 'WAV',
  effects: {
    NOISE_REDUCTION: true,
    ECHO_CANCELLATION: true,
    AUTO_GAIN_CONTROL: true,
    HIGH_PASS_FILTER: false,
    LOW_PASS_FILTER: false,
  },
  syncSettings: AUDIO_SYNC_SETTINGS,
  monitoring: AUDIO_MONITORING,
  constraints: 'DEFAULT',
};

/**
 * Development audio configuration
 */
export const developmentAudioConfig: AudioConfig = {
  ...defaultAudioConfig,
  quality: 'LOW',
  format: 'WAV',
  effects: {
    NOISE_REDUCTION: false,
    ECHO_CANCELLATION: false,
    AUTO_GAIN_CONTROL: false,
    HIGH_PASS_FILTER: false,
    LOW_PASS_FILTER: false,
  },
  constraints: 'VOICE_OPTIMIZED',
};

/**
 * Get audio configuration based on environment
 */
export const getAudioConfig = (): AudioConfig => {
  if (import.meta.env.DEV) {
    return developmentAudioConfig;
  }
  return defaultAudioConfig;
};

/**
 * Audio level thresholds
 */
export const AUDIO_LEVELS = {
  SILENCE: 0.01,
  LOW: 0.1,
  MEDIUM: 0.3,
  HIGH: 0.6,
  PEAK: 0.9,
  CLIPPING: 0.95,
} as const;

/**
 * Audio error types
 */
export const AUDIO_ERRORS = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  ENCODING_ERROR: 'ENCODING_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
} as const;

/**
 * Audio state types
 */
export const AUDIO_STATES = {
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  RECORDING: 'RECORDING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
} as const; 