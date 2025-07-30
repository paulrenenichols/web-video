/**
 * @fileoverview Overlay service for positioning and rendering calculations.
 *
 * Handles overlay positioning calculations based on facial landmarks,
 * provides utilities for overlay rendering and transformation.
 */

import {
  OverlayConfig,
  OverlayPosition,
  OverlayPositionResult,
  OverlayPositioningContext,
  OverlayType,
} from '@/types/overlay';
import { LandmarkPoint } from '@/types/tracking';
import { calculateFaceOrientation } from '@/utils/tracking';

/**
 * Overlay service for positioning and rendering calculations
 */
export class OverlayService {
  /**
   * Calculate overlay position based on facial landmarks
   */
  static calculateOverlayPosition(
    config: OverlayConfig,
    context: OverlayPositioningContext
  ): OverlayPositionResult {
    try {
      const { landmarks, boundingBox, orientation, canvasSize, isMirrored } = context;

      // Get anchor landmark
      const anchorLandmark = landmarks[config.anchors.primary];
      if (!anchorLandmark || anchorLandmark.visibility < 0.5) {
        return {
          position: config.defaultPosition,
          confidence: 0,
          isValid: false,
          error: 'Anchor landmark not visible',
        };
      }

      // Calculate base position from anchor
      let baseX = anchorLandmark.x;
      let baseY = anchorLandmark.y;

      // Apply offset
      baseX += config.anchors.offset.x;
      baseY += config.anchors.offset.y;

      // Calculate scale based on face size
      const faceWidth = boundingBox.width;
      const faceHeight = boundingBox.height;
      const scale = this.calculateScale(config, faceWidth, faceHeight);

      // Calculate rotation based on face orientation
      const rotation = this.calculateRotation(config, orientation);

      // Calculate final dimensions
      const width = config.defaultPosition.width * scale;
      const height = config.defaultPosition.height * scale;

      // Create initial position
      const initialPosition = { x: baseX, y: baseY, width, height, rotation, scale, zIndex: config.defaultPosition.zIndex };

      // Adjust position for overlay type
      const adjustedPosition = this.adjustPositionForType(
        config.type,
        initialPosition,
        context
      );

      // Note: MediaPipe landmarks are already in the correct coordinate system for mirrored video
      // No additional mirroring needed for overlay positioning
      // if (isMirrored) {
      //   adjustedPosition.x = 1 - adjustedPosition.x;
      // }

      // Calculate confidence based on landmark visibility
      const confidence = this.calculateConfidence(landmarks, config);

      return {
        position: adjustedPosition,
        confidence,
        isValid: true,
      };
    } catch (error) {
      return {
        position: config.defaultPosition,
        confidence: 0,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate scale factor based on face size
   */
  private static calculateScale(
    config: OverlayConfig,
    faceWidth: number,
    faceHeight: number
  ): number {
    const baseScale = config.scaling.base;
    const widthScale = faceWidth * config.scaling.widthFactor;
    const heightScale = faceHeight * config.scaling.heightFactor;
    
    return baseScale * (widthScale + heightScale) / 2;
  }

  /**
   * Calculate rotation based on face orientation
   */
  private static calculateRotation(
    config: OverlayConfig,
    orientation: { yaw: number; pitch: number; roll: number }
  ): number {
    // Different overlay types respond differently to face orientation
    switch (config.type) {
      case OverlayType.GLASSES:
        // Glasses follow roll (tilt) and some yaw
        return orientation.roll * 0.5 + orientation.yaw * 0.3;
      
      case OverlayType.HAT:
        // Hats follow roll and pitch
        return orientation.roll * 0.7 + orientation.pitch * 0.3;
      
      case OverlayType.MASK:
        // Masks follow all orientations
        return orientation.roll * 0.6 + orientation.yaw * 0.2 + orientation.pitch * 0.2;
      
      default:
        // Default to roll only
        return orientation.roll * 0.5;
    }
  }

  /**
   * Adjust position based on overlay type
   */
  private static adjustPositionForType(
    type: OverlayType,
    position: OverlayPosition,
    context: OverlayPositioningContext
  ): OverlayPosition {
    const { landmarks, boundingBox } = context;

    switch (type) {
      case OverlayType.GLASSES:
        return this.adjustGlassesPosition(position, landmarks, boundingBox);
      
      case OverlayType.HAT:
        return this.adjustHatPosition(position, landmarks);
      
      case OverlayType.MASK:
        return this.adjustMaskPosition(position, landmarks);
      
      default:
        return position;
    }
  }

  /**
   * Adjust position for glasses
   */
  private static adjustGlassesPosition(
    position: OverlayPosition,
    landmarks: LandmarkPoint[],
    boundingBox?: { x: number; y: number; width: number; height: number }
  ): OverlayPosition {
    // Use eye landmarks for precise positioning
    const leftEye = landmarks[159]; // Left eye center
    const rightEye = landmarks[386]; // Right eye center
    const leftEyeOuter = landmarks[33]; // Left eye outer corner
    const rightEyeOuter = landmarks[263]; // Right eye outer corner

    if (leftEye && rightEye && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
      if (leftEyeOuter && rightEyeOuter && leftEyeOuter.visibility > 0.5 && rightEyeOuter.visibility > 0.5) {
        // Calculate eye span (distance between outer edges)
        const eyeSpan = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
        
        // Position at center between eye centers
        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;

        // Calculate glasses width based on eye span
        const glassesWidth = eyeSpan * 1.3; // 30% wider than eye span

        return {
          ...position,
          x: eyeCenterX,
          y: eyeCenterY,
          width: glassesWidth,
        };
      }
    }

    return position;
  }

  /**
   * Adjust position for hat
   */
  private static adjustHatPosition(
    position: OverlayPosition,
    landmarks: LandmarkPoint[]
  ): OverlayPosition {
    // Use forehead landmarks for hat positioning
    const forehead = landmarks[10]; // Forehead center

    if (forehead && forehead.visibility > 0.5) {
      return {
        ...position,
        x: forehead.x,
        y: forehead.y - 0.1, // Slightly above forehead
      };
    }

    return position;
  }

  /**
   * Adjust position for mask
   */
  private static adjustMaskPosition(
    position: OverlayPosition,
    landmarks: LandmarkPoint[]
  ): OverlayPosition {
    // Use nose and mouth landmarks for mask positioning
    const nose = landmarks[1]; // Nose tip
    const mouth = landmarks[13]; // Mouth center

    if (nose && nose.visibility > 0.5) {
      return {
        ...position,
        x: nose.x,
        y: nose.y + 0.05, // Slightly below nose
      };
    }

    return position;
  }

  /**
   * Calculate confidence score for overlay positioning
   */
  private static calculateConfidence(
    landmarks: LandmarkPoint[],
    config: OverlayConfig
  ): number {
    // Check visibility of anchor landmarks
    const anchorVisibility = landmarks[config.anchors.primary]?.visibility || 0;
    
    // Check visibility of secondary anchors if they exist
    let secondaryVisibility = 1;
    if (config.anchors.secondary) {
      const secondaryVisibilities = config.anchors.secondary.map(
        index => landmarks[index]?.visibility || 0
      );
      secondaryVisibility = secondaryVisibilities.reduce((sum, v) => sum + v, 0) / secondaryVisibilities.length;
    }

    // Combine visibilities
    const confidence = (anchorVisibility * 0.7) + (secondaryVisibility * 0.3);
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Validate overlay position
   */
  static validatePosition(
    position: OverlayPosition,
    canvasSize: { width: number; height: number }
  ): boolean {
    // Check if position is within canvas bounds
    const margin = 0.1; // Allow 10% margin outside canvas
    
    const minX = -margin;
    const maxX = 1 + margin;
    const minY = -margin;
    const maxY = 1 + margin;

    return (
      position.x >= minX && position.x <= maxX &&
      position.y >= minY && position.y <= maxY &&
      position.width > 0 && position.height > 0 &&
      position.scale > 0
    );
  }

  /**
   * Smooth overlay position transition
   */
  static smoothPosition(
    currentPosition: OverlayPosition,
    targetPosition: OverlayPosition,
    smoothingFactor: number = 0.3
  ): OverlayPosition {
    return {
      x: currentPosition.x + (targetPosition.x - currentPosition.x) * smoothingFactor,
      y: currentPosition.y + (targetPosition.y - currentPosition.y) * smoothingFactor,
      width: currentPosition.width + (targetPosition.width - currentPosition.width) * smoothingFactor,
      height: currentPosition.height + (targetPosition.height - currentPosition.height) * smoothingFactor,
      rotation: currentPosition.rotation + (targetPosition.rotation - currentPosition.rotation) * smoothingFactor,
      scale: currentPosition.scale + (targetPosition.scale - currentPosition.scale) * smoothingFactor,
      zIndex: targetPosition.zIndex, // Don't smooth z-index
    };
  }

  /**
   * Check if overlays can be combined (no conflicts)
   */
  static canCombineOverlays(overlays: ActiveOverlay[]): boolean {
    // Check for conflicts between overlay types
    const glassesCount = overlays.filter(o => o.config.type === OverlayType.GLASSES).length;
    const hatCount = overlays.filter(o => o.config.type === OverlayType.HAT).length;
    
    // Only one glasses and one hat allowed
    return glassesCount <= 1 && hatCount <= 1;
  }

  /**
   * Get optimal z-index for overlay type
   */
  static getOptimalZIndex(overlayType: OverlayType): number {
    switch (overlayType) {
      case OverlayType.GLASSES:
        return 1; // Glasses behind hats
      case OverlayType.HAT:
        return 2; // Hats on top
      default:
        return 1;
    }
  }

  /**
   * Validate overlay combination
   */
  static validateOverlayCombination(overlays: ActiveOverlay[]): {
    isValid: boolean;
    conflicts: string[];
  } {
    const conflicts: string[] = [];
    
    // Check for multiple glasses
    const glassesOverlays = overlays.filter(o => o.config.type === OverlayType.GLASSES);
    if (glassesOverlays.length > 1) {
      conflicts.push('Multiple glasses selected');
    }
    
    // Check for multiple hats
    const hatOverlays = overlays.filter(o => o.config.type === OverlayType.HAT);
    if (hatOverlays.length > 1) {
      conflicts.push('Multiple hats selected');
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }
} 