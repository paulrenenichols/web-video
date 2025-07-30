/**
 * @fileoverview Overlay store for state management.
 *
 * Manages overlay state including active overlays, positioning,
 * and rendering properties using Zustand.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  OverlayState,
  OverlayActions,
  OverlayConfig,
  ActiveOverlay,
  OverlayPosition,
  OverlayRendering,
  OverlayType,
} from '@/types/overlay';
import { AVAILABLE_GLASSES, GlassesConfig } from '@/constants/glasses';
import { AVAILABLE_HATS, HatConfig } from '@/constants/hats';
import { OverlayService } from '@/services/overlay.service';

/**
 * Convert glasses config to overlay config
 */
const convertGlassesToOverlayConfig = (
  glasses: GlassesConfig
): OverlayConfig => {
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
 * Convert hat config to overlay config
 */
const convertHatToOverlayConfig = (hat: HatConfig): OverlayConfig => {
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
      zIndex: 2, // Higher than glasses
    },
    defaultRendering: {
      opacity: hat.defaultOpacity,
      blendMode: 'normal',
      visible: true,
    },
    anchors: {
      primary: 10, // Head top
      secondary: [338, 151, 337], // Head landmarks
      offset: { x: 0, y: -0.1 },
    },
    scaling: {
      base: 1.0,
      widthFactor: 1.0,
      heightFactor: 1.0,
    },
  };
};

/**
 * Initial overlay state
 */
const initialState: OverlayState = {
  availableOverlays: [
    ...AVAILABLE_GLASSES.map(convertGlassesToOverlayConfig),
    ...AVAILABLE_HATS.map(convertHatToOverlayConfig),
  ],
  activeOverlays: [],
  removedOverlaysCache: new Map(),
  isEnabled: false,
  mode: 'preview',
  error: null,
  lastUpdate: null,
};

/**
 * Overlay store using Zustand
 */
export const useOverlayStore = create<OverlayState & OverlayActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Add overlay to active list with combination validation
       */
      addOverlay: (config: OverlayConfig) => {
        const state = get();
        const existingOverlay = state.activeOverlays.find(
          overlay => overlay.config.id === config.id
        );

        if (existingOverlay) {
          // Update existing overlay but preserve rendering properties
          set(state => ({
            activeOverlays: state.activeOverlays.map(overlay =>
              overlay.config.id === config.id
                ? {
                    ...overlay,
                    config,
                    // Preserve existing rendering properties (opacity, etc.)
                    rendering: {
                      ...config.defaultRendering,
                      ...overlay.rendering,
                    },
                    lastUpdate: Date.now(),
                  }
                : overlay
            ),
            lastUpdate: Date.now(),
          }));
        } else {
          // Check for combination conflicts before adding
          const potentialOverlays = [...state.activeOverlays];
          const tempOverlay: ActiveOverlay = {
            config,
            position: config.defaultPosition,
            rendering: config.defaultRendering,
            enabled: true,
            lastUpdate: Date.now(),
          };
          potentialOverlays.push(tempOverlay);

          // Validate combination
          const validation =
            OverlayService.validateOverlayCombination(potentialOverlays);
          if (!validation.isValid) {
            console.warn(
              '⚠️ Overlay combination conflict:',
              validation.conflicts
            );
            set({
              error: validation.conflicts.join(', '),
              lastUpdate: Date.now(),
            });
            return;
          }

          // Check if we have cached rendering settings for this overlay
          const cachedRendering = state.removedOverlaysCache.get(config.id);
          const renderingToUse = cachedRendering
            ? { ...config.defaultRendering, ...cachedRendering }
            : config.defaultRendering;

          if (cachedRendering) {
            // Using cached rendering settings
          }

          // Add new overlay with optimal z-index
          const newOverlay: ActiveOverlay = {
            config,
            position: {
              ...config.defaultPosition,
              zIndex: OverlayService.getOptimalZIndex(config.type),
            },
            rendering: renderingToUse,
            enabled: true,
            lastUpdate: Date.now(),
          };

          set(state => {
            // Remove from cache since we're using it
            const newCache = new Map(state.removedOverlaysCache);
            newCache.delete(config.id);

            return {
              activeOverlays: [...state.activeOverlays, newOverlay],
              removedOverlaysCache: newCache,
              error: null, // Clear any previous errors
              lastUpdate: Date.now(),
            };
          });
        }
      },

      /**
       * Remove overlay from active list
       */
      removeOverlay: (overlayId: string) => {
        set(state => {
          const overlayToRemove = state.activeOverlays.find(
            overlay => overlay.config.id === overlayId
          );

          // Cache the rendering settings before removing
          if (overlayToRemove) {
            const newCache = new Map(state.removedOverlaysCache);
            newCache.set(overlayId, overlayToRemove.rendering);
            console.log(
              '🔄 Store: Caching rendering settings for removed overlay:',
              overlayId,
              overlayToRemove.rendering
            );

            return {
              activeOverlays: state.activeOverlays.filter(
                overlay => overlay.config.id !== overlayId
              ),
              removedOverlaysCache: newCache,
              lastUpdate: Date.now(),
            };
          }

          return {
            activeOverlays: state.activeOverlays.filter(
              overlay => overlay.config.id !== overlayId
            ),
            lastUpdate: Date.now(),
          };
        });
      },

      /**
       * Update overlay position
       */
      updateOverlayPosition: (
        overlayId: string,
        position: Partial<OverlayPosition>
      ) => {
        set(state => ({
          activeOverlays: state.activeOverlays.map(overlay =>
            overlay.config.id === overlayId
              ? {
                  ...overlay,
                  position: { ...overlay.position, ...position },
                  lastUpdate: Date.now(),
                }
              : overlay
          ),
          lastUpdate: Date.now(),
        }));
      },

      /**
       * Update overlay rendering
       */
      updateOverlayRendering: (
        overlayId: string,
        rendering: Partial<OverlayRendering>
      ) => {
        console.log(
          '🔄 Store: Updating rendering for overlay:',
          overlayId,
          'with:',
          rendering
        );
        set(state => {
          const updatedOverlays = state.activeOverlays.map(overlay =>
            overlay.config.id === overlayId
              ? {
                  ...overlay,
                  rendering: { ...overlay.rendering, ...rendering },
                  lastUpdate: Date.now(),
                }
              : overlay
          );
          console.log(
            '🔄 Store: Updated overlays:',
            updatedOverlays.map(o => ({
              id: o.config.id,
              opacity: o.rendering.opacity,
              enabled: o.enabled,
            }))
          );
          return {
            activeOverlays: updatedOverlays,
            lastUpdate: Date.now(),
          };
        });
      },

      /**
       * Enable/disable overlay
       */
      toggleOverlay: (overlayId: string, enabled?: boolean) => {
        console.log(
          '🔄 Store: Toggling overlay:',
          overlayId,
          'enabled:',
          enabled
        );
        set(state => {
          const updatedOverlays = state.activeOverlays.map(overlay =>
            overlay.config.id === overlayId
              ? {
                  ...overlay,
                  enabled: enabled !== undefined ? enabled : !overlay.enabled,
                  lastUpdate: Date.now(),
                }
              : overlay
          );
          const toggledOverlay = updatedOverlays.find(
            o => o.config.id === overlayId
          );
          console.log(
            '🔄 Store: Toggled overlay:',
            toggledOverlay
              ? {
                  id: toggledOverlay.config.id,
                  enabled: toggledOverlay.enabled,
                  opacity: toggledOverlay.rendering.opacity,
                }
              : 'not found'
          );
          return {
            activeOverlays: updatedOverlays,
            lastUpdate: Date.now(),
          };
        });
      },

      /**
       * Clear all overlays
       */
      clearOverlays: () => {
        set({
          activeOverlays: [],
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set overlay system enabled state
       */
      setEnabled: (enabled: boolean) => {
        set({
          isEnabled: enabled,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set overlay mode
       */
      setMode: (mode: 'preview' | 'recording') => {
        set({
          mode,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({
          error,
          lastUpdate: Date.now(),
        });
      },

      /**
       * Get overlay by ID
       */
      getOverlay: (overlayId: string) => {
        const state = get();
        return (
          state.activeOverlays.find(
            overlay => overlay.config.id === overlayId
          ) || null
        );
      },

      /**
       * Get overlays by type
       */
      getOverlaysByType: (type: OverlayType) => {
        const state = get();
        return state.activeOverlays.filter(
          overlay => overlay.config.type === type
        );
      },
    }),
    {
      name: 'overlay-store',
    }
  )
);
