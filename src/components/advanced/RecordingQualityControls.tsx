/**
 * @fileoverview Recording quality and format controls component.
 *
 * Provides controls for selecting video recording formats (WebM, MP4),
 * quality presets, and audio settings for synchronized recording.
 */

import React from 'react';
import { useRecordingFormats } from '@/hooks/useCompositeRecording';
import { RECORDING_FORMATS, RECORDING_QUALITY_PRESETS } from '@/services/composite-recording.service';

/**
 * Recording quality controls props
 */
export interface RecordingQualityControlsProps {
  /** Current format selection */
  selectedFormat: keyof typeof RECORDING_FORMATS;
  /** Current quality preset */
  selectedQuality: keyof typeof RECORDING_QUALITY_PRESETS;
  /** Whether audio is included */
  includeAudio: boolean;
  /** Callback when format changes */
  onFormatChange: (format: keyof typeof RECORDING_FORMATS) => void;
  /** Callback when quality changes */
  onQualityChange: (quality: keyof typeof RECORDING_QUALITY_PRESETS) => void;
  /** Callback when audio setting changes */
  onAudioChange: (includeAudio: boolean) => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Recording quality controls component
 */
export const RecordingQualityControls: React.FC<RecordingQualityControlsProps> = ({
  selectedFormat,
  selectedQuality,
  includeAudio,
  onFormatChange,
  onQualityChange,
  onAudioChange,
  disabled = false,
  className = '',
}) => {
  const { supportedFormats, formats, qualityPresets } = useRecordingFormats();

  return (
    <div className={`space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recording Quality & Format
        </h3>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Video Format
        </label>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(formats).map(([key, format]) => {
            const isSupported = supportedFormats.includes(key);
            const isSelected = selectedFormat === key;
            
            return (
              <button
                key={key}
                onClick={() => isSupported && onFormatChange(key as keyof typeof RECORDING_FORMATS)}
                disabled={disabled || !isSupported}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${
                  !isSupported
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format.description.split(' - ')[0]}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format.description.split(' - ')[1]}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {format.extension}
                  </div>
                </div>
                {!isSupported && (
                  <div className="mt-2 text-xs text-red-500">
                    Not supported in this browser
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Quality Preset
        </label>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(qualityPresets).map(([key, preset]) => {
            const isSelected = selectedQuality === key;
            
            return (
              <button
                key={key}
                onClick={() => onQualityChange(key as keyof typeof RECORDING_QUALITY_PRESETS)}
                disabled={disabled}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } cursor-pointer hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {preset.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {preset.video.width}×{preset.video.height} • {preset.video.frameRate}fps • {Math.round(preset.video.bitrate / 1000000)}Mbps
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {preset.audio.sampleRate / 1000}k • {preset.audio.channelCount}ch
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Settings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Audio Settings
        </label>
        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <button
            onClick={() => onAudioChange(!includeAudio)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              includeAudio
                ? 'bg-blue-500'
                : 'bg-gray-200 dark:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeAudio ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎤</span>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Include Audio
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Record microphone audio with video
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Information */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <div className="font-medium mb-2">Current Settings:</div>
          <div className="space-y-1">
            <div>Format: {formats[selectedFormat].description}</div>
            <div>Quality: {qualityPresets[selectedQuality].description}</div>
            <div>Audio: {includeAudio ? 'Enabled' : 'Disabled'}</div>
            {includeAudio && (
              <div>Audio Quality: {qualityPresets[selectedQuality].audio.sampleRate / 1000}kHz, {qualityPresets[selectedQuality].audio.channelCount} channels</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 