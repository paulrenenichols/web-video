/**
 * @fileoverview Overlay configuration constants for glasses and hats.
 *
 * Defines the visual properties, positioning constraints, and anchor points
 * for different types of facial overlays in the enhancement phase.
 */

import type { OverlayConfig } from '@/types/overlay';

export const GLASSES_OVERLAYS: OverlayConfig[] = [
  {
    id: 'glasses-sunglasses',
    type: 'glasses',
    name: 'Sunglasses',
    imageUrl: '/overlays/glasses/sunglasses.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to eye regions in our mock landmark generation
    // Left eye: indices 245-304, Right eye: indices 304-363
    anchorPoints: [
      245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
      260,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 5,
    },
  },
  {
    id: 'glasses-reading',
    type: 'glasses',
    name: 'Reading Glasses',
    imageUrl: '/overlays/glasses/reading.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 110,
      height: 35,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to eye regions in our mock landmark generation
    anchorPoints: [
      245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
      260,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 5,
    },
  },
  {
    id: 'glasses-goggles',
    type: 'glasses',
    name: 'Goggles',
    imageUrl: '/overlays/glasses/goggles.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 130,
      height: 45,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to eye regions in our mock landmark generation
    anchorPoints: [
      245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
      260,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 5,
    },
  },
];

export const HATS_OVERLAYS: OverlayConfig[] = [
  {
    id: 'hats-baseball',
    type: 'hat',
    name: 'Baseball Cap',
    imageUrl: '/overlays/hats/baseball.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 100,
      height: 60,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to face outline in our mock landmark generation
    // Face outline: indices 0-68
    anchorPoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    constraints: {
      minScale: 0.8,
      maxScale: 1.3,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 15,
    },
  },
  {
    id: 'hats-cowboy',
    type: 'hat',
    name: 'Cowboy Hat',
    imageUrl: '/overlays/hats/cowboy.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 120,
      height: 70,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to face outline in our mock landmark generation
    // Face outline: indices 0-68
    anchorPoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    constraints: {
      minScale: 0.8,
      maxScale: 1.3,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 15,
    },
  },
  {
    id: 'hats-party',
    type: 'hat',
    name: 'Party Hat',
    imageUrl: '/overlays/hats/party.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 80,
      height: 100,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    // Use indices that correspond to face outline in our mock landmark generation
    // Face outline: indices 0-68
    anchorPoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    constraints: {
      minScale: 0.8,
      maxScale: 1.3,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 15,
    },
  },
];

// Fallback overlay configuration for when MediaPipe fails
export const FALLBACK_OVERLAY_CONFIG: OverlayConfig = {
  id: 'fallback-glasses',
  type: 'glasses',
  name: 'Fallback Glasses',
  imageUrl: '/overlays/glasses/sunglasses.svg',
  defaultPosition: {
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    rotation: 0,
    scale: 1,
    opacity: 1,
  },
  anchorPoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  constraints: {
    minScale: 0.8,
    maxScale: 1.2,
    minOpacity: 0.7,
    maxOpacity: 1,
    maxRotation: 5,
  },
};

export const ALL_OVERLAYS = [...GLASSES_OVERLAYS, ...HATS_OVERLAYS];

export const OVERLAY_CATEGORIES = {
  glasses: GLASSES_OVERLAYS,
  hats: HATS_OVERLAYS,
} as const;

export const OVERLAY_DEFAULT_SETTINGS = {
  DEFAULT_OPACITY: 1,
  DEFAULT_SCALE: 1,
  DEFAULT_ROTATION: 0,
  MIN_OPACITY: 0.3,
  MAX_OPACITY: 1,
  MIN_SCALE: 0.5,
  MAX_SCALE: 2,
  MIN_ROTATION: -45,
  MAX_ROTATION: 45,
} as const;
