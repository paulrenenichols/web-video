/**
 * @fileoverview Debug visualization component for hat overlays.
 *
 * Shows green bounding boxes and positioning indicators for hat overlays
 * when debug mode is enabled, regardless of active overlays.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';

interface DebugHatsOverlayProps {
  /** Whether debug hat overlay is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Container className */
  className?: string;
}

export const DebugHatsOverlay: React.FC<DebugHatsOverlayProps> = ({
  isVisible,
  videoRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const { status, facialLandmarks, faceDetection } = useTrackingStore();

  /**
   * Update canvas size to match video dimensions
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [videoRef]);

  /**
   * Clear canvas
   */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Calculate hat position based on head landmarks
   */
  const calculateHatPosition = useCallback(
    (facialLandmarksData: any) => {
      // Check if we have facial landmarks data and it has the landmarks array
      if (
        !facialLandmarksData ||
        !facialLandmarksData.landmarks ||
        !Array.isArray(facialLandmarksData.landmarks) ||
        facialLandmarksData.landmarks.length < 468
      ) {
        console.log('🎩 DebugHatsOverlay - Invalid facial landmarks data:', {
          exists: !!facialLandmarksData,
          hasLandmarks: !!facialLandmarksData?.landmarks,
          isArray: Array.isArray(facialLandmarksData?.landmarks),
          length: facialLandmarksData?.landmarks?.length || 0,
        });
        return null;
      }

      const landmarks = facialLandmarksData.landmarks;

      // Debug: Check what landmarks are available
      console.log(
        '🎩 DebugHatsOverlay - Total landmarks available:',
        landmarks.length
      );
      console.log(
        '🎩 DebugHatsOverlay - Sample landmarks 0-10:',
        landmarks
          .slice(0, 10)
          .map((lm, i) => `[${i}]: ${lm ? 'exists' : 'missing'}`)
      );

      // Use exactly 4 landmarks for hat positioning as specified
      // Center forehead above eyebrows (2 dots), top of forehead, above eyes
      const foreheadLandmarks = [
        landmarks[108], // Center forehead above eyebrows (left)
        landmarks[337], // Center forehead above eyebrows (right)
        landmarks[9], // Top of forehead
        landmarks[10], // Above eyes (nose bridge)
      ];

      // Use forehead landmarks for centering
      const foreheadLeft = landmarks[108]; // Left forehead
      const foreheadRight = landmarks[337]; // Right forehead

      // Check if we have enough landmarks
      const allLandmarks = [...foreheadLandmarks, foreheadLeft, foreheadRight];
      if (allLandmarks.some(lm => !lm)) {
        console.log(
          '🎩 DebugHatsOverlay - Missing landmarks:',
          allLandmarks.map((lm, i) =>
            lm ? 'exists' : `missing at index ${[108, 337, 9, 10, 108, 337][i]}`
          )
        );
        return null;
      }

      // Use face detection bounding box for accurate head width
      // This gives us the actual detected head width instead of calculated
      // The green bounding box will now match the actual head size being detected
      const headWidth = faceDetection?.boundingBox?.width || 0.3; // Fallback to 30% of screen width

      // Calculate head height from forehead to chin
      const foreheadY = Math.min(...foreheadLandmarks.map(lm => lm.y));
      const chinY = Math.max(...landmarks.slice(0, 50).map(lm => lm.y)); // Use first 50 landmarks for chin
      const headHeight = chinY - foreheadY;

      // Position hat above the forehead
      const hatY = foreheadY - headHeight * 0.4; // 40% above forehead
      const hatHeight = headHeight * 0.6; // 60% of head height
      const hatWidth = headWidth * 1.1; // 110% of head width for hat coverage

      // Center the hat horizontally using forehead landmarks
      const headCenterX = (foreheadLeft.x + foreheadRight.x) / 2;
      const hatX = headCenterX - hatWidth / 2;

      return {
        x: hatX,
        y: hatY,
        width: hatWidth,
        height: hatHeight,
      };
    },
    [faceDetection]
  );

  /**
   * Render debug hat visualization
   */
  const renderDebugHatsVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    if (!canvas || !ctx || !facialLandmarks || !video) return;

    // Clear canvas
    clearCanvas();

    // Check if video is mirrored
    const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;

    // Calculate hat position
    const hatPosition = calculateHatPosition(facialLandmarks);
    if (!hatPosition) return;

    // Draw exactly 4 landmarks as red dots: center forehead above eyebrows (2), top forehead, above eyes
    const foreheadLandmarks = [108, 337, 9, 10];
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    foreheadLandmarks.forEach(landmarkIndex => {
      const landmark = facialLandmarks.landmarks[landmarkIndex];
      if (landmark) {
        let x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        // Apply mirroring if needed
        if (isMirrored) {
          x = canvas.width - x;
        }

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw forehead landmarks used for rotation (blue dots) for reference
    const rotationLandmarks = [108, 337]; // Left and right forehead landmarks used for rotation
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    rotationLandmarks.forEach(landmarkIndex => {
      const landmark = facialLandmarks.landmarks[landmarkIndex];
      if (landmark) {
        let x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        // Apply mirroring if needed
        if (isMirrored) {
          x = canvas.width - x;
        }

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw center point between the 4 specified landmarks (only if all landmarks exist)
    // Use exactly the same 4 landmarks for center calculation
    const keyForeheadLandmarks = [108, 337, 9, 10]; // Center forehead above eyebrows (2), top forehead, above eyes
    const existingKeyLandmarks = keyForeheadLandmarks.filter(
      index => facialLandmarks.landmarks[index]
    );
    if (existingKeyLandmarks.length === keyForeheadLandmarks.length) {
      let centerX =
        existingKeyLandmarks.reduce(
          (sum, index) => sum + facialLandmarks.landmarks[index].x,
          0
        ) / existingKeyLandmarks.length;
      const centerY =
        existingKeyLandmarks.reduce(
          (sum, index) => sum + facialLandmarks.landmarks[index].y,
          0
        ) / existingKeyLandmarks.length;

      // Apply mirroring to center point if needed
      if (isMirrored) {
        centerX = 1 - centerX;
      }

      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(
        centerX * canvas.width,
        centerY * canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Calculate rotation angle from forehead landmarks for stable head orientation
    // Using forehead landmarks instead of eyes for more stable rotation
    // This prevents tilting when blinking, winking, or making facial expressions
    const foreheadLeft = facialLandmarks.landmarks[108]; // Left forehead
    const foreheadRight = facialLandmarks.landmarks[337]; // Right forehead

    let rotationAngle = 0;
    if (
      foreheadLeft &&
      foreheadRight &&
      foreheadLeft.visibility > 0.5 &&
      foreheadRight.visibility > 0.5
    ) {
      let leftX = foreheadLeft.x * canvas.width;
      let rightX = foreheadRight.x * canvas.width;

      // Apply mirroring to forehead positions if needed
      if (isMirrored) {
        leftX = canvas.width - leftX;
        rightX = canvas.width - rightX;
      }

      const deltaX = rightX - leftX;
      const deltaY = (foreheadRight.y - foreheadLeft.y) * canvas.height;
      rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    }

    // Draw hat bounding box (green rectangle) with rotation
    let hatX = hatPosition.x * canvas.width;
    const hatY = hatPosition.y * canvas.height;
    const hatWidth = hatPosition.width * canvas.width;
    const hatHeight = hatPosition.height * canvas.height;

    // Apply mirroring to hat position if needed
    if (isMirrored) {
      hatX = canvas.width - hatX - hatWidth;
    }

    // Calculate hat center for rotation
    const hatCenterX = hatX + hatWidth / 2;
    const hatCenterY = hatY + hatHeight / 2;

    // Draw rotated hat bounding box
    ctx.save();
    ctx.translate(hatCenterX, hatCenterY);
    ctx.rotate((rotationAngle * Math.PI) / 180);

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hatWidth / 2, -hatHeight / 2, hatWidth, hatHeight);

    ctx.restore();

    // Draw hat label (also rotated)
    ctx.save();
    ctx.translate(hatCenterX, hatCenterY);
    ctx.rotate((rotationAngle * Math.PI) / 180);

    // Rotate text 180 degrees so it reads left to right from viewer's perspective
    ctx.rotate(Math.PI);

    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText('Hat Position', -hatWidth / 2, -hatHeight / 2 - 15);

    ctx.restore();
  }, [canvasRef, facialLandmarks, calculateHatPosition, clearCanvas]);

  /**
   * Main render function
   */
  const render = useCallback(() => {
    // Always clear canvas first
    clearCanvas();

    // If not visible, just clear and return (no further rendering)
    if (!isVisible) {
      return;
    }

    // If no face detected or no landmarks, just clear and return
    if (status !== 'detected' || !facialLandmarks || !faceDetection) {
      return;
    }

    // Only render if we have valid facial landmarks with confidence
    if (facialLandmarks.confidence < 0.5) {
      console.log(
        '🎩 DebugHatsOverlay - Low confidence landmarks:',
        facialLandmarks.confidence
      );
      return;
    }

    renderDebugHatsVisualization();
  }, [
    isVisible,
    status,
    facialLandmarks,
    faceDetection,
    renderDebugHatsVisualization,
    clearCanvas,
  ]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      updateCanvasSize();
      render();
    };

    const handleResize = () => {
      updateCanvasSize();
      render();
    };

    video.addEventListener('loadedmetadata', handleVideoReady);
    window.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, updateCanvasSize, render]);

  // Render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Clear canvas when visibility changes
  useEffect(() => {
    if (!isVisible) {
      clearCanvas();
    }
  }, [isVisible, clearCanvas]);

  // Return canvas element
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 15 }}
    />
  );
};
