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
  private overlayImages: Record<string, HTMLImageElement> = {};
  private instanceId: string;
  private lastPositions: Record<
    string,
    { x: number; y: number; rotation: number }
  > = {};

  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
  }

  /**
   * @description Initialize overlay service with canvas
   * @param canvas - Canvas element for rendering overlays
   */
  initialize(canvas: HTMLCanvasElement): void {
    console.log('Initializing overlay service with canvas:', canvas);
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    if (!this.context) {
      throw new Error('Failed to get canvas context');
    }
    console.log('Overlay service initialized successfully');
  }

  /**
   * @description Load overlay image from URL
   * @param overlayId - Unique identifier for the overlay
   * @param imageUrl - URL of the overlay image
   * @returns Promise that resolves when image is loaded
   */
  async loadOverlayImage(overlayId: string, imageUrl: string): Promise<void> {
    console.log(`Loading overlay image: ${overlayId} from ${imageUrl}`);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        console.log(`Successfully loaded overlay image: ${overlayId}`);
        console.log(`Image object before storing:`, image);
        console.log(`Image complete:`, image.complete);
        console.log(`Image naturalWidth:`, image.naturalWidth);
        console.log(`Image naturalHeight:`, image.naturalHeight);
        this.overlayImages[overlayId] = image;
        resolve();
      };

      image.onerror = () => {
        console.error(
          `Failed to load overlay image: ${overlayId} from ${imageUrl}`
        );
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
      console.log(
        `[${this.instanceId}] calculateOverlayPosition called with landmarks:`,
        landmarks.landmarks.length
      );
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
        config,
        overlay.id
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
    console.log(
      `[${this.instanceId}] Total landmarks available:`,
      landmarks.landmarks.length
    );
    console.log(
      `[${this.instanceId}] Looking for anchor indices:`,
      anchorIndices
    );

    const anchorLandmarks = anchorIndices
      .map(index => {
        const landmark = landmarks.landmarks[index];
        console.log(`[${this.instanceId}] Index ${index}:`, landmark);
        return landmark;
      })
      .filter(landmark => landmark !== undefined);

    console.log(
      `[${this.instanceId}] Found anchor landmarks:`,
      anchorLandmarks.length
    );
    return anchorLandmarks;
  }

  /**
   * @description Compute overlay position from anchor landmarks
   * @param anchorLandmarks - Anchor landmarks for positioning
   * @param config - Overlay configuration
   * @param overlayId - Overlay identifier for smoothing
   * @returns Calculated overlay position
   */
  private computePositionFromLandmarks(
    anchorLandmarks: FacialLandmark[],
    config: OverlayConfig,
    overlayId: string
  ): OverlayPosition {
    // Calculate center point from anchor landmarks
    const centerX =
      anchorLandmarks.reduce((sum, p) => sum + p.x, 0) / anchorLandmarks.length;
    const centerY =
      anchorLandmarks.reduce((sum, p) => sum + p.y, 0) / anchorLandmarks.length;

    // Map coordinates from video space to canvas space
    const mappedPosition = this.mapVideoToCanvasCoordinates(centerX, centerY);

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
      mappedPosition.x,
      mappedPosition.y,
      scale,
      config.type
    );

    // Apply smoothing to reduce jitter
    const smoothedPosition = this.smoothPosition(overlayId, {
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      rotation,
    });

    return {
      x: smoothedPosition.x,
      y: smoothedPosition.y,
      width: config.defaultPosition.width * scale,
      height: config.defaultPosition.height * scale,
      rotation: smoothedPosition.rotation,
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

    // For glasses, use a more stable rotation calculation
    // Use the first few landmarks to calculate a horizontal baseline
    const numPoints = Math.min(4, anchorLandmarks.length);
    let totalDeltaY = 0;
    let totalDeltaX = 0;

    for (let i = 1; i < numPoints; i++) {
      const prev = anchorLandmarks[i - 1];
      const curr = anchorLandmarks[i];
      totalDeltaX += curr.x - prev.x;
      totalDeltaY += curr.y - prev.y;
    }

    // Calculate average rotation and apply smoothing
    const avgRotation = Math.atan2(totalDeltaY, totalDeltaX) * (180 / Math.PI);

    // Clamp rotation to prevent excessive movement
    const clampedRotation = Math.max(-15, Math.min(15, avgRotation));

    return clampedRotation;
  }

  /**
   * @description Map video coordinates to canvas coordinates
   * @param videoX - X coordinate in video space
   * @param videoY - Y coordinate in video space
   * @returns Mapped coordinates in canvas space
   */
  private mapVideoToCanvasCoordinates(
    videoX: number,
    videoY: number
  ): { x: number; y: number } {
    if (!this.canvas) {
      return { x: videoX, y: videoY };
    }

    // Get the video element from the canvas context
    const videoElement = this.canvas.parentElement?.querySelector(
      'video'
    ) as HTMLVideoElement;

    if (!videoElement) {
      return { x: videoX, y: videoY };
    }

    // Calculate scale factors
    const scaleX =
      this.canvas.width / (videoElement.videoWidth || videoElement.clientWidth);
    const scaleY =
      this.canvas.height /
      (videoElement.videoHeight || videoElement.clientHeight);

    // Apply scaling
    const canvasX = videoX * scaleX;
    const canvasY = videoY * scaleY;

    return { x: canvasX, y: canvasY };
  }

  /**
   * @description Smooth position to reduce jitter
   * @param overlayId - Overlay identifier
   * @param position - Current position
   * @returns Smoothed position
   */
  private smoothPosition(
    overlayId: string,
    position: { x: number; y: number; rotation: number }
  ): { x: number; y: number; rotation: number } {
    const lastPosition = this.lastPositions[overlayId];
    const smoothingFactor = 0.7; // Higher = more smoothing, lower = more responsive

    if (!lastPosition) {
      this.lastPositions[overlayId] = position;
      return position;
    }

    const smoothedPosition = {
      x: lastPosition.x * smoothingFactor + position.x * (1 - smoothingFactor),
      y: lastPosition.y * smoothingFactor + position.y * (1 - smoothingFactor),
      rotation:
        lastPosition.rotation * smoothingFactor +
        position.rotation * (1 - smoothingFactor),
    };

    this.lastPositions[overlayId] = smoothedPosition;
    return smoothedPosition;
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

    console.log(`Rendering ${overlays.length} overlays`);

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render each overlay
    overlays.forEach(overlay => {
      if (overlay.isVisible) {
        console.log(`Rendering overlay: ${overlay.id}`);
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

    console.log(
      `[${this.instanceId}] Looking for image with key: ${overlay.config.id}`
    );
    const image = this.overlayImages[overlay.config.id];

    if (!image) {
      console.warn(`Overlay image not found for: ${overlay.config.id}`);
      return;
    }

    // Check if image is fully loaded
    if (
      !image.complete ||
      image.naturalWidth === 0 ||
      image.naturalHeight === 0
    ) {
      console.warn(`Image not fully loaded for: ${overlay.config.id}`);
      return;
    }

    // Calculate position
    const positionResult = this.calculateOverlayPosition(overlay, landmarks);
    console.log(
      `[${this.instanceId}] Position calculation result:`,
      positionResult
    );

    if (!positionResult.success) {
      console.warn(
        `[${this.instanceId}] Position calculation failed:`,
        positionResult.error
      );
      return;
    }

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
    return this.overlayImages[overlayId] || null;
  }

  /**
   * @description Check if overlay image is loaded
   * @param overlayId - Overlay identifier
   * @returns True if image is loaded
   */
  isImageLoaded(overlayId: string): boolean {
    return overlayId in this.overlayImages;
  }

  /**
   * @description Clean up resources
   */
  cleanup(): void {
    this.overlayImages = {};
    this.canvas = null;
    this.context = null;
  }
}
