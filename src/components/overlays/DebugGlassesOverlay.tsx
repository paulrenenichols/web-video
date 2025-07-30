/**
 * @fileoverview Debug glasses overlay component.
 *
 * Provides debug visualization for overlay positioning, rendering, and management.
 * Handles canvas setup and basic rendering logic for facial overlays.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';
import { useTrackingStore } from '@/stores/tracking-store';
import { OverlayService } from '@/services/overlay.service';
import { calculateFaceOrientation } from '@/utils/tracking';

interface DebugGlassesOverlayProps {
  /** Whether debug glasses overlay is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
}

export const DebugGlassesOverlay: React.FC<DebugGlassesOverlayProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Get overlay and tracking state
  const {
    activeOverlays,
    isEnabled,
    mode,
    error,
  } = useOverlayStore();

  const {
    status,
    facialLandmarks,
    faceDetection,
  } = useTrackingStore();

  /**
   * Update canvas size to match video
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return false;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) return false;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    return true;
  }, [videoRef]);

  /**
   * Clear canvas
   */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Render overlays on canvas
   */
  const renderOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    clearCanvas();

    // Check if we have valid tracking data
    if (
      !isEnabled ||
      status !== 'detected' ||
      !facialLandmarks ||
      !faceDetection
    ) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Check if video is mirrored
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;
    
    // Debug mirroring detection
    console.log('🔍 Mirroring check - Video transform:', video.style.transform);
    console.log('🔍 Mirroring check - isMirrored:', isMirrored);

    // Calculate face orientation
    const orientation = calculateFaceOrientation(facialLandmarks.landmarks);

    // Create positioning context
    const positioningContext = {
      landmarks: facialLandmarks.landmarks,
      boundingBox: {
        x: faceDetection.boundingBox.x,
        y: faceDetection.boundingBox.y,
        width: faceDetection.boundingBox.width,
        height: faceDetection.boundingBox.height,
      },
      orientation,
      canvasSize: { width: canvasWidth, height: canvasHeight },
      isMirrored,
    };

    // Always render debug visualization for glasses positioning
    const renderDebugGlassesVisualization = () => {
      // Get eye landmarks
      const leftEye = facialLandmarks.landmarks[159]; // Left eye center
      const rightEye = facialLandmarks.landmarks[386]; // Right eye center
      const leftEyeOuter = facialLandmarks.landmarks[33]; // Left eye outer corner
      const rightEyeOuter = facialLandmarks.landmarks[263]; // Right eye outer corner

      if (leftEye && rightEye && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
        // Calculate eye positions
        let leftEyeX = leftEye.x * canvasWidth;
        const leftEyeY = leftEye.y * canvasHeight;
        let rightEyeX = rightEye.x * canvasWidth;
        const rightEyeY = rightEye.y * canvasHeight;
        
        if (isMirrored) {
          leftEyeX = canvasWidth - leftEyeX;
          rightEyeX = canvasWidth - rightEyeX;
        }

        // Calculate center between eyes
        const centerX = (leftEyeX + rightEyeX) / 2;
        const centerY = (leftEyeY + rightEyeY) / 2;

        // Calculate width based on eye span
        let eyeSpan = 100; // Default fallback
        if (leftEyeOuter && rightEyeOuter && leftEyeOuter.visibility > 0.5 && rightEyeOuter.visibility > 0.5) {
          let leftOuterX = leftEyeOuter.x * canvasWidth;
          let rightOuterX = rightEyeOuter.x * canvasWidth;
          
          if (isMirrored) {
            leftOuterX = canvasWidth - leftOuterX;
            rightOuterX = canvasWidth - rightOuterX;
          }
          
          eyeSpan = Math.abs(rightOuterX - leftOuterX);
        }
        
        const rectangleWidth = eyeSpan * 1.3; // 130% of eye span
        const rectangleHeight = rectangleWidth * 0.3; // 30% of width for height
        
        // Calculate rotation angle from eye positions
        const deltaX = rightEyeX - leftEyeX;
        const deltaY = rightEyeY - leftEyeY;
        const rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // Draw red dots for eye centers
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        // Draw red dot for center between eyes
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        // Draw green rectangle that bounds both eyes
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotationAngle * Math.PI) / 180);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(-rectangleWidth / 2, -rectangleHeight / 2, rectangleWidth, rectangleHeight);
        
        ctx.restore();

        console.log('🔍 Debug visualization - Left eye:', leftEyeX.toFixed(1), leftEyeY.toFixed(1));
        console.log('🔍 Debug visualization - Right eye:', rightEyeX.toFixed(1), rightEyeY.toFixed(1));
        console.log('🔍 Debug visualization - Center:', centerX.toFixed(1), centerY.toFixed(1));
        console.log('🔍 Debug visualization - Rectangle size:', rectangleWidth.toFixed(1), 'x', rectangleHeight.toFixed(1));
        console.log('🔍 Debug visualization - Rotation:', rotationAngle.toFixed(1), 'degrees');
      }
    };

    // Render debug visualization
    renderDebugGlassesVisualization();

    // Sort overlays by z-index
    const sortedOverlays = [...activeOverlays].sort((a, b) => a.position.zIndex - b.position.zIndex);

    // Render each overlay
    sortedOverlays.forEach(overlay => {
      if (!overlay.enabled || !overlay.rendering.visible) return;

      try {
        // For glasses overlays, skip the overlay service entirely
        let positionResult: any;
        
        if (overlay.config.type === 'glasses') {
          // Create a dummy position result for glasses (we'll calculate real position below)
          positionResult = {
            isValid: true,
            position: {
              x: 0, // Will be calculated below
              y: 0, // Will be calculated below
              width: 0, // Will be calculated below
              height: overlay.config.defaultPosition.height,
              rotation: 0,
              scale: 1,
            }
          };
        } else {
          // For non-glasses overlays, use the overlay service
          positionResult = OverlayService.calculateOverlayPosition(
            overlay.config,
            positioningContext
          );

          if (!positionResult.isValid) {
            console.warn(`Overlay ${overlay.config.name} position invalid:`, positionResult.error);
            return;
          }
        }

        // For glasses overlays, use the red eye tracking as the source of truth
        let canvasX: number;
        let canvasY: number;
        let canvasWidth_px: number;
        let canvasHeight_px: number;
        let rotationAngle: number = 0; // Default rotation angle

        if (overlay.config.type === 'glasses') {
          // Get eye landmarks
          const leftEye = facialLandmarks.landmarks[159]; // Left eye center
          const rightEye = facialLandmarks.landmarks[386]; // Right eye center
          const leftEyeOuter = facialLandmarks.landmarks[33]; // Left eye outer corner
          const rightEyeOuter = facialLandmarks.landmarks[263]; // Right eye outer corner

          if (leftEye && rightEye && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
            // Calculate eye positions using the same method as red circles
            let leftEyeX = leftEye.x * canvasWidth;
            const leftEyeY = leftEye.y * canvasHeight;
            let rightEyeX = rightEye.x * canvasWidth;
            const rightEyeY = rightEye.y * canvasHeight;
            
            if (isMirrored) {
              leftEyeX = canvasWidth - leftEyeX;
              rightEyeX = canvasWidth - rightEyeX;
            }

            // Calculate center between eyes (same as red center point)
            canvasX = (leftEyeX + rightEyeX) / 2;
            canvasY = (leftEyeY + rightEyeY) / 2;

            // Calculate width based on eye span
            if (leftEyeOuter && rightEyeOuter && leftEyeOuter.visibility > 0.5 && rightEyeOuter.visibility > 0.5) {
              let leftOuterX = leftEyeOuter.x * canvasWidth;
              let rightOuterX = rightEyeOuter.x * canvasWidth;
              
              if (isMirrored) {
                leftOuterX = canvasWidth - leftOuterX;
                rightOuterX = canvasWidth - rightOuterX;
              }
              
              const eyeSpan = Math.abs(rightOuterX - leftOuterX);
              canvasWidth_px = eyeSpan * 1.3; // 130% of eye span
            } else {
              // Fallback to overlay service width
              canvasWidth_px = positionResult.position.width * canvasWidth;
            }
            
            canvasHeight_px = positionResult.position.height * canvasHeight;
            
            // Calculate rotation angle from eye positions
            const deltaX = rightEyeX - leftEyeX;
            const deltaY = rightEyeY - leftEyeY;
            rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            console.log('🎯 Rotation calculation - DeltaX:', deltaX.toFixed(1), 'DeltaY:', deltaY.toFixed(1));
            console.log('🎯 Rotation calculation - Raw angle (radians):', Math.atan2(deltaY, deltaX).toFixed(3));
            console.log('🎯 Rotation calculation - Final angle (degrees):', rotationAngle.toFixed(1));
            
            console.log('🎯 Using red eye tracking for green rectangle positioning');
            console.log('🎯 Red eye tracking - Left eye:', leftEyeX.toFixed(1), leftEyeY.toFixed(1));
            console.log('🎯 Red eye tracking - Right eye:', rightEyeX.toFixed(1), rightEyeY.toFixed(1));
            console.log('🎯 Red eye tracking - Center:', canvasX.toFixed(1), canvasY.toFixed(1));
            console.log('🎯 Red eye tracking - Width:', canvasWidth_px.toFixed(1));
            console.log('🎯 Red eye tracking - Rotation angle:', rotationAngle.toFixed(1), 'degrees');
            console.log('🎯 Red eye tracking - Landmark data timestamp:', Date.now());
          } else {
            // Fallback to overlay service positioning
            canvasX = positionResult.position.x * canvasWidth;
            canvasY = positionResult.position.y * canvasHeight;
            canvasWidth_px = positionResult.position.width * canvasWidth;
            canvasHeight_px = positionResult.position.height * canvasHeight;
            
            if (isMirrored) {
              canvasX = canvasWidth - canvasX;
            }
          }
        } else {
          // For non-glasses overlays, use the original overlay service positioning
          canvasX = positionResult.position.x * canvasWidth;
          canvasY = positionResult.position.y * canvasHeight;
          canvasWidth_px = positionResult.position.width * canvasWidth;
          canvasHeight_px = positionResult.position.height * canvasHeight;

          if (isMirrored) {
            canvasX = canvasWidth - canvasX;
          }
        }

        console.log('🎨 Rendering overlay - Name:', overlay.config.name);
        console.log('🎨 Rendering overlay - Canvas position:', canvasX.toFixed(1), canvasY.toFixed(1));
        console.log('🎨 Rendering overlay - Size:', canvasWidth_px.toFixed(1), 'x', canvasHeight_px.toFixed(1));

        // Set rendering properties
        ctx.globalAlpha = overlay.rendering.opacity;
        ctx.globalCompositeOperation = overlay.rendering.blendMode;

        // Apply transformations
        ctx.save();
        
        // Note: MediaPipe landmarks are already in the correct coordinate system for mirrored video
        // No additional canvas mirroring needed
        
        // Apply overlay transformations
        ctx.translate(canvasX, canvasY);
        
        // Use calculated rotation for glasses, overlay service rotation for others
        const rotationToUse = overlay.config.type === 'glasses' ? rotationAngle : positionResult.position.rotation;
        console.log('🎨 Rotation application - Type:', overlay.config.type, 'Rotation used:', rotationToUse.toFixed(1), 'degrees');
        ctx.rotate((rotationToUse * Math.PI) / 180);
        ctx.scale(positionResult.position.scale, positionResult.position.scale);

        // For now, draw a placeholder rectangle
        // In future steps, this will be replaced with actual overlay images
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-canvasWidth_px / 2, -canvasHeight_px / 2, canvasWidth_px, canvasHeight_px);
        
        console.log('🎨 Rectangle drawing - Center position:', canvasX.toFixed(1), canvasY.toFixed(1));
        console.log('🎨 Rectangle drawing - Translation offset:', (canvasWidth_px / 2).toFixed(1), (canvasHeight_px / 2).toFixed(1));
        console.log('🎨 Rectangle drawing - Final center:', canvasX.toFixed(1), canvasY.toFixed(1));
        console.log('🎨 Rectangle drawing - Rectangle bounds:', (-canvasWidth_px / 2).toFixed(1), (-canvasHeight_px / 2).toFixed(1), canvasWidth_px.toFixed(1), canvasHeight_px.toFixed(1));

        // Draw overlay label
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(overlay.config.name, 0, -canvasHeight_px / 2 - 5);

        // Restore context
        ctx.restore();

        // Draw eye circles for debugging (red circles around eyes)
        if (overlay.config.type === 'glasses') {
          // Use the SAME landmarks that the overlay service used for positioning
          const leftEye = facialLandmarks.landmarks[159]; // Left eye center
          const rightEye = facialLandmarks.landmarks[386]; // Right eye center
          const leftEyeOuter = facialLandmarks.landmarks[33]; // Left eye outer corner
          const rightEyeOuter = facialLandmarks.landmarks[263]; // Right eye outer corner

          if (leftEye && rightEye && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
            // Calculate the SAME center position that the overlay service used
            const eyeCenterX = (leftEye.x + rightEye.x) / 2;
            const eyeCenterY = (leftEye.y + rightEye.y) / 2;
            
            // Convert to canvas coordinates using the SAME method as the overlay
            let eyeCenterCanvasX = eyeCenterX * canvasWidth;
            const eyeCenterCanvasY = eyeCenterY * canvasHeight;
            if (isMirrored) {
              eyeCenterCanvasX = canvasWidth - eyeCenterCanvasX;
            }
            
            // Draw left eye circle
            let leftEyeX = leftEye.x * canvasWidth;
            const leftEyeY = leftEye.y * canvasHeight;
            if (isMirrored) {
              leftEyeX = canvasWidth - leftEyeX;
            }
            
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, 8, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw right eye circle
            let rightEyeX = rightEye.x * canvasWidth;
            const rightEyeY = rightEye.y * canvasHeight;
            if (isMirrored) {
              rightEyeX = canvasWidth - rightEyeX;
            }
            
            ctx.beginPath();
            ctx.arc(rightEyeX, rightEyeY, 8, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw center point (where green rectangle should be)
            ctx.beginPath();
            ctx.arc(eyeCenterCanvasX, eyeCenterCanvasY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
            
            console.log('👁️ Eye center calculation - Left eye:', leftEyeX.toFixed(1), leftEyeY.toFixed(1));
            console.log('👁️ Eye center calculation - Right eye:', rightEyeX.toFixed(1), rightEyeY.toFixed(1));
            console.log('👁️ Eye center calculation - Center point:', eyeCenterCanvasX.toFixed(1), eyeCenterCanvasY.toFixed(1));
            console.log('👁️ Eye center calculation - Green rectangle position:', canvasX.toFixed(1), canvasY.toFixed(1));
            console.log('👁️ Eye center calculation - Landmark data timestamp:', Date.now());

            // Draw eye span line (from outer edge to outer edge)
            if (leftEyeOuter && rightEyeOuter && leftEyeOuter.visibility > 0.5 && rightEyeOuter.visibility > 0.5) {
              let leftOuterX = leftEyeOuter.x * canvasWidth;
              let rightOuterX = rightEyeOuter.x * canvasWidth;
              const outerY = (leftEyeOuter.y + rightEyeOuter.y) / 2 * canvasHeight;
              
              if (isMirrored) {
                leftOuterX = canvasWidth - leftOuterX;
                rightOuterX = canvasWidth - rightOuterX;
              }
              
              ctx.beginPath();
              ctx.moveTo(leftOuterX, outerY);
              ctx.lineTo(rightOuterX, outerY);
              ctx.strokeStyle = '#ff0000';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            console.log('👁️ Eye circles drawn - Left eye:', leftEyeX.toFixed(1), leftEyeY.toFixed(1));
            console.log('👁️ Eye circles drawn - Right eye:', rightEyeX.toFixed(1), rightEyeY.toFixed(1));
          }
        }

      } catch (error) {
        console.error(`Error rendering overlay ${overlay.config.name}:`, error);
      }
    });

    // Reset global properties
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [
    isEnabled,
    status,
    facialLandmarks,
    faceDetection,
    activeOverlays,
    clearCanvas,
    videoRef,
  ]);

  /**
   * Main render loop
   */
  const render = useCallback(() => {
    // Update canvas size if needed
    if (!updateCanvasSize()) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    // Render overlays
    renderOverlays();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateCanvasSize, renderOverlays]);

  // Handle canvas size updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      updateCanvasSize();
    };

    const handleResize = () => {
      updateCanvasSize();
    };

    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);
    window.addEventListener('resize', handleResize);

    updateCanvasSize();

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCanvasSize, videoRef]);

  // Handle rendering
  useEffect(() => {
    if (isVisible && isEnabled) {
      render();
    } else {
      clearCanvas();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, isEnabled, render, clearCanvas]);

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error('Overlay system error:', error);
    }
  }, [error]);

  if (!isVisible || !isEnabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 20,
      }}
    />
  );
}; 