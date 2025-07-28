/**
 * @fileoverview Zustand store for overlay state management.
 *
 * Manages active overlays, selection, visibility, rendering status,
 * and overlay interactions for the facial overlay system.
 */

import { create } from 'zustand';
import type { OverlayState, ActiveOverlay } from '@/types/overlay';

interface OverlayStore extends OverlayState {
  // Actions
  addOverlay: (overlay: ActiveOverlay) => void;
  removeOverlay: (overlayId: string) => void;
  updateOverlay: (overlayId: string, updates: Partial<ActiveOverlay>) => void;
  setSelectedOverlay: (overlayId: string | null) => void;
  setShowPreview: (showPreview: boolean) => void;
  setRendering: (isRendering: boolean) => void;
  setError: (error: string | null) => void;
  toggleOverlayVisibility: (overlayId: string) => void;
  toggleOverlayLock: (overlayId: string) => void;
  clearAllOverlays: () => void;
  reset: () => void;
}

const initialState: OverlayState = {
  activeOverlays: [],
  selectedOverlayId: null,
  showPreview: false,
  isRendering: false,
  error: null,
};

export const useOverlayStore = create<OverlayStore>(set => ({
  ...initialState,

  addOverlay: (overlay: ActiveOverlay) => {
    set(state => ({
      activeOverlays: [...state.activeOverlays, overlay],
    }));
  },

  removeOverlay: (overlayId: string) => {
    set(state => ({
      activeOverlays: state.activeOverlays.filter(
        overlay => overlay.id !== overlayId
      ),
      selectedOverlayId:
        state.selectedOverlayId === overlayId ? null : state.selectedOverlayId,
    }));
  },

  updateOverlay: (overlayId: string, updates: Partial<ActiveOverlay>) => {
    set(state => ({
      activeOverlays: state.activeOverlays.map(overlay =>
        overlay.id === overlayId ? { ...overlay, ...updates } : overlay
      ),
    }));
  },

  setSelectedOverlay: (overlayId: string | null) => {
    set({ selectedOverlayId: overlayId });
  },

  setShowPreview: (showPreview: boolean) => {
    set({ showPreview });
  },

  setRendering: (isRendering: boolean) => {
    set({ isRendering });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  toggleOverlayVisibility: (overlayId: string) => {
    set(state => ({
      activeOverlays: state.activeOverlays.map(overlay =>
        overlay.id === overlayId
          ? { ...overlay, isVisible: !overlay.isVisible }
          : overlay
      ),
    }));
  },

  toggleOverlayLock: (overlayId: string) => {
    set(state => ({
      activeOverlays: state.activeOverlays.map(overlay =>
        overlay.id === overlayId
          ? { ...overlay, isLocked: !overlay.isLocked }
          : overlay
      ),
    }));
  },

  clearAllOverlays: () => {
    set({
      activeOverlays: [],
      selectedOverlayId: null,
    });
  },

  reset: () => {
    set(initialState);
  },
}));
