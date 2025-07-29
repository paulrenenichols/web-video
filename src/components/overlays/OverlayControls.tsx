/**
 * @fileoverview Overlay selection and control interface.
 *
 * Provides controls for selecting overlays, managing their properties,
 * and combining multiple overlays for facial enhancement.
 */

import React, { useState } from 'react';
import { useOverlays } from '@/hooks/useOverlays';
import { OVERLAY_CATEGORIES } from '@/constants/overlays';
import type { OverlayConfig } from '@/types/overlay';

interface OverlayControlsProps {
  className?: string;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'glasses' | 'hats'>(
    'glasses'
  );
  const [showPreview, setShowPreview] = useState(false);

  const {
    activeOverlays,
    selectedOverlayId,
    addOverlayToScene,
    removeOverlayFromScene,
    toggleVisibility,
    toggleLock,
    clearOverlays,
    setShowPreview: setShowPreviewState,
  } = useOverlays();

  /**
   * @description Handle overlay selection
   */
  const handleOverlaySelect = (overlayConfig: OverlayConfig): void => {
    addOverlayToScene(overlayConfig);
  };

  /**
   * @description Handle overlay removal
   */
  const handleOverlayRemove = (overlayId: string): void => {
    removeOverlayFromScene(overlayId);
  };

  /**
   * @description Toggle overlay visibility
   */
  const handleToggleVisibility = (overlayId: string): void => {
    toggleVisibility(overlayId);
  };

  /**
   * @description Toggle overlay lock
   */
  const handleToggleLock = (overlayId: string): void => {
    toggleLock(overlayId);
  };

  /**
   * @description Toggle preview mode
   */
  const handleTogglePreview = (): void => {
    const newPreviewState = !showPreview;
    setShowPreview(newPreviewState);
    setShowPreviewState(newPreviewState);
  };

  /**
   * @description Get overlays for the selected category
   * @returns Array of overlay configurations
   */
  const getCategoryOverlays = (): OverlayConfig[] => {
    return selectedCategory === 'glasses'
      ? OVERLAY_CATEGORIES.glasses
      : OVERLAY_CATEGORIES.hats;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Overlay Controls
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePreview}
              className={`btn btn-sm ${showPreview ? 'btn-primary' : 'btn-secondary'}`}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              onClick={clearOverlays}
              className="btn btn-sm btn-danger"
              disabled={activeOverlays.length === 0}
            >
              Clear All
            </button>
            <button
              onClick={() => {
                const testOverlay = {
                  id: 'test-glasses',
                  type: 'glasses' as const,
                  name: 'Test Glasses',
                  imageUrl: '/overlays/glasses/sunglasses.svg',
                  defaultPosition: {
                    x: 100,
                    y: 100,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    width: 100,
                    height: 50,
                  },
                  anchorPoints: [0, 1], // Use first two landmarks for testing
                  constraints: {
                    minScale: 0.5,
                    maxScale: 2,
                    minOpacity: 0.3,
                    maxOpacity: 1,
                    maxRotation: 45,
                  },
                };

                addOverlayToScene(testOverlay);
              }}
              className="btn btn-sm btn-secondary"
            >
              Add Test Overlay
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['glasses', 'hats'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCategory === category
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Overlay Selection */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Available{' '}
            {selectedCategory.charAt(0).toUpperCase() +
              selectedCategory.slice(1)}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {getCategoryOverlays().map(overlay => (
              <button
                key={overlay.id}
                onClick={() => handleOverlaySelect(overlay)}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {overlay.type === 'glasses' ? '👓' : '🎩'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {overlay.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Overlays */}
        {activeOverlays.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Active Overlays
            </h4>
            <div className="space-y-2">
              {activeOverlays.map(overlay => (
                <div
                  key={overlay.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedOverlayId === overlay.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {overlay.config.type === 'glasses' ? '👓' : '🎩'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {overlay.config.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {overlay.config.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleVisibility(overlay.id)}
                        className={`p-1 rounded ${
                          overlay.isVisible
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                        title={
                          overlay.isVisible ? 'Hide overlay' : 'Show overlay'
                        }
                      >
                        {overlay.isVisible ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => handleToggleLock(overlay.id)}
                        className={`p-1 rounded ${
                          overlay.isLocked
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                        title={
                          overlay.isLocked ? 'Unlock overlay' : 'Lock overlay'
                        }
                      >
                        {overlay.isLocked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() => handleOverlayRemove(overlay.id)}
                        className="p-1 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remove overlay"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Click on overlays to add them to your face</p>
          <p>• Use the eye icon to show/hide overlays</p>
          <p>• Use the lock icon to prevent overlay movement</p>
          <p>• Overlays automatically follow your face movements</p>
        </div>
      </div>
    </div>
  );
};
