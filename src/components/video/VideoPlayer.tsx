/**
 * @fileoverview Video player component for camera display.
 *
 * Displays camera feed and handles basic video element functionality.
 * This is a foundational component that will be enhanced in later phases.
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onVideoProcess?: (videoElement: HTMLVideoElement) => Promise<void>;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  stream,
  className = '',
  autoPlay = true,
  muted = true,
  playsInline = true,
  onVideoProcess,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current || null, [videoRef.current]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    // Ensure video plays when stream is set
    if (autoPlay) {
      video.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, [stream, autoPlay]);

  // Set up MediaPipe processing for Step 1 testing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onVideoProcess || !stream) return;

    let animationFrameId: number;
    let isProcessing = false;

    const processFrame = async () => {
      if (!isProcessing) {
        isProcessing = true;
        try {
          await onVideoProcess(video);
        } catch (error) {
          console.error('Error processing video frame:', error);
        } finally {
          isProcessing = false;
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    // Start processing when video is ready
    const handleCanPlay = () => {
      processFrame();
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [stream, onVideoProcess]);

  if (!stream) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}
      >
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Camera not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${className}`}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        style={{ transform: 'scaleX(-1)' }} // Mirror the video
      />
    </div>
  );
});
