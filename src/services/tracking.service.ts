/**
 * @fileoverview Facial tracking service using MediaPipe Face Mesh.
 *
 * Provides facial landmark tracking using MediaPipe's robust face mesh system
 * that works across all browsers and provides accurate overlay positioning.
 */

import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import type {
  FacialLandmarks,
  TrackingConfig,
  FaceDetectionResult,
  TrackingError,
} from '@/types/tracking';
import { PERFORMANCE_THRESHOLDS } from '@/constants/tracking';

export class TrackingService {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isInitialized = false;
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private onResultCallback:
    | ((result: FaceDetectionResult) => void)
    | undefined = undefined;

  private performanceMetrics = {
    fps: 0,
    latency: 0,
    accuracy: 0,
    frameCount: 0,
    lastFrameTime: 0,
  };

  /**
   * @description Initialize MediaPipe face mesh
   * @param config - Tracking configuration options
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(config: Partial<TrackingConfig> = {}): Promise<void> {
    try {
      console.log('Initializing MediaPipe face mesh...');

      // Create canvas for visualization if not provided
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        if (!this.context) {
          throw new Error('Could not get canvas context');
        }
      }

      // Initialize MediaPipe Face Mesh
      this.faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      // Configure face mesh
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: config.minDetectionConfidence || 0.5,
        minTrackingConfidence: 0.5,
      });

      // Set up result callback
      this.faceMesh.onResults((results: any) => {
        this.handleMediaPipeResults(results);
      });

      this.isInitialized = true;
      console.log('MediaPipe face mesh initialized successfully');
    } catch (error) {
      console.error('MediaPipe face mesh initialization failed:', error);
      throw this.handleTrackingError(error);
    }
  }

  /**
   * @description Start tracking on a video element
   * @param videoElement - HTML video element to track
   * @param onResult - Callback for tracking results
   */
  startTracking(
    videoElement: HTMLVideoElement,
    onResult?: (result: FaceDetectionResult) => void
  ): void {
    if (!this.isInitialized || !this.faceMesh) {
      throw new Error('Tracking service not initialized');
    }

    this.videoElement = videoElement;
    this.onResultCallback = onResult;
    this.performanceMetrics.frameCount = 0;
    this.performanceMetrics.lastFrameTime = performance.now();

    // Set up canvas size to match video
    if (this.canvas) {
      this.canvas.width = videoElement.videoWidth || videoElement.clientWidth;
      this.canvas.height =
        videoElement.videoHeight || videoElement.clientHeight;
    }

    console.log('Starting MediaPipe face mesh tracking');

    // Start camera with MediaPipe
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.videoElement && this.faceMesh) {
          await this.faceMesh.send({ image: this.videoElement });
        }
      },
      width: videoElement.videoWidth || 640,
      height: videoElement.videoHeight || 480,
    });

    this.camera.start();
  }

  /**
   * @description Handle MediaPipe face mesh results
   * @param results - MediaPipe face mesh results
   */
  private handleMediaPipeResults(results: any): void {
    const startTime = performance.now();

    try {
      let landmarks: FacialLandmarks | null = null;
      let success = false;

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const faceLandmarks = results.multiFaceLandmarks[0]; // Use first detected face

        // Convert MediaPipe face mesh landmarks to our format
        landmarks =
          this.convertMediaPipeLandmarksToFacialLandmarks(faceLandmarks);
        success = true;

        console.log(
          'MediaPipe: Face detected with landmarks:',
          landmarks.landmarks.length
        );
      } else {
        console.log('MediaPipe: No face detected');
      }

      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      const result: FaceDetectionResult = {
        success,
        landmarks,
        timestamp: Date.now(),
      };

      if (this.onResultCallback) {
        this.onResultCallback(result);
      }

      // Draw visualization if canvas is available
      if (this.canvas && this.context) {
        this.drawVisualization(results);
      }
    } catch (error) {
      console.error('MediaPipe results processing error:', error);
      const errorResult: FaceDetectionResult = {
        success: false,
        landmarks: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      if (this.onResultCallback) {
        this.onResultCallback(errorResult);
      }
    }
  }

  /**
   * @description Convert MediaPipe face mesh landmarks to our facial landmarks format
   * @param faceLandmarks - MediaPipe face mesh landmarks
   * @returns Converted facial landmarks
   */
  private convertMediaPipeLandmarksToFacialLandmarks(
    faceLandmarks: any[]
  ): FacialLandmarks {
    // MediaPipe Face Mesh provides 468 landmarks directly
    const landmarks = faceLandmarks.map((landmark: any) => ({
      x: landmark.x * (this.canvas?.width || 640),
      y: landmark.y * (this.canvas?.height || 480),
      z: landmark.z || 0,
    }));

    // Calculate face bounding box
    const xCoords = landmarks.map(p => p.x);
    const yCoords = landmarks.map(p => p.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    return {
      landmarks,
      faceInViewConfidence: 0.9, // High confidence for detected face
      faceBoundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
    };
  }

  /**
   * @description Draw visualization on canvas
   * @param results - MediaPipe face mesh results
   */
  private drawVisualization(results: any): void {
    if (!this.context || !this.canvas) return;

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw face mesh landmarks
    if (results.multiFaceLandmarks) {
      for (const faceLandmarks of results.multiFaceLandmarks) {
        if (faceLandmarks) {
          // Draw key facial landmarks (eyes, nose, mouth)
          const keyLandmarks = [
            33,
            7,
            163,
            144,
            145,
            153,
            154,
            155,
            133,
            173,
            157,
            158,
            159,
            160,
            161,
            246, // Right eye
            362,
            382,
            381,
            380,
            374,
            373,
            390,
            249,
            263,
            466,
            388,
            387,
            386,
            385,
            384,
            398, // Left eye
            168,
            6,
            197,
            195,
            5,
            4,
            1,
            19,
            94,
            2,
            164,
            0,
            11,
            12,
            14,
            15,
            16,
            17,
            18,
            200,
            199,
            175, // Nose
            61,
            84,
            17,
            314,
            405,
            320,
            307,
            375,
            321,
            308,
            324,
            318, // Mouth
          ];

          keyLandmarks.forEach((index: number) => {
            if (faceLandmarks[index]) {
              const point = faceLandmarks[index];
              const x = point.x * this.canvas!.width;
              const y = point.y * this.canvas!.height;

              this.context!.beginPath();
              this.context!.arc(x, y, 2, 0, 2 * Math.PI);
              this.context!.fillStyle = '#FF3030';
              this.context!.fill();
            }
          });

          // Draw face outline
          const faceOutline = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
            379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
            234, 127, 162, 21, 54, 103, 67, 109,
          ];
          this.context!.strokeStyle = '#00FF00';
          this.context!.lineWidth = 1;
          this.context!.beginPath();

          faceOutline.forEach((index: number, i: number) => {
            if (faceLandmarks[index]) {
              const point = faceLandmarks[index];
              const x = point.x * this.canvas!.width;
              const y = point.y * this.canvas!.height;

              if (i === 0) {
                this.context!.moveTo(x, y);
              } else {
                this.context!.lineTo(x, y);
              }
            }
          });

          this.context!.stroke();
        }
      }
    }
  }

  /**
   * @description Stop tracking and clean up resources
   */
  stopTracking(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    this.videoElement = null;
    this.onResultCallback = undefined;
    console.log('MediaPipe tracking stopped');
  }

  /**
   * @description Update performance metrics for monitoring
   * @param processingTime - Time taken to process current frame
   */
  private updatePerformanceMetrics(processingTime: number): void {
    const now = performance.now();
    const deltaTime = now - this.performanceMetrics.lastFrameTime;

    this.performanceMetrics.frameCount++;
    this.performanceMetrics.latency = processingTime;

    if (deltaTime > 0) {
      this.performanceMetrics.fps = 1000 / deltaTime;
    }

    this.performanceMetrics.lastFrameTime = now;
  }

  /**
   * @description Get current performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * @description Check if tracking performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    return (
      this.performanceMetrics.fps >= PERFORMANCE_THRESHOLDS.MIN_FPS &&
      this.performanceMetrics.latency <= PERFORMANCE_THRESHOLDS.MAX_LATENCY &&
      this.performanceMetrics.accuracy >= PERFORMANCE_THRESHOLDS.MIN_ACCURACY
    );
  }

  /**
   * @description Handle tracking errors
   * @param error - Error object
   * @returns TrackingError type
   */
  private handleTrackingError(error: unknown): TrackingError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('initialization') || message.includes('init')) {
        return 'initialization-failed';
      }
      if (message.includes('model') || message.includes('load')) {
        return 'model-loading-failed';
      }
      if (message.includes('tracking') || message.includes('detection')) {
        return 'tracking-failed';
      }
      if (message.includes('performance') || message.includes('slow')) {
        return 'performance-degraded';
      }
      if (
        message.includes('not supported') ||
        message.includes('unsupported')
      ) {
        return 'not-supported';
      }
    }

    return 'unknown';
  }

  /**
   * @description Clean up resources
   */
  cleanup(): void {
    this.stopTracking();
    this.isInitialized = false;
    this.faceMesh = null;
    console.log('MediaPipe tracking service cleaned up');
  }
}
