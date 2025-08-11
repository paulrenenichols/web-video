/**
 * @fileoverview Main recording control button component.
 *
 * Handles recording start/stop functionality with visual feedback.
 * Provides keyboard shortcuts and accessibility features.
 */

import React, { useEffect } from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
  className?: string;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  disabled = false,
  className = '',
}) => {
  /**
   * Handle keyboard shortcuts for recording control.
   */
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      // Only handle spacebar when not in an input field
      if (event.code === 'Space' && !isInputElement(event.target)) {
        event.preventDefault();
        handleRecordingToggle();
      }
    };

    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target) return false;
      const element = target as HTMLElement;
      return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.contentEditable === 'true'
      );
    };

    const handleRecordingToggle = (): void => {
      if (disabled || isProcessing) return;

      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isRecording, isProcessing, disabled, onStartRecording, onStopRecording]);

  const handleClick = (): void => {
    console.log('🔘 RecordButton clicked!', {
      disabled,
      isProcessing,
      isRecording,
    });

    if (disabled || isProcessing) {
      console.log('❌ Button click blocked:', { disabled, isProcessing });
      return;
    }

    if (isRecording) {
      console.log('🛑 Calling onStopRecording');
      onStopRecording();
    } else {
      console.log('🎬 Calling onStartRecording');
      onStartRecording();
    }
  };

  const getButtonText = (): string => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Stop Recording';
    return 'Start Recording';
  };

  const getButtonIcon = (): React.ReactElement => {
    if (isProcessing) {
      return (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      );
    }

    if (isRecording) {
      return <div className="w-4 h-4 bg-white rounded-sm" />;
    }

    return <div className="w-4 h-4 bg-white rounded-full" />;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        btn flex items-center justify-center space-x-2 px-6 py-3 text-lg font-semibold
        transition-all duration-200 transform hover:scale-105 active:scale-95
        ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-primary-500 hover:bg-primary-600 text-white'
        }
        ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={getButtonText()}
      title={`${getButtonText()} (Press Spacebar)`}
    >
      {getButtonIcon()}
      <span>{getButtonText()}</span>
    </button>
  );
};
