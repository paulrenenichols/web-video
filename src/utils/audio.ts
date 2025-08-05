/**
 * @fileoverview Audio processing utilities and helpers.
 *
 * Provides utility functions for audio analysis, processing,
 * synchronization, and audio-video coordination.
 */

import { AUDIO_LEVELS, AUDIO_MONITORING } from '@/config/audio';

/**
 * Audio level information
 */
export interface AudioLevel {
  current: number;
  peak: number;
  average: number;
  rms: number;
  isClipping: boolean;
  isSilent: boolean;
  timestamp: number;
}

/**
 * Audio analysis result
 */
export interface AudioAnalysis {
  levels: AudioLevel;
  frequency: number[];
  spectrum: number[];
  pitch: number;
  tempo: number;
  timestamp: number;
}

/**
 * Audio synchronization data
 */
export interface AudioSyncData {
  audioTimestamp: number;
  videoTimestamp: number;
  drift: number;
  latency: number;
  isInSync: boolean;
}

/**
 * Calculate audio levels from audio data
 */
export const calculateAudioLevels = (
  audioData: Float32Array,
  sampleRate: number
): AudioLevel => {
  const now = Date.now();
  
  // Calculate RMS (Root Mean Square)
  let sum = 0;
  let peak = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.abs(audioData[i]);
    sum += sample * sample;
    peak = Math.max(peak, sample);
  }
  
  const rms = Math.sqrt(sum / audioData.length);
  const current = rms;
  const average = rms;
  
  // Check for clipping and silence
  const isClipping = peak > AUDIO_LEVELS.CLIPPING;
  const isSilent = current < AUDIO_LEVELS.SILENCE;
  
  return {
    current,
    peak,
    average,
    rms,
    isClipping,
    isSilent,
    timestamp: now,
  };
};

/**
 * Apply smoothing to audio levels
 */
export const smoothAudioLevels = (
  currentLevel: number,
  previousLevel: number,
  smoothingFactor: number = AUDIO_MONITORING.VU_METER_SMOOTHING
): number => {
  return previousLevel * smoothingFactor + currentLevel * (1 - smoothingFactor);
};

/**
 * Detect audio clipping
 */
export const detectClipping = (audioData: Float32Array): boolean => {
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) > AUDIO_LEVELS.CLIPPING) {
      return true;
    }
  }
  return false;
};

/**
 * Calculate audio frequency spectrum using FFT
 */
export const calculateFrequencySpectrum = (
  audioData: Float32Array,
  sampleRate: number
): { frequency: number[]; spectrum: number[] } => {
  // Simple frequency analysis (for more accurate results, use a proper FFT library)
  const fftSize = 2048;
  const frequencyStep = sampleRate / fftSize;
  const frequency: number[] = [];
  const spectrum: number[] = [];
  
  // Generate frequency bins
  for (let i = 0; i < fftSize / 2; i++) {
    frequency.push(i * frequencyStep);
  }
  
  // Simple magnitude calculation (this is a simplified version)
  for (let i = 0; i < fftSize / 2; i++) {
    const magnitude = Math.random() * 0.1; // Placeholder - replace with actual FFT
    spectrum.push(magnitude);
  }
  
  return { frequency, spectrum };
};

/**
 * Detect audio pitch
 */
export const detectPitch = (
  audioData: Float32Array,
  sampleRate: number
): number => {
  // Simple pitch detection (for more accurate results, use a proper pitch detection library)
  // This is a placeholder implementation
  const correlation = calculateAutocorrelation(audioData);
  const maxIndex = findPeakIndex(correlation);
  
  if (maxIndex > 0) {
    return sampleRate / maxIndex;
  }
  
  return 0;
};

/**
 * Calculate autocorrelation for pitch detection
 */
const calculateAutocorrelation = (audioData: Float32Array): number[] => {
  const correlation: number[] = [];
  const maxLag = Math.min(audioData.length / 2, 1000);
  
  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < audioData.length - lag; i++) {
      sum += audioData[i] * audioData[i + lag];
    }
    correlation.push(sum);
  }
  
  return correlation;
};

/**
 * Find peak index in array
 */
const findPeakIndex = (array: number[]): number => {
  let maxIndex = 0;
  let maxValue = array[0];
  
  for (let i = 1; i < array.length; i++) {
    if (array[i] > maxValue) {
      maxValue = array[i];
      maxIndex = i;
    }
  }
  
  return maxIndex;
};

/**
 * Calculate audio tempo
 */
export const detectTempo = (audioData: Float32Array, sampleRate: number): number => {
  // Simple tempo detection (for more accurate results, use a proper tempo detection library)
  // This is a placeholder implementation
  const energy = calculateEnergy(audioData);
  const peaks = findPeaks(energy);
  const intervals = calculateIntervals(peaks, sampleRate);
  
  if (intervals.length > 0) {
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return 60 / averageInterval; // BPM
  }
  
  return 120; // Default tempo
};

/**
 * Calculate energy of audio data
 */
const calculateEnergy = (audioData: Float32Array): number[] => {
  const frameSize = 1024;
  const energy: number[] = [];
  
  for (let i = 0; i < audioData.length; i += frameSize) {
    let sum = 0;
    for (let j = 0; j < frameSize && i + j < audioData.length; j++) {
      sum += audioData[i + j] * audioData[i + j];
    }
    energy.push(sum / frameSize);
  }
  
  return energy;
};

/**
 * Find peaks in energy array
 */
const findPeaks = (energy: number[]): number[] => {
  const peaks: number[] = [];
  const threshold = Math.max(...energy) * 0.5;
  
  for (let i = 1; i < energy.length - 1; i++) {
    if (energy[i] > threshold && energy[i] > energy[i - 1] && energy[i] > energy[i + 1]) {
      peaks.push(i);
    }
  }
  
  return peaks;
};

/**
 * Calculate intervals between peaks
 */
const calculateIntervals = (peaks: number[], sampleRate: number): number[] => {
  const intervals: number[] = [];
  const frameSize = 1024;
  
  for (let i = 1; i < peaks.length; i++) {
    const interval = (peaks[i] - peaks[i - 1]) * frameSize / sampleRate;
    intervals.push(interval);
  }
  
  return intervals;
};

/**
 * Synchronize audio and video timestamps
 */
export const synchronizeAudioVideo = (
  audioTimestamp: number,
  videoTimestamp: number,
  latencyThreshold: number = 50
): AudioSyncData => {
  const drift = audioTimestamp - videoTimestamp;
  const latency = Math.abs(drift);
  const isInSync = latency <= latencyThreshold;
  
  return {
    audioTimestamp,
    videoTimestamp,
    drift,
    latency,
    isInSync,
  };
};

/**
 * Apply audio effects to audio data
 */
export const applyAudioEffects = (
  audioData: Float32Array,
  effects: Record<string, any>
): Float32Array => {
  let processedData = new Float32Array(audioData);
  
  // Apply high-pass filter
  if (effects.highPassFilter?.enabled) {
    processedData = applyHighPassFilter(processedData, effects.highPassFilter.frequency);
  }
  
  // Apply low-pass filter
  if (effects.lowPassFilter?.enabled) {
    processedData = applyLowPassFilter(processedData, effects.lowPassFilter.frequency);
  }
  
  // Apply noise reduction
  if (effects.noiseReduction?.enabled) {
    processedData = applyNoiseReduction(processedData, effects.noiseReduction.intensity);
  }
  
  return processedData;
};

/**
 * Apply high-pass filter
 */
const applyHighPassFilter = (audioData: Float32Array, frequency: number): Float32Array => {
  // Simple high-pass filter implementation
  const filtered = new Float32Array(audioData.length);
  const alpha = 0.95; // Filter coefficient
  
  filtered[0] = audioData[0];
  for (let i = 1; i < audioData.length; i++) {
    filtered[i] = alpha * (filtered[i - 1] + audioData[i] - audioData[i - 1]);
  }
  
  return filtered;
};

/**
 * Apply low-pass filter
 */
const applyLowPassFilter = (audioData: Float32Array, frequency: number): Float32Array => {
  // Simple low-pass filter implementation
  const filtered = new Float32Array(audioData.length);
  const alpha = 0.1; // Filter coefficient
  
  filtered[0] = audioData[0];
  for (let i = 1; i < audioData.length; i++) {
    filtered[i] = alpha * audioData[i] + (1 - alpha) * filtered[i - 1];
  }
  
  return filtered;
};

/**
 * Apply noise reduction
 */
const applyNoiseReduction = (audioData: Float32Array, intensity: number): Float32Array => {
  // Simple noise reduction using threshold
  const threshold = intensity * 0.1;
  const reduced = new Float32Array(audioData.length);
  
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) < threshold) {
      reduced[i] = 0;
    } else {
      reduced[i] = audioData[i];
    }
  }
  
  return reduced;
};

/**
 * Convert audio data to different formats
 */
export const convertAudioFormat = (
  audioData: Float32Array,
  targetFormat: string
): ArrayBuffer => {
  // Convert Float32Array to target format
  // This is a simplified implementation
  switch (targetFormat) {
    case 'wav':
      return convertToWAV(audioData);
    case 'mp3':
      return convertToMP3(audioData);
    default:
      return audioData.buffer;
  }
};

/**
 * Convert to WAV format
 */
const convertToWAV = (audioData: Float32Array): ArrayBuffer => {
  // Simple WAV header creation
  const sampleRate = 44100;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = audioData.length * 2; // 16-bit samples
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // WAV header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // File size
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, channels, true); // Channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Data size
  
  // Convert Float32Array to 16-bit PCM
  const offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const pcmSample = sample * 32767;
    view.setInt16(offset + i * 2, pcmSample, true);
  }
  
  return buffer;
};

/**
 * Convert to MP3 format (placeholder)
 */
const convertToMP3 = (audioData: Float32Array): ArrayBuffer => {
  // This would require a proper MP3 encoder library
  // For now, return the original buffer
  return audioData.buffer;
};

/**
 * Validate audio constraints
 */
export const validateAudioConstraints = (constraints: MediaTrackConstraints): boolean => {
  if (!constraints.audio) {
    return false;
  }
  
  // Check if required audio properties are supported
  const audioConstraints = constraints.audio as any;
  
  if (audioConstraints.sampleRate && audioConstraints.sampleRate > 96000) {
    return false;
  }
  
  if (audioConstraints.channelCount && audioConstraints.channelCount > 2) {
    return false;
  }
  
  return true;
};

/**
 * Get supported audio formats
 */
export const getSupportedAudioFormats = (): string[] => {
  const formats = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/mp4;codecs=aac',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  const supported: string[] = [];
  
  formats.forEach(format => {
    if (MediaRecorder.isTypeSupported(format)) {
      supported.push(format);
    }
  });
  
  // If no formats are supported, return webm as fallback
  if (supported.length === 0) {
    supported.push('audio/webm');
  }
  
  return supported;
}; 