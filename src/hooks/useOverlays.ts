/**
 * @fileoverview React hook for overlay management and rendering.
 *
 * Manages overlay positioning, rendering, state management, and integration
 * with the overlay service and store for facial overlays.
 */

import { useCallback, useEffect, useRef } from 'react';
import { OverlayService } from '@/services/overlay.service';
import { useOverlayStore } from '@/stores/overlay-store';
import type { ActiveOverlay, OverlayConfig } from '@/types/overlay';
import type { FacialLandmarks } from '@/types/tracking';
import { ALL_OVERLAYS } from '@/constants/overlays';

export const useOverlays = () => {
  const overlayServiceRef = useRef<OverlayService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    activeOverlays,
    selectedOverlayId,
    showPreview,
    isRendering,
    error,
    addOverlay,
    removeOverlay,
    updateOverlay,
    setSelectedOverlay,
    setShowPreview,
    setRendering,
    setError,
    toggleOverlayVisibility,
    toggleOverlayLock,
    clearAllOverlays,
  } = useOverlayStore();

  /**
   * @description Initialize overlay service with canvas
   * @param canvas - Canvas element for rendering
   */
  const initializeOverlays = useCallback(
    (canvas: HTMLCanvasElement): void => {
      try {
        overlayServiceRef.current = new OverlayService();
        overlayServiceRef.current.initialize(canvas);
        canvasRef.current = canvas;
        setError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to initialize overlays';
        setError(errorMessage);
        console.error('Overlay initialization failed:', error);
      }
    },
    [setError]
  );

  /**
   * @description Load overlay images for all active overlays
   */
  const loadOverlayImages = useCallback(async (): Promise<void> => {
    if (!overlayServiceRef.current) {
      setError('Overlay service not initialized');
      return;
    }

    try {
      setError(null);

      // Load images for all available overlays
      const loadPromises = ALL_OVERLAYS.map(async overlayConfig => {
        try {
          await overlayServiceRef.current!.loadOverlayImage(
            overlayConfig.id,
            overlayConfig.imageUrl
          );
        } catch (error) {
          console.warn(
            `Failed to load overlay image for ${overlayConfig.name}:`,
            error
          );
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load overlay images';
      setError(errorMessage);
      console.error('Failed to load overlay images:', error);
    }
  }, [setError]);

  /**
   * @description Add an overlay to the active overlays
   * @param overlayConfig - Overlay configuration to add
   */
  const addOverlayToScene = useCallback(
    (overlayConfig: OverlayConfig): void => {
      const activeOverlay: ActiveOverlay = {
        id: `${overlayConfig.id}-${Date.now()}`,
        config: overlayConfig,
        position: overlayConfig.defaultPosition,
        isVisible: true,
        isLocked: false,
      };

      addOverlay(activeOverlay);
      setSelectedOverlay(activeOverlay.id);
    },
    [addOverlay, setSelectedOverlay]
  );

  /**
   * @description Remove an overlay from the scene
   * @param overlayId - ID of overlay to remove
   */
  const removeOverlayFromScene = useCallback(
    (overlayId: string): void => {
      removeOverlay(overlayId);
    },
    [removeOverlay]
  );

  /**
   * @description Start rendering overlays
   * @param videoElement - Video element for coordinate mapping
   * @param landmarks - Current facial landmarks
   */
  const startRendering = useCallback(
    (videoElement: HTMLVideoElement, landmarks: FacialLandmarks): void => {
      if (!overlayServiceRef.current || !canvasRef.current) {
        setError('Overlay service not initialized');
        return;
      }

      videoElementRef.current = videoElement;
      setRendering(true);
      setError(null);

      const renderFrame = () => {
        if (
          !overlayServiceRef.current ||
          !canvasRef.current ||
          !videoElementRef.current
        ) {
          return;
        }

        try {
          overlayServiceRef.current.renderOverlays(activeOverlays, landmarks);
        } catch (error) {
          console.error('Overlay rendering error:', error);
        }

        animationFrameRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    },
    [activeOverlays, setRendering, setError]
  );

  /**
   * @description Stop rendering overlays
   */
  const stopRendering = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setRendering(false);
    videoElementRef.current = null;
  }, [setRendering]);

  /**
   * @description Update overlay position based on new landmarks
   * @param landmarks - New facial landmarks
   */
  const updateOverlayPositions = useCallback(
    (landmarks: FacialLandmarks): void => {
      if (!overlayServiceRef.current || !videoElementRef.current) {
        return;
      }

      activeOverlays.forEach(overlay => {
        if (!overlay.isLocked) {
          const updatedOverlay =
            overlayServiceRef.current!.updateOverlayPosition(
              overlay,
              landmarks
            );
          updateOverlay(overlay.id, updatedOverlay);
        }
      });
    },
    [activeOverlays, updateOverlay]
  );

  /**
   * @description Toggle overlay visibility
   * @param overlayId - ID of overlay to toggle
   */
  const toggleVisibility = useCallback(
    (overlayId: string): void => {
      toggleOverlayVisibility(overlayId);
    },
    [toggleOverlayVisibility]
  );

  /**
   * @description Toggle overlay lock state
   * @param overlayId - ID of overlay to toggle lock
   */
  const toggleLock = useCallback(
    (overlayId: string): void => {
      toggleOverlayLock(overlayId);
    },
    [toggleOverlayLock]
  );

  /**
   * @description Clear all overlays from the scene
   */
  const clearOverlays = useCallback((): void => {
    clearAllOverlays();
  }, [clearAllOverlays]);

  /**
   * @description Check if overlay image is loaded
   * @param overlayId - Overlay identifier
   */
  const isImageLoaded = useCallback((overlayId: string): boolean => {
    return overlayServiceRef.current?.isImageLoaded(overlayId) || false;
  }, []);

  /**
   * @description Clean up resources on unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (overlayServiceRef.current) {
        overlayServiceRef.current.cleanup();
      }
    };
  }, []);

  return {
    // State
    activeOverlays,
    selectedOverlayId,
    showPreview,
    isRendering,
    error,

    // Actions
    initializeOverlays,
    loadOverlayImages,
    addOverlayToScene,
    removeOverlayFromScene,
    startRendering,
    stopRendering,
    updateOverlayPositions,
    toggleVisibility,
    toggleLock,
    clearOverlays,
    isImageLoaded,
    setSelectedOverlay,
    setShowPreview,
  };
};
