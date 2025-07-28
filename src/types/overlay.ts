/**
 * @fileoverview TypeScript types and interfaces for overlay system functionality.
 *
 * Defines types for overlay positioning, rendering, and management
 * for glasses and hat overlays in the enhancement phase.
 */

import type { FacialLandmark } from './tracking';

export type OverlayType = 'glasses' | 'hat' | 'combination';

export interface OverlayPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface OverlayConfig {
  id: string;
  type: OverlayType;
  name: string;
  imageUrl: string;
  defaultPosition: OverlayPosition;
  anchorPoints: number[]; // MediaPipe landmark indices
  constraints: {
    minScale: number;
    maxScale: number;
    minOpacity: number;
    maxOpacity: number;
    maxRotation: number;
  };
}

export interface ActiveOverlay {
  id: string;
  config: OverlayConfig;
  position: OverlayPosition;
  isVisible: boolean;
  isLocked: boolean;
}

export interface OverlayState {
  activeOverlays: ActiveOverlay[];
  selectedOverlayId: string | null;
  showPreview: boolean;
  isRendering: boolean;
  error: string | null;
}

export interface OverlayRenderData {
  overlay: ActiveOverlay;
  landmarks: FacialLandmark[];
  canvasContext: CanvasRenderingContext2D;
  videoElement: HTMLVideoElement;
}

export interface OverlayUpdateResult {
  success: boolean;
  position: OverlayPosition;
  error?: string;
}

export type OverlayError =
  | 'positioning-failed'
  | 'rendering-failed'
  | 'image-loading-failed'
  | 'landmarks-missing'
  | 'canvas-error'
  | 'unknown';

export interface OverlayMetrics {
  renderTime: number;
  positioningAccuracy: number;
  frameRate: number;
  memoryUsage: number;
}
