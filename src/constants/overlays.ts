/**
 * @fileoverview Overlay configuration constants for glasses and hat overlays.
 *
 * Defines predefined overlay configurations including positioning,
 * anchor points, and rendering constraints for the enhancement phase.
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
    anchorPoints: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385,
      384, 398,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 15,
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
    anchorPoints: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385,
      384, 398,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.7,
      maxOpacity: 1,
      maxRotation: 10,
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
      height: 50,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    anchorPoints: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385,
      384, 398,
    ],
    constraints: {
      minScale: 0.7,
      maxScale: 1.3,
      minOpacity: 0.8,
      maxOpacity: 1,
      maxRotation: 20,
    },
  },
];

export const HAT_OVERLAYS: OverlayConfig[] = [
  {
    id: 'hat-baseball',
    type: 'hat',
    name: 'Baseball Cap',
    imageUrl: '/overlays/hats/baseball.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 140,
      height: 80,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    anchorPoints: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.8,
      maxOpacity: 1,
      maxRotation: 25,
    },
  },
  {
    id: 'hat-cowboy',
    type: 'hat',
    name: 'Cowboy Hat',
    imageUrl: '/overlays/hats/cowboy.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 160,
      height: 90,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    anchorPoints: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ],
    constraints: {
      minScale: 0.7,
      maxScale: 1.3,
      minOpacity: 0.8,
      maxOpacity: 1,
      maxRotation: 30,
    },
  },
  {
    id: 'hat-party',
    type: 'hat',
    name: 'Party Hat',
    imageUrl: '/overlays/hats/party.svg',
    defaultPosition: {
      x: 0,
      y: 0,
      width: 120,
      height: 100,
      rotation: 0,
      scale: 1,
      opacity: 1,
    },
    anchorPoints: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ],
    constraints: {
      minScale: 0.8,
      maxScale: 1.2,
      minOpacity: 0.9,
      maxOpacity: 1,
      maxRotation: 20,
    },
  },
];

export const ALL_OVERLAYS = [...GLASSES_OVERLAYS, ...HAT_OVERLAYS];

export const OVERLAY_CATEGORIES = {
  glasses: GLASSES_OVERLAYS,
  hats: HAT_OVERLAYS,
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
