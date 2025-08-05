/**
 * @fileoverview MediaPipe service for facial tracking and landmark detection.
 *
 * Handles MediaPipe initialization, face detection, and landmark tracking.
 * Uses Web Workers for background processing to keep UI responsive.
 * Provides real-time facial tracking data for overlay positioning.
 */

import { workerService, WORKER_RESULT_TYPES } from '@/services/worker.service';
import {
  MediaPipeOptions,
  MediaPipeState,
  TrackingStatus,
  FaceDetection as FaceDetectionResult,
  FacialLandmarks,
  LandmarkPoint,
} from '@/types/tracking';
import { calculateLandmarkConfidence } from '@/utils/tracking';

/**
 * MediaPipe service class for facial tracking
 */
export class MediaPipeService {
  private workerId: string | null = null;
  private isInitialized = false;
  private options: Required<MediaPipeOptions>;
  private onDetectionCallback?: (detection: FaceDetectionResult) => void;
  private onLandmarksCallback?: (landmarks: FacialLandmarks) => void;

  constructor(options: MediaPipeOptions = {}) {
    this.options = {
      enableFaceMesh: options.enableFaceMesh ?? true,
      enableFaceDetection: options.enableFaceDetection ?? false, // Disable face detection for now
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    };
  }

  /**
   * Initialize MediaPipe services using Web Worker
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing MediaPipe services with Web Worker...');

      // Initialize worker service if not already done
      workerService.initialize();

      // Create tracking worker
      this.workerId = workerService.createWorker(
        'TRACKING',
        '/src/workers/tracking.worker.ts'
      );

      // Set up worker result handlers
      workerService.onResult(this.workerId, (result) => {
        this.handleWorkerResult(result);
      });

      // Set up worker error handler
      workerService.onError(this.workerId, (error) => {
        console.error('❌ MediaPipe worker error:', error);
      });

      // Initialize the worker
      await workerService.initializeTrackingWorker(this.workerId, this.options);

      this.isInitialized = true;
      console.log('✅ MediaPipe services initialized successfully with Web Worker');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe services:', error);
      throw error;
    }
  }

  /**
   * Start processing video stream using Web Worker
   */
  async startProcessing(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized || !this.workerId) {
      throw new Error('MediaPipe services not initialized');
    }

    try {
      console.log('🔄 Starting MediaPipe processing with Web Worker...');
      await workerService.startProcessing(this.workerId, videoElement);
      console.log('✅ MediaPipe processing started');
    } catch (error) {
      console.error('❌ Failed to start MediaPipe processing:', error);
      throw error;
    }
  }

  /**
   * Process a single frame using Web Worker
   */
  async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized || !this.workerId) {
      console.warn('MediaPipe not initialized, skipping frame processing');
      return;
    }

    try {
      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Send frame to worker for processing
      workerService.processFrame(this.workerId, imageData);
    } catch (error) {
      console.error('❌ Error processing frame:', error);
    }
  }

  /**
   * Handle worker results
   */
  private handleWorkerResult(result: any): void {
    switch (result.type) {
      case WORKER_RESULT_TYPES.FACE_DETECTION:
        this.handleFaceDetectionResults(result.data);
        break;
      case WORKER_RESULT_TYPES.FACE_MESH:
        this.handleFaceMeshResults(result.data);
        break;
      default:
        console.log('📊 Worker result:', result);
    }
  }

  /**
   * Handle face detection results
   */
  private handleFaceDetectionResults(results: any): void {
    console.log('📊 Raw face detection results:', results);
    
    const detection: FaceDetectionResult = {
      detected: results.detections.length > 0,
      confidence: results.detections[0]?.score || 0,
      timestamp: Date.now(),
    };

    if (results.detections.length > 0) {
      const detectionResult = results.detections[0];
      const boundingBox = detectionResult.boundingBox;
      
      detection.boundingBox = {
        x: boundingBox.xCenter,
        y: boundingBox.yCenter,
        width: boundingBox.width,
        height: boundingBox.height,
      };
    }

    console.log('🎯 Processed face detection:', detection);
    this.onDetectionCallback?.(detection);
  }

  /**
   * Handle face mesh results
   */
  private handleFaceMeshResults(results: any): void {
    
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      console.log('❌ No face landmarks detected');
      
      // Trigger "no face detected" event
      const noFaceDetection: FaceDetectionResult = {
        detected: false,
        confidence: 0.0,
        timestamp: Date.now(),
      };
      
      console.log('🚫 No face detected:', noFaceDetection);
      this.onDetectionCallback?.(noFaceDetection);
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    

    
    const landmarkPoints: LandmarkPoint[] = landmarks.map((point: any) => ({
      x: point.x,
      y: point.y,
      z: point.z,
      visibility: point.visibility || 1.0, // Use visibility if available, otherwise default to 1.0
    }));

    // Calculate confidence based on landmark quality
    const confidence = calculateLandmarkConfidence(landmarkPoints);
    // const stats = getLandmarkStats(landmarkPoints); // Unused for now
    
    const facialLandmarks: FacialLandmarks = {
      landmarks: landmarkPoints,
      confidence,
      timestamp: Date.now(),
    };



    // Calculate bounding box from landmarks
    const boundingBox = this.calculateBoundingBoxFromLandmarks(landmarkPoints);

    // Also trigger face detection callback since we have a face
    const faceDetection: FaceDetectionResult = {
      detected: true,
      confidence: 1.0,
      boundingBox,
      timestamp: Date.now(),
    };


    
    this.onLandmarksCallback?.(facialLandmarks);
    this.onDetectionCallback?.(faceDetection);
  }

  /**
   * Calculate bounding box from facial landmarks
   */
  private calculateBoundingBoxFromLandmarks(landmarks: LandmarkPoint[]): { x: number; y: number; width: number; height: number } {
    if (landmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Use face-specific landmarks for more accurate bounding box
    // Focus on facial features (eyes, nose, mouth, cheeks) rather than entire head
    const faceLandmarkIndices = [
      // Eyes
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
      362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
      // Nose
      1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
      // Mouth
      0, 267, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      // Cheeks and face outline (excluding hair/head)
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ];

    // Find min/max coordinates from face-specific landmarks
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    let hasVisibleLandmarks = false;
    
    faceLandmarkIndices.forEach(index => {
      const landmark = landmarks[index];
      if (landmark && landmark.visibility && landmark.visibility > 0.5) {
        if (!hasVisibleLandmarks) {
          // Initialize with first visible landmark
          minX = maxX = landmark.x;
          minY = maxY = landmark.y;
          hasVisibleLandmarks = true;
        } else {
          minX = Math.min(minX, landmark.x);
          maxX = Math.max(maxX, landmark.x);
          minY = Math.min(minY, landmark.y);
          maxY = Math.max(maxY, landmark.y);
        }
      }
    });

    if (!hasVisibleLandmarks) {
      // Fallback to all landmarks if no face-specific landmarks are visible
      landmarks.forEach(landmark => {
        if (landmark.visibility && landmark.visibility > 0.5) {
          if (!hasVisibleLandmarks) {
            minX = maxX = landmark.x;
            minY = maxY = landmark.y;
            hasVisibleLandmarks = true;
          } else {
            minX = Math.min(minX, landmark.x);
            maxX = Math.max(maxX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxY = Math.max(maxY, landmark.y);
          }
        }
      });
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const x = minX + width / 2;
    const y = minY + height / 2;



    return { x, y, width, height };
  }

  /**
   * Set detection callback
   */
  onDetection(callback: (detection: FaceDetectionResult) => void): void {
    this.onDetectionCallback = callback;
  }

  /**
   * Set landmarks callback
   */
  onLandmarks(callback: (landmarks: FacialLandmarks) => void): void {
    this.onLandmarksCallback = callback;
  }

  /**
   * Get current service state
   */
  getState(): MediaPipeState {
    return {
      status: this.isInitialized ? TrackingStatus.DETECTED : TrackingStatus.INITIALIZING,
      faceDetection: null,
      facialLandmarks: null,
      isInitialized: this.isInitialized,
      error: null,
      faceCount: 0,
    };
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    console.log('🧹 Disposing MediaPipe services...');
    
    try {
      if (this.workerId) {
        await workerService.disposeWorker(this.workerId);
        this.workerId = null;
      }
      this.isInitialized = false;
      console.log('✅ MediaPipe services disposed');
    } catch (error) {
      console.error('❌ Error disposing MediaPipe services:', error);
    }
  }
} 