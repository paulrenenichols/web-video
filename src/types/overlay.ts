/**
 * @fileoverview Overlay system types and interfaces.
 *
 * Defines types for overlay positioning, rendering, and state management
 * for the facial overlay system (glasses, hats, etc.).
 */

import { LandmarkPoint } from './tracking';

/**
 * Overlay types that can be applied to faces
 */
export enum OverlayType {
  GLASSES = 'glasses',
  HAT = 'hat',
  MASK = 'mask',
  EARRINGS = 'earrings',
  NECKLACE = 'necklace',
}

/**
 * Overlay positioning data
 */
export interface OverlayPosition {
  /** X coordinate (normalized 0-1) */
  x: number;
  /** Y coordinate (normalized 0-1) */
  y: number;
  /** Width (normalized 0-1) */
  width: number;
  /** Height (normalized 0-1) */
  height: number;
  /** Rotation in degrees */
  rotation: number;
  /** Scale factor */
  scale: number;
  /** Z-index for layering */
  zIndex: number;
}

/**
 * Overlay rendering properties
 */
export interface OverlayRendering {
  /** Opacity (0-1) */
  opacity: number;
  /** Blend mode */
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  /** Whether overlay is visible */
  visible: boolean;
  /** Custom CSS filters */
  filters?: string;
}

/**
 * Overlay configuration
 */
export interface OverlayConfig {
  /** Unique identifier */
  id: string;
  /** Overlay type */
  type: OverlayType;
  /** Display name */
  name: string;
  /** Image URL or data */
  imageUrl: string;
  /** Default positioning */
  defaultPosition: OverlayPosition;
  /** Default rendering properties */
  defaultRendering: OverlayRendering;
  /** Landmark anchors for positioning */
  anchors: {
    /** Primary anchor landmark index */
    primary: number;
    /** Secondary anchor landmark indices */
    secondary?: number[];
    /** Offset from anchor point */
    offset: { x: number; y: number };
  };
  /** Scaling factors based on face size */
  scaling: {
    /** Base scale factor */
    base: number;
    /** Scale adjustment based on face width */
    widthFactor: number;
    /** Scale adjustment based on face height */
    heightFactor: number;
  };
}

/**
 * Active overlay instance
 */
export interface ActiveOverlay {
  /** Configuration reference */
  config: OverlayConfig;
  /** Current position */
  position: OverlayPosition;
  /** Current rendering properties */
  rendering: OverlayRendering;
  /** Whether overlay is enabled */
  enabled: boolean;
  /** Timestamp of last update */
  lastUpdate: number;
}

/**
 * Overlay positioning calculation result
 */
export interface OverlayPositionResult {
  /** Calculated position */
  position: OverlayPosition;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether position is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Overlay system state
 */
export interface OverlayState {
  /** Available overlay configurations */
  availableOverlays: OverlayConfig[];
  /** Currently active overlays */
  activeOverlays: ActiveOverlay[];
  /** Whether overlay system is enabled */
  isEnabled: boolean;
  /** Current overlay mode */
  mode: 'preview' | 'recording';
  /** Error message if any */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number | null;
}

/**
 * Overlay system actions
 */
export interface OverlayActions {
  /** Add overlay to active list */
  addOverlay: (config: OverlayConfig) => void;
  /** Remove overlay from active list */
  removeOverlay: (overlayId: string) => void;
  /** Update overlay position */
  updateOverlayPosition: (overlayId: string, position: Partial<OverlayPosition>) => void;
  /** Update overlay rendering */
  updateOverlayRendering: (overlayId: string, rendering: Partial<OverlayRendering>) => void;
  /** Enable/disable overlay */
  toggleOverlay: (overlayId: string, enabled?: boolean) => void;
  /** Clear all overlays */
  clearOverlays: () => void;
  /** Set overlay system enabled state */
  setEnabled: (enabled: boolean) => void;
  /** Set overlay mode */
  setMode: (mode: 'preview' | 'recording') => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Get overlay by ID */
  getOverlay: (overlayId: string) => ActiveOverlay | null;
  /** Get overlays by type */
  getOverlaysByType: (type: OverlayType) => ActiveOverlay[];
}

/**
 * Overlay positioning context
 */
export interface OverlayPositioningContext {
  /** Current facial landmarks */
  landmarks: LandmarkPoint[];
  /** Face bounding box */
  boundingBox: { x: number; y: number; width: number; height: number };
  /** Face orientation */
  orientation: { yaw: number; pitch: number; roll: number };
  /** Canvas dimensions */
  canvasSize: { width: number; height: number };
  /** Whether video is mirrored */
  isMirrored: boolean;
} 