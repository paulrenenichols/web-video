/**
 * @fileoverview Main face tracking component with basic visualization.
 *
 * Provides face bounding box overlay and basic tracking visualization
 * on top of the video feed. This is the foundation for more advanced
 * tracking features in later steps.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTrackingStore } from '@/stores/tracking-store';
import { getKeyLandmarks } from '@/utils/tracking';

interface FaceTrackingProps {
  /** Whether tracking visualization is visible */
  isVisible: boolean;
  /** Video element reference */
  videoRef: React.RefObject<HTMLVideoElement | null>;
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Get tracking state
  const { status, faceDetection, facialLandmarks, confidence, faceCount } =
    useTrackingStore();

  /**
   * Draw face bounding box
   */
  const drawBoundingBox = useCallback(
    (ctx: CanvasRenderingContext2D, detection: any) => {

      if (!detection.boundingBox || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Check if video dimensions are valid
      if (videoWidth === 0 || videoHeight === 0) {
        return;
      }



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

             // Get key landmarks using utility function
             const keyLandmarksData = getKeyLandmarks(landmarks);
             const keyLandmarks = [
               ...keyLandmarksData.faceOutline,
               ...keyLandmarksData.eyes,
               ...keyLandmarksData.nose,
               ...keyLandmarksData.mouth
             ];

       ctx.fillStyle = '#ff0000';
       ctx.strokeStyle = '#ff0000';
       ctx.lineWidth = 2;

       
         
         let drawnCount = 0;
         let skippedCount = 0;
         
         keyLandmarks.forEach(index => {
           const landmark = landmarks[index];
           
           if (landmark && landmark.visibility > 0.5) { // Only draw landmarks with good visibility
             // Convert normalized coordinates (0-1) to canvas coordinates
             // Check if video is mirrored (front-facing camera)
             const isMirrored = video.style.transform?.includes('scaleX(-1)') || false;
             
             let x = landmark.x * canvasWidth;
             const y = landmark.y * canvasHeight;
             
             // Mirror the x coordinate if video is mirrored
             if (isMirrored) {
               x = canvasWidth - x;
             }

             drawnCount++;

             ctx.beginPath();
             ctx.arc(x, y, 4, 0, 2 * Math.PI); // Larger dots (4px radius)
             ctx.fill();
           } else {
             skippedCount++;
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



    // Draw a test rectangle to verify canvas is working (temporary)
    // ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    // ctx.fillRect(10, 10, 100, 50);
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(10, 10, 100, 50);

    // Draw bounding box if face is detected
    if (status === 'detected' && faceDetection && faceDetection.detected) {
  
      drawBoundingBox(ctx, faceDetection);
    }

    // Draw landmarks if available
    if (facialLandmarks && facialLandmarks.landmarks.length > 0) {
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
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 10,
        }}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-4 shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">Initializing tracking...</span>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <span>⚠️</span>
              <span className="font-medium">Tracking Error</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Status Indicator */}
      {status === 'detected' && faceCount > 0 && (
        <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-white">
              {faceCount} face{faceCount > 1 ? 's' : ''} detected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
