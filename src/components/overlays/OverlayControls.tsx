/**
 * @fileoverview Overlay controls component for managing facial overlays.
 *
 * Provides interface for selecting, enabling, and configuring
 * glasses and other facial overlays with real-time preview.
 */

import React, { useState } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { OverlayType, OverlayConfig } from '@/types/overlay';
import { AVAILABLE_GLASSES } from '@/constants/glasses';
import { AVAILABLE_HATS } from '@/constants/hats';

/**
 * Convert glasses config to overlay config for controls
 */
const convertGlassesToOverlayConfig = (glasses: any): OverlayConfig => {
  return {
    id: glasses.id,
    type: OverlayType.GLASSES,
    name: glasses.name,
    imageUrl: glasses.imagePath,
    defaultPosition: {
      x: 0.5,
      y: 0.4,
      width: 0.3,
      height: 0.15,
      rotation: 0,
      scale: glasses.defaultScale,
      zIndex: 1,
    },
    defaultRendering: {
      opacity: glasses.defaultOpacity,
      blendMode: 'normal',
      visible: true,
    },
    anchors: {
      primary: 159, // Left eye center
      secondary: [386], // Right eye center
      offset: { x: 0, y: 0 },
    },
    scaling: {
      base: 1.0,
      widthFactor: 1.0,
      heightFactor: 1.0,
    },
  };
};

/**
 * Available glasses configurations
 */
const GLASSES_OPTIONS: OverlayConfig[] = AVAILABLE_GLASSES.map(convertGlassesToOverlayConfig);

/**
 * Convert hat config to overlay config
 */
const convertHatToOverlayConfig = (hat: any): OverlayConfig => {
  return {
    id: hat.id,
    type: OverlayType.HAT,
    name: hat.name,
    imageUrl: hat.imagePath,
    defaultPosition: {
      x: 0.5,
      y: 0.2,
      width: 0.4,
      height: 0.25,
      rotation: 0,
      scale: hat.defaultScale,
      zIndex: 2,
    },
    defaultRendering: {
      opacity: hat.defaultOpacity,
      blendMode: 'normal',
      visible: true,
    },
    anchors: {
      primary: 10,
      secondary: [338, 151, 337],
      offset: { x: 0, y: -0.1 },
    },
    scaling: {
      base: 1.0,
      widthFactor: 1.0,
      heightFactor: 1.0,
    },
  };
};

const HAT_OPTIONS: OverlayConfig[] = AVAILABLE_HATS.map(convertHatToOverlayConfig);

interface OverlayControlsProps {
  /** Container className */
  className?: string;
  /** Whether glasses overlay system is enabled */
  glassesOverlaySystemEnabled?: boolean;
  /** Callback to toggle glasses overlay system */
  onToggleGlassesOverlaySystem?: (enabled: boolean) => void;
  /** Whether hat overlay system is enabled */
  hatOverlaySystemEnabled?: boolean;
  /** Callback to toggle hat overlay system */
  onToggleHatOverlaySystem?: (enabled: boolean) => void;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  className = '',
  glassesOverlaySystemEnabled = false,
  onToggleGlassesOverlaySystem,
  hatOverlaySystemEnabled = false,
  onToggleHatOverlaySystem,
}) => {
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);
  const [selectedHat, setSelectedHat] = useState<string | null>(null);

  const {
    activeOverlays,
    isEnabled,
    addOverlay,
    removeOverlay,
    toggleOverlay,
    updateOverlayRendering,
    clearOverlays,
    setEnabled,
  } = useOverlayStore();

  // Debug effect to track overlay state changes
  React.useEffect(() => {
    const glassesOverlays = activeOverlays.filter(o => o.config.type === OverlayType.GLASSES);
    console.log('🔍 OverlayControls - Overlay state changed:', JSON.stringify(glassesOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
  }, [activeOverlays]);

  // Local state for overlay controls - independent of overlay system visibility
  const [isOverlayControlsEnabled, setIsOverlayControlsEnabled] =
    useState(true);

  // Get active glasses overlays
  const activeGlasses = activeOverlays.filter(
    overlay => overlay.config.type === OverlayType.GLASSES
  );

  // Get active hat overlays
  const activeHats = activeOverlays.filter(
    overlay => overlay.config.type === OverlayType.HAT
  );

  /**
   * Handle glasses selection - only one pair at a time
   */
  const handleGlassesSelect = (glassesId: string) => {
    const existingOverlay = activeOverlays.find(
      overlay => overlay.config.id === glassesId
    );

    if (existingOverlay) {
      // If overlay exists, just toggle it instead of removing/re-adding
      console.log('🔄 Toggling existing glasses overlay:', glassesId);
      toggleOverlay(glassesId);
      
      // Update selectedGlasses state based on enabled state
      if (existingOverlay.enabled) {
        setSelectedGlasses(null); // Deselect if turning off
      } else {
        setSelectedGlasses(glassesId); // Select if turning on
      }
    } else {
      // Clear any existing glasses first
      activeOverlays.forEach(overlay => {
        if (overlay.config.type === OverlayType.GLASSES) {
          removeOverlay(overlay.config.id);
        }
      });
      
      // Select new glasses
      setSelectedGlasses(glassesId);
      const glassesConfig = GLASSES_OPTIONS.find(
        option => option.id === glassesId
      );
      if (glassesConfig) {
        console.log('Adding new glasses overlay:', glassesConfig);
        addOverlay(glassesConfig);
      }
    }
  };

  /**
   * Handle hat selection - only one hat at a time
   */
  const handleHatSelect = (hatId: string) => {
    console.log('🎩 Hat selection clicked:', hatId);
    console.log('🎩 Current active overlays:', JSON.stringify(activeOverlays.map(o => ({ id: o.config.id, type: o.config.type, enabled: o.enabled }))));
    
    const existingOverlay = activeOverlays.find(
      overlay => overlay.config.id === hatId
    );

    if (existingOverlay) {
      // If overlay exists, just toggle it instead of removing/re-adding
      console.log('🔄 Toggling existing hat overlay:', hatId, 'Current enabled:', existingOverlay.enabled);
      toggleOverlay(hatId);
      
      // Update selectedHat state based on enabled state
      if (existingOverlay.enabled) {
        setSelectedHat(null); // Deselect if turning off
        console.log('🎩 Deselecting hat:', hatId);
      } else {
        setSelectedHat(hatId); // Select if turning on
        console.log('🎩 Selecting hat:', hatId);
      }
    } else {
      // Clear any existing hats first
      console.log('🎩 Clearing existing hats before adding new one');
      activeOverlays.forEach(overlay => {
        if (overlay.config.type === OverlayType.HAT) {
          console.log('🎩 Removing existing hat:', overlay.config.id);
          removeOverlay(overlay.config.id);
        }
      });
      
      // Select new hat
      setSelectedHat(hatId);
      const hatConfig = HAT_OPTIONS.find(
        option => option.id === hatId
      );
      if (hatConfig) {
        console.log('🎩 Adding new hat overlay:', hatConfig);
        addOverlay(hatConfig);
      } else {
        console.error('🎩 Hat config not found for ID:', hatId);
      }
    }
  };

  /**
   * Handle glasses opacity change for all glasses overlays
   */
  const handleGlassesOpacityChange = (opacity: number) => {
    const allGlassesOverlays = activeOverlays.filter(o => o.config.type === OverlayType.GLASSES);
    allGlassesOverlays.forEach(glasses => {
      updateOverlayRendering(glasses.config.id, { opacity });
    });
  };

  /**
   * Handle hat opacity change for all hat overlays
   */
  const handleHatOpacityChange = (opacity: number) => {
    console.log('🎨 Updating opacity for all hats to:', opacity);
    const allHatOverlays = activeOverlays.filter(o => o.config.type === OverlayType.HAT);
    console.log('🎨 All hat overlays count:', allHatOverlays.length);
    console.log('🎨 All hat overlays before update:', JSON.stringify(allHatOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
    allHatOverlays.forEach(hat => {
      console.log('🎨 Updating opacity for hat:', hat.config.name, 'Current opacity:', hat.rendering.opacity, 'New opacity:', opacity, 'Enabled:', hat.enabled);
      updateOverlayRendering(hat.config.id, { opacity });
    });
  };

  /**
   * Handle glasses scale change
   */
  const handleGlassesScaleChange = (glassesId: string, scale: number) => {
    const overlay = activeOverlays.find(o => o.config.id === glassesId);
    if (overlay) {
      updateOverlayRendering(glassesId, {
        // Update scale through position since rendering doesn't have scale
      });
    }
  };

  /**
   * Toggle overlay controls (independent of overlay system visibility)
   */
  const handleToggleOverlayControls = () => {
    setIsOverlayControlsEnabled(!isOverlayControlsEnabled);
  };

  /**
   * Toggle glasses overlay system visibility
   */
  const handleToggleGlassesOverlaySystem = () => {
    if (onToggleGlassesOverlaySystem) {
      onToggleGlassesOverlaySystem(!glassesOverlaySystemEnabled);
    }
  };

  /**
   * Toggle hat overlay system visibility
   */
  const handleToggleHatOverlaySystem = () => {
    if (onToggleHatOverlaySystem) {
      onToggleHatOverlaySystem(!hatOverlaySystemEnabled);
    }
  };

  /**
   * Clear all overlays
   */
  const handleClearOverlays = () => {
    clearOverlays();
    setSelectedGlasses(null);
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg ${className}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Overlay Controls
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleOverlayControls}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isOverlayControlsEnabled
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isOverlayControlsEnabled ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={handleToggleGlassesOverlaySystem}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                glassesOverlaySystemEnabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {glassesOverlaySystemEnabled ? 'Glasses On' : 'Glasses Off'}
            </button>
            <button
              onClick={handleToggleHatOverlaySystem}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                hatOverlaySystemEnabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {hatOverlaySystemEnabled ? 'Hats On' : 'Hats Off'}
            </button>
            <button
              onClick={handleClearOverlays}
              className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Glasses Section */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Glasses</h4>

          {/* Glasses Options */}
          <div
            className={`grid grid-cols-1 gap-2 ${!isOverlayControlsEnabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {GLASSES_OPTIONS.map(glasses => {
              const isActive = activeGlasses.some(
                overlay => overlay.config.id === glasses.id
              );
              const isSelected = selectedGlasses === glasses.id;

              return (
                <div
                  key={glasses.id}
                  className={`p-3 rounded-lg border-2 transition-all ${isOverlayControlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() =>
                    isOverlayControlsEnabled && handleGlassesSelect(glasses.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">👓</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {glasses.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isActive ? 'Active' : 'Click to add'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeOverlay(glasses.id);
                            setSelectedGlasses(null);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Glasses Controls */}
          {activeGlasses.length > 0 && (
            <div
              className={`space-y-3 pt-3 border-t border-gray-200 ${!isOverlayControlsEnabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <h5 className="text-sm font-medium text-gray-600">
                Active Glasses
              </h5>
              {activeGlasses.map(glasses => (
                <div key={glasses.config.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {glasses.config.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          console.log('🔄 Toggling glasses:', glasses.config.name, 'Current enabled:', glasses.enabled);
                          console.log('🔄 Current opacity before toggle:', glasses.rendering.opacity);
                          console.log('🔄 All overlays before toggle:', JSON.stringify(activeOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
                          toggleOverlay(glasses.config.id);
                          // Add a timeout to check the state after the toggle
                          setTimeout(() => {
                            console.log('🔄 After toggle - All overlays:', JSON.stringify(activeOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
                          }, 100);
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          glasses.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {glasses.enabled ? 'On' : 'Off'}
                      </button>
                      <button
                        onClick={() => {
                          removeOverlay(glasses.config.id);
                          setSelectedGlasses(null);
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Single Opacity Control for All Glasses */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <label className="text-xs text-gray-600">Glasses Opacity</label>
                {(() => {
                  const allGlassesOverlays = activeOverlays.filter(o => o.config.type === OverlayType.GLASSES);
                  const currentOpacity = allGlassesOverlays.length > 0 ? allGlassesOverlays[0].rendering.opacity : 0.9;

                  return (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentOpacity}
                      onChange={e =>
                        handleGlassesOpacityChange(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  );
                })()}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>
                    {(() => {
                      const allGlassesOverlays = activeOverlays.filter(o => o.config.type === OverlayType.GLASSES);
                      const currentOpacity = allGlassesOverlays.length > 0 ? allGlassesOverlays[0].rendering.opacity : 0.9;
                      return Math.round(currentOpacity * 100);
                    })()}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hats Section */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Hats</h4>

          {/* Hat Options */}
          <div
            className={`grid grid-cols-1 gap-2 ${!isOverlayControlsEnabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {HAT_OPTIONS.map(hat => {
              const isActive = activeHats.some(
                overlay => overlay.config.id === hat.id
              );
              const isSelected = selectedHat === hat.id;

              return (
                <div
                  key={hat.id}
                  className={`p-3 rounded-lg border-2 transition-all ${isOverlayControlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() =>
                    isOverlayControlsEnabled && handleHatSelect(hat.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">🎩</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {hat.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isActive ? 'Active' : 'Click to add'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeOverlay(hat.id);
                            setSelectedHat(null);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Hats Controls */}
          {activeHats.length > 0 && (
            <div
              className={`space-y-3 pt-3 border-t border-gray-200 ${!isOverlayControlsEnabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <h5 className="text-sm font-medium text-gray-600">
                Active Hats
              </h5>
              {activeHats.map(hat => (
                <div key={hat.config.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {hat.config.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          console.log('🔄 Toggling hat:', hat.config.name, 'Current enabled:', hat.enabled);
                          console.log('🔄 Current opacity before toggle:', hat.rendering.opacity);
                          console.log('🔄 All overlays before toggle:', JSON.stringify(activeOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
                          toggleOverlay(hat.config.id);
                          // Add a timeout to check the state after the toggle
                          setTimeout(() => {
                            console.log('🔄 After toggle - All overlays:', JSON.stringify(activeOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
                          }, 100);
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          hat.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hat.enabled ? 'On' : 'Off'}
                      </button>
                      <button
                        onClick={() => {
                          removeOverlay(hat.config.id);
                          setSelectedHat(null);
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Single Opacity Control for All Hats */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <label className="text-xs text-gray-600">Hat Opacity</label>
                {(() => {
                  const allHatOverlays = activeOverlays.filter(o => o.config.type === OverlayType.HAT);
                  const currentOpacity = allHatOverlays.length > 0 ? allHatOverlays[0].rendering.opacity : 0.9;
                  console.log('🎨 Opacity control - All hat overlays:', JSON.stringify(allHatOverlays.map(o => ({ id: o.config.id, opacity: o.rendering.opacity, enabled: o.enabled }))));
                  console.log('🎨 Opacity control - Current opacity value:', currentOpacity);
                  return (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentOpacity}
                      onChange={e =>
                        handleHatOpacityChange(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  );
                })()}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>
                    {(() => {
                      const allHatOverlays = activeOverlays.filter(o => o.config.type === OverlayType.HAT);
                      const currentOpacity = allHatOverlays.length > 0 ? allHatOverlays[0].rendering.opacity : 0.9;
                      return Math.round(currentOpacity * 100);
                    })()}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Overlays:</span>
            <span className="font-medium text-gray-800">
              {activeOverlays.length}
            </span>
          </div>
          {activeOverlays.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {activeOverlays.map(overlay => overlay.config.name).join(', ')}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <span>Controls:</span>
              <span
                className={`font-medium ${isOverlayControlsEnabled ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {isOverlayControlsEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Glasses System:</span>
              <span
                className={`font-medium ${glassesOverlaySystemEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {glassesOverlaySystemEnabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Hat System:</span>
              <span
                className={`font-medium ${hatOverlaySystemEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {hatOverlaySystemEnabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Debug System:</span>
              <span
                className={`font-medium ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isEnabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
