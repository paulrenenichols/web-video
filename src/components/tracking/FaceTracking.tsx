/**
 * @fileoverview Main face tracking component with basic visualization.
 *
 * Provides face bounding box overlay and basic tracking visualization
 * on top of the video feed. This is the foundation for more advanced
 * tracking features in later steps.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';

interface FaceTrackingProps {
  /** Whether tracking visualization is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Container className */
  className?: string;
  /** Video stream for fallback dimensions */
  stream?: MediaStream | null;
}

export const FaceTracking: React.FC<FaceTrackingProps> = ({
  isVisible,
  videoRef,
  className = '',
  stream,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Get tracking state
  const { status, faceDetection, facialLandmarks, confidence, faceCount } =
    useTrackingStore();

  /**
   * Draw face bounding box
   */
  const drawBoundingBox = useCallback(
    (ctx: CanvasRenderingContext2D, detection: any) => {
      console.log('🎯 drawBoundingBox called with:', detection);

      if (!detection.boundingBox) {
        console.log('❌ No bounding box data');
        return;
      }

      if (!videoRef.current) {
        console.log('❌ No video ref');
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('❌ No canvas ref');
        return;
      }

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Check if video dimensions are valid
      if (videoWidth === 0 || videoHeight === 0) {
        console.log('❌ Invalid video dimensions:', {
          videoWidth,
          videoHeight,
        });
        return;
      }

             console.log('📐 Dimensions:', {
         video: { width: videoWidth, height: videoHeight },
         canvas: { width: canvasWidth, height: canvasHeight },
         boundingBox: detection.boundingBox,
         canvasRect: canvas.getBoundingClientRect(),
       });

             // Convert normalized coordinates (0-1) to canvas coordinates
       // Check if video is mirrored (front-facing camera)
       const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;
       
       let x = detection.boundingBox.x * canvasWidth;
       const y = detection.boundingBox.y * canvasHeight;
       const width = detection.boundingBox.width * canvasWidth;
       const height = detection.boundingBox.height * canvasHeight;
       
       // Mirror the x coordinate if video is mirrored
       if (isMirrored) {
         x = canvasWidth - x;
       }

      console.log('🎨 Drawing box at:', { x, y, width, height });

      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - width / 2, y - height / 2, width, height);
      ctx.setLineDash([]);

      // Draw confidence text
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${(confidence * 100).toFixed(1)}%`,
        x - width / 2,
        y - height / 2 - 5
      );
    },
    [confidence, videoRef]
  );

  /**
   * Draw facial landmarks
   */
  const drawLandmarks = useCallback(
    (ctx: CanvasRenderingContext2D, landmarks: any) => {
      if (!landmarks || !videoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

             // Draw key landmarks for better facial tracking visualization
       const keyLandmarks = [
         10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,  // Face outline
         33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33,  // Right eyebrow
         362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362,  // Left eyebrow
         61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 61,  // Right eye
         291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 291,  // Left eye
         78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 78,  // Nose
         0, 267, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 0,  // Mouth outer
         78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 78,  // Mouth inner
       ];

       ctx.fillStyle = '#ff0000';
       ctx.strokeStyle = '#ff0000';
       ctx.lineWidth = 2;

                keyLandmarks.forEach(index => {
           const landmark = landmarks[index];
           if (landmark) {
             // Convert normalized coordinates (0-1) to canvas coordinates
             // Check if video is mirrored (front-facing camera)
             const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;
             
             let x = landmark.x * canvasWidth;
             const y = landmark.y * canvasHeight;
             
             // Mirror the x coordinate if video is mirrored
             if (isMirrored) {
               x = canvasWidth - x;
             }

             console.log(`📍 Drawing landmark ${index}:`, { x, y, visibility: landmark.visibility, isMirrored });

             ctx.beginPath();
             ctx.arc(x, y, 4, 0, 2 * Math.PI); // Larger dots (4px radius)
             ctx.fill();
           }
         });
    },
    [videoRef]
  );

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
   * Update canvas size to match video
   */
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      console.log('❌ Cannot update canvas size - missing canvas or video ref');
      return false;
    }

    // Try to get dimensions from video element first
    let videoWidth = video.videoWidth;
    let videoHeight = video.videoHeight;

    // If video dimensions are zero, try to get from stream
    if ((videoWidth === 0 || videoHeight === 0) && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        videoWidth = settings.width || 640;
        videoHeight = settings.height || 480;
        console.log('📹 Using stream dimensions:', { videoWidth, videoHeight });
      }
    }

    // If still no dimensions, use fallback
    if (videoWidth === 0 || videoHeight === 0) {
      console.log('⏳ Video not ready yet, using fallback dimensions');
      videoWidth = 640;
      videoHeight = 480;
    }

    // Get video display size
    const rect = video.getBoundingClientRect();

    // If display rect is zero, use video dimensions
    let displayWidth = rect.width;
    let displayHeight = rect.height;

    if (displayWidth === 0 || displayHeight === 0) {
      console.log('📐 Using video dimensions as display size');
      displayWidth = videoWidth;
      displayHeight = videoHeight;
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    console.log('📏 Canvas size updated:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      videoRect: rect,
      videoVideoWidth: video.videoWidth,
      videoVideoHeight: video.videoHeight,
      streamDimensions: { videoWidth, videoHeight },
    });

    return true;
  }, [videoRef, stream]);

  /**
   * Render tracking visualization
   */
  const render = useCallback(() => {
    if (!isVisible || !canvasRef.current) {
      clearCanvas();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if canvas is properly sized
    if (canvas.width === 0 || canvas.height === 0) {
      console.log('⏳ Canvas not sized yet, trying to update...');
      const success = updateCanvasSize();
      if (!success) {
        // Try again next frame
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
    }

    // Clear previous frame
    clearCanvas();

    console.log('🎨 Rendering tracking visualization:', {
      isVisible,
      status,
      hasFaceDetection: !!faceDetection,
      hasLandmarks: !!(facialLandmarks && facialLandmarks.landmarks.length > 0),
      canvasSize: { width: canvas.width, height: canvas.height },
    });

    // Draw a test rectangle to verify canvas is working (temporary)
    // ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    // ctx.fillRect(10, 10, 100, 50);
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(10, 10, 100, 50);

    // Draw bounding box if face is detected
    if (status === 'detected' && faceDetection && faceDetection.detected) {
      console.log('📦 Drawing bounding box:', faceDetection);
      drawBoundingBox(ctx, faceDetection);
    }

    // Draw landmarks if available
    if (facialLandmarks && facialLandmarks.landmarks.length > 0) {
      console.log(
        '📍 Drawing landmarks:',
        facialLandmarks.landmarks.length,
        'points'
      );
      drawLandmarks(ctx, facialLandmarks.landmarks);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    isVisible,
    status,
    faceDetection,
    facialLandmarks,
    clearCanvas,
    drawBoundingBox,
    drawLandmarks,
    updateCanvasSize,
  ]);

  // Handle canvas size updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoReady = () => {
      console.log('🎥 Video ready event fired');
      console.log('🎥 Video state:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime,
        duration: video.duration,
        rect: video.getBoundingClientRect(),
      });
      updateCanvasSize();
    };

    const handleResize = () => {
      updateCanvasSize();
    };

    // Listen for video ready events
    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);

    // Also try to update immediately
    updateCanvasSize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCanvasSize, videoRef]);

  // Handle rendering
  useEffect(() => {
    if (isVisible) {
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
  }, [isVisible, render, clearCanvas]);

  if (!isVisible) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 10,
      }}
    />
  );
};
