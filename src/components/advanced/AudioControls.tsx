/**
 * @fileoverview Audio recording and management component.
 *
 * Provides controls for microphone access, audio quality settings,
 * level monitoring, and audio effects.
 */

import React, { useState, useEffect } from 'react';
import { useAudio, useAudioLevels } from '@/hooks/useAudio';
import { AudioConfig, AUDIO_QUALITY_PRESETS, AUDIO_FORMATS, AUDIO_EFFECTS } from '@/config/audio';
import { AUDIO_LEVELS } from '@/config/audio';

/**
 * Audio controls props
 */
interface AudioControlsProps {
  className?: string;
  showAdvanced?: boolean;
  onAudioSettingsChange?: (settings: AudioConfig) => void;
  onAudioLevelChange?: (level: number) => void;
}

/**
 * Audio level meter component
 */
const AudioLevelMeter: React.FC<{ level: number; isClipping: boolean }> = ({ level, isClipping }) => {
  const getLevelColor = (level: number): string => {
    if (isClipping) return 'bg-red-500';
    if (level > AUDIO_LEVELS.PEAK) return 'bg-yellow-500';
    if (level > AUDIO_LEVELS.HIGH) return 'bg-green-500';
    if (level > AUDIO_LEVELS.MEDIUM) return 'bg-blue-500';
    if (level > AUDIO_LEVELS.LOW) return 'bg-gray-500';
    return 'bg-gray-300';
  };

  const getLevelWidth = (level: number): string => {
    const percentage = Math.min(level * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-100 ${getLevelColor(level)}`}
        style={{ width: getLevelWidth(level) }}
      />
    </div>
  );
};

/**
 * Audio controls component
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  showAdvanced = false,
  onAudioSettingsChange,
  onAudioLevelChange,
}) => {
  const [state, actions] = useAudio({
    autoRequestAccess: false,
    autoStartMonitoring: false,
  });
  
  const audioLevels = useAudioLevels();
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<AudioConfig>(state.config);

  // Update parent when audio levels change
  useEffect(() => {
    if (audioLevels && onAudioLevelChange) {
      onAudioLevelChange(audioLevels.current);
    }
  }, [audioLevels, onAudioLevelChange]);

  // Update parent when settings change
  useEffect(() => {
    if (onAudioSettingsChange) {
      onAudioSettingsChange(localConfig);
    }
  }, [localConfig, onAudioSettingsChange]);

  /**
   * Handle microphone access request
   */
  const handleRequestAccess = async () => {
    try {
      await actions.requestMicrophoneAccess();
      actions.startMonitoring();
    } catch (error) {
      console.error('Failed to request microphone access:', error);
    }
  };

  /**
   * Handle recording start/stop
   */
  const handleRecordingToggle = async () => {
    if (state.isRecording) {
      actions.stopRecording();
    } else {
      try {
        await actions.startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  /**
   * Handle pause/resume
   */
  const handlePauseToggle = () => {
    if (state.isPaused) {
      actions.resumeRecording();
    } else {
      actions.pauseRecording();
    }
  };

  /**
   * Update local configuration
   */
  const updateLocalConfig = (updates: Partial<AudioConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    actions.updateConfig(updates);
  };

  /**
   * Format duration
   */
  const formatDuration = (duration: number): string => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Audio Controls</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>

      {/* Microphone Access */}
      {state.state.state === 'INITIALIZING' && (
        <div className="mb-4">
          <button
            onClick={handleRequestAccess}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Request Microphone Access
          </button>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {/* Audio Level Meter */}
      {audioLevels && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Audio Level</span>
            <span className="text-sm text-gray-500">
              {Math.round(audioLevels.current * 100)}%
            </span>
          </div>
          <AudioLevelMeter level={audioLevels.current} isClipping={audioLevels.isClipping} />
          {audioLevels.isClipping && (
            <p className="text-xs text-red-600 mt-1">⚠️ Audio clipping detected</p>
          )}
        </div>
      )}

      {/* Recording Controls */}
      {state.state.state === 'READY' && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleRecordingToggle}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                state.isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {state.isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            {state.isRecording && (
              <button
                onClick={handlePauseToggle}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                {state.isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>

          {/* Recording Duration */}
          {state.isRecording && (
            <div className="text-center">
              <span className="text-lg font-mono text-gray-800">
                {formatDuration(state.duration)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Audio Settings</h4>

          {/* Quality Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Quality
            </label>
            <select
              value={localConfig.quality}
              onChange={(e) => updateLocalConfig({ quality: e.target.value as keyof typeof AUDIO_QUALITY_PRESETS })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(AUDIO_QUALITY_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {key} - {preset.description}
                </option>
              ))}
            </select>
          </div>

          {/* Format Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Format
            </label>
            <select
              value={localConfig.format}
              onChange={(e) => updateLocalConfig({ format: e.target.value as keyof typeof AUDIO_FORMATS })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(AUDIO_FORMATS).map(([key, format]) => (
                <option key={key} value={key}>
                  {key} - {format.description}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Effects */}
          {showAdvanced && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio Effects
              </label>
              <div className="space-y-2">
                {Object.entries(AUDIO_EFFECTS).map(([key, effect]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.effects[key as keyof typeof AUDIO_EFFECTS] || false}
                      onChange={(e) =>
                        updateLocalConfig({
                          effects: {
                            ...localConfig.effects,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{effect.description}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Supported Formats */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Formats
            </label>
            <div className="text-xs text-gray-600">
              {state.state.supportedFormats.length > 0 ? (
                state.state.supportedFormats.join(', ')
              ) : (
                'No formats supported'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="text-xs text-gray-500 mt-4 pt-2 border-t">
        <div>Status: {state.state.state}</div>
        {state.state.streamInfo && (
          <div>
            Sample Rate: {state.state.streamInfo.settings.sampleRate}Hz
          </div>
        )}
      </div>
    </div>
  );
}; 