/**
 * @fileoverview Unified visualization controls component.
 *
 * Consolidates tracking visualization, enhanced tracking, and overlay system
 * into a single control interface with one main toggle and selective options.
 */

import React from 'react';

interface VisualizationControlsProps {
  // Main visualization state
  isVisualizationEnabled: boolean;
  onToggleVisualization: (enabled: boolean) => void;
  
  // Individual visualization types
  showTracking: boolean;
  showEnhancedTracking: boolean;
  showOverlays: boolean;
  
  // Individual toggle handlers
  onToggleTracking: (enabled: boolean) => void;
  onToggleEnhancedTracking: (enabled: boolean) => void;
  onToggleOverlays: (enabled: boolean) => void;
  
  // Tracking state
  isTrackingInitialized: boolean;
  isTracking: boolean;
  trackingStatus: string;
  trackingConfidence: number;
  faceCount: number;
  trackingError?: string;
  
  // Overlay state
  activeOverlaysCount: number;
  overlayError?: string;
}

export const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  isVisualizationEnabled,
  onToggleVisualization,
  showTracking,
  showEnhancedTracking,
  showOverlays,
  onToggleTracking,
  onToggleEnhancedTracking,
  onToggleOverlays,
  isTrackingInitialized,
  isTracking,
  trackingStatus,
  trackingConfidence,
  faceCount,
  trackingError,
  activeOverlaysCount,
  overlayError,
}) => {
  const isDisabled = !isTrackingInitialized;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Visualization Controls
      </h3>
      
      {/* Main Visualization Toggle */}
      <div className="mb-4">
        <button
          onClick={() => onToggleVisualization(!isVisualizationEnabled)}
          disabled={isDisabled}
          className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isVisualizationEnabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          } ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isVisualizationEnabled ? 'Hide Visualization' : 'Show Visualization'}
        </button>
      </div>

      {/* Visualization Options - Only show when main toggle is on */}
      {isVisualizationEnabled && (
        <div className="space-y-3">
          {/* Basic Tracking */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTracking}
              onChange={(e) => onToggleTracking(e.target.checked)}
              disabled={isDisabled}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Basic Tracking
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Face bounding box and tracking status
              </div>
            </div>
          </label>

          {/* Enhanced Tracking */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showEnhancedTracking}
              onChange={(e) => onToggleEnhancedTracking(e.target.checked)}
              disabled={isDisabled}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Enhanced Tracking
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Feature outlines, landmarks, and orientation data
              </div>
            </div>
          </label>

          {/* Debug Glasses Overlay */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOverlays}
              onChange={(e) => onToggleOverlays(e.target.checked)}
              disabled={isDisabled}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Debug Glasses Overlay
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Debug visualization for glasses positioning - {activeOverlaysCount} active
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Status Information */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            Status: <span className="font-mono">{trackingStatus}</span>
          </div>
          <div>
            Faces: <span className="font-mono">{faceCount}</span>
          </div>
          <div>
            Confidence: <span className="font-mono">{(trackingConfidence * 100).toFixed(1)}%</span>
          </div>
          {trackingError && (
            <div className="text-red-500">
              Tracking Error: {trackingError}
            </div>
          )}
          {overlayError && (
            <div className="text-red-500">
              Overlay Error: {overlayError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 