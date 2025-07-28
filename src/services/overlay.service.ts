/**
 * @fileoverview Overlay positioning and rendering service for facial overlays.
 *
 * Handles overlay positioning based on facial landmarks, rendering
 * overlays on canvas, and managing overlay state and interactions.
 */

import type {
  ActiveOverlay,
  OverlayConfig,
  OverlayPosition,
  OverlayUpdateResult,
} from '@/types/overlay';
import type { FacialLandmarks, FacialLandmark } from '@/types/tracking';
import { OVERLAY_DEFAULT_SETTINGS } from '@/constants/overlays';

export class OverlayService {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private overlayImages: Map<string, HTMLImageElement> = new Map();

  /**
   * @description Initialize overlay service with canvas
   * @param canvas - Canvas element for rendering overlays
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    if (!this.context) {
      throw new Error('Failed to get canvas context');
    }
  }

  /**
   * @description Load overlay image from URL
   * @param overlayId - Unique identifier for the overlay
   * @param imageUrl - URL of the overlay image
   * @returns Promise that resolves when image is loaded
   */
  async loadOverlayImage(overlayId: string, imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        this.overlayImages.set(overlayId, image);
        resolve();
      };

      image.onerror = () => {
        reject(new Error(`Failed to load overlay image: ${imageUrl}`));
      };

      image.src = imageUrl;
    });
  }

  /**
   * @description Calculate overlay position based on facial landmarks
   * @param overlay - Active overlay configuration
   * @param landmarks - Current facial landmarks
   * @param videoElement - Video element for coordinate mapping
   * @returns Calculated overlay position
   */
  calculateOverlayPosition(
    overlay: ActiveOverlay,
    landmarks: FacialLandmarks
  ): OverlayUpdateResult {
    try {
      const { config } = overlay;
      const anchorLandmarks = this.getAnchorLandmarks(
        landmarks,
        config.anchorPoints
      );

      if (anchorLandmarks.length === 0) {
        return {
          success: false,
          position: overlay.position,
          error: 'No anchor landmarks found',
        };
      }

      const position = this.computePositionFromLandmarks(
        anchorLandmarks,
        config
      );

      return {
        success: true,
        position,
      };
    } catch (error) {
      return {
        success: false,
        position: overlay.position,
        error: error instanceof Error ? error.message : 'Positioning failed',
      };
    }
  }

  /**
   * @description Get anchor landmarks for overlay positioning
   * @param landmarks - All facial landmarks
   * @param anchorIndices - Indices of anchor points
   * @returns Array of anchor landmarks
   */
  private getAnchorLandmarks(
    landmarks: FacialLandmarks,
    anchorIndices: number[]
  ): FacialLandmark[] {
    return anchorIndices
      .map(index => landmarks.landmarks[index])
      .filter(landmark => landmark !== undefined);
  }

  /**
   * @description Compute overlay position from anchor landmarks
   * @param anchorLandmarks - Anchor landmarks for positioning
   * @param config - Overlay configuration
   * @param videoElement - Video element for coordinate mapping
   * @returns Calculated overlay position
   */
  private computePositionFromLandmarks(
    anchorLandmarks: FacialLandmark[],
    config: OverlayConfig
  ): OverlayPosition {
    // Calculate center point from anchor landmarks
    const centerX =
      anchorLandmarks.reduce((sum, p) => sum + p.x, 0) / anchorLandmarks.length;
    const centerY =
      anchorLandmarks.reduce((sum, p) => sum + p.y, 0) / anchorLandmarks.length;

    // Calculate bounding box of anchor points
    const xCoords = anchorLandmarks.map(p => p.x);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);

    // Calculate scale based on face size
    const faceWidth = maxX - minX;

    // Scale overlay based on face size and type
    const baseScale =
      config.type === 'glasses' ? faceWidth / 100 : faceWidth / 120;
    const scale = Math.max(
      config.constraints.minScale,
      Math.min(config.constraints.maxScale, baseScale)
    );

    // Calculate rotation based on face orientation
    const rotation = this.calculateFaceRotation(anchorLandmarks);

    // Apply type-specific positioning adjustments
    const adjustedPosition = this.applyTypeAdjustments(
      centerX,
      centerY,
      scale,
      config.type
    );

    return {
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      width: config.defaultPosition.width * scale,
      height: config.defaultPosition.height * scale,
      rotation,
      scale,
      opacity: OVERLAY_DEFAULT_SETTINGS.DEFAULT_OPACITY,
    };
  }

  /**
   * @description Calculate face rotation from landmarks
   * @param anchorLandmarks - Anchor landmarks
   * @returns Rotation angle in degrees
   */
  private calculateFaceRotation(anchorLandmarks: FacialLandmark[]): number {
    if (anchorLandmarks.length < 2) return 0;

    // Use first and last landmark to calculate rotation
    const first = anchorLandmarks[0];
    const last = anchorLandmarks[anchorLandmarks.length - 1];

    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;

    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  }

  /**
   * @description Apply type-specific positioning adjustments
   * @param centerX - Center X coordinate
   * @param centerY - Center Y coordinate
   * @param scale - Current scale
   * @param type - Overlay type
   * @returns Adjusted position
   */
  private applyTypeAdjustments(
    centerX: number,
    centerY: number,
    scale: number,
    type: string
  ): { x: number; y: number } {
    switch (type) {
      case 'glasses':
        // Position glasses slightly above eye level
        return {
          x: centerX,
          y: centerY - 10 * scale,
        };
      case 'hat':
        // Position hat above the head
        return {
          x: centerX,
          y: centerY - 50 * scale,
        };
      default:
        return { x: centerX, y: centerY };
    }
  }

  /**
   * @description Render overlays on canvas
   * @param overlays - Array of active overlays to render
   * @param landmarks - Current facial landmarks
   * @param videoElement - Video element for reference
   */
  renderOverlays(overlays: ActiveOverlay[], landmarks: FacialLandmarks): void {
    if (!this.context || !this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render each overlay
    overlays.forEach(overlay => {
      if (overlay.isVisible) {
        this.renderOverlay(overlay, landmarks);
      }
    });
  }

  /**
   * @description Render a single overlay
   * @param overlay - Active overlay to render
   * @param landmarks - Current facial landmarks
   * @param videoElement - Video element for reference
   */
  private renderOverlay(
    overlay: ActiveOverlay,
    landmarks: FacialLandmarks
  ): void {
    if (!this.context) return;

    const image = this.overlayImages.get(overlay.config.id);
    if (!image) return;

    // Calculate position
    const positionResult = this.calculateOverlayPosition(overlay, landmarks);
    if (!positionResult.success) return;

    const { position } = positionResult;

    // Save context state
    this.context.save();

    // Apply transformations
    this.context.translate(position.x, position.y);
    this.context.rotate((position.rotation * Math.PI) / 180);
    this.context.scale(position.scale, position.scale);

    // Set opacity
    this.context.globalAlpha = position.opacity;

    // Draw image
    this.context.drawImage(
      image,
      -position.width / 2,
      -position.height / 2,
      position.width,
      position.height
    );

    // Restore context state
    this.context.restore();
  }

  /**
   * @description Update overlay position based on new landmarks
   * @param overlay - Active overlay to update
   * @param landmarks - New facial landmarks
   * @param videoElement - Video element for reference
   * @returns Updated overlay with new position
   */
  updateOverlayPosition(
    overlay: ActiveOverlay,
    landmarks: FacialLandmarks
  ): ActiveOverlay {
    const positionResult = this.calculateOverlayPosition(overlay, landmarks);

    return {
      ...overlay,
      position: positionResult.success
        ? positionResult.position
        : overlay.position,
    };
  }

  /**
   * @description Get overlay image by ID
   * @param overlayId - Overlay identifier
   * @returns Overlay image element or null
   */
  getOverlayImage(overlayId: string): HTMLImageElement | null {
    return this.overlayImages.get(overlayId) || null;
  }

  /**
   * @description Check if overlay image is loaded
   * @param overlayId - Overlay identifier
   * @returns True if image is loaded
   */
  isImageLoaded(overlayId: string): boolean {
    return this.overlayImages.has(overlayId);
  }

  /**
   * @description Clean up resources
   */
  cleanup(): void {
    this.overlayImages.clear();
    this.canvas = null;
    this.context = null;
  }
}
