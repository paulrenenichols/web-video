/**
 * @fileoverview MediaPipe service for facial tracking and landmark detection.
 *
 * Handles MediaPipe initialization, face detection, and landmark tracking.
 * Provides real-time facial tracking data for overlay positioning.
 */

import { FaceDetection } from '@mediapipe/face_detection';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { DrawingUtils } from '@mediapipe/drawing_utils';
import {
  MediaPipeOptions,
  MediaPipeState,
  TrackingStatus,
  FaceDetection as FaceDetectionResult,
  FacialLandmarks,
  LandmarkPoint,
} from '@/types/tracking';

/**
 * MediaPipe service class for facial tracking
 */
export class MediaPipeService {
  private faceDetection: FaceDetection | null = null;
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private isInitialized = false;
  private options: Required<MediaPipeOptions>;
  private onDetectionCallback?: (detection: FaceDetectionResult) => void;
  private onLandmarksCallback?: (landmarks: FacialLandmarks) => void;

  constructor(options: MediaPipeOptions = {}) {
    this.options = {
      enableFaceMesh: options.enableFaceMesh ?? true,
      enableFaceDetection: options.enableFaceDetection ?? true,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    };
  }

  /**
   * Initialize MediaPipe services
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing MediaPipe services...');

      // Initialize face detection
      if (this.options.enableFaceDetection) {
        this.faceDetection = new FaceDetection({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          },
        });

        this.faceDetection.setOptions({
          modelSelection: 0,
          minDetectionConfidence: this.options.minDetectionConfidence,
        });

        this.faceDetection.onResults((results) => {
          this.handleFaceDetectionResults(results);
        });
      }

      // Initialize face mesh for landmarks
      if (this.options.enableFaceMesh) {
        this.faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        this.faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: this.options.minDetectionConfidence,
          minTrackingConfidence: this.options.minTrackingConfidence,
        });

        this.faceMesh.onResults((results) => {
          this.handleFaceMeshResults(results);
        });
      }

      this.isInitialized = true;
      console.log('MediaPipe services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe services:', error);
      throw error;
    }
  }

  /**
   * Start processing video stream
   */
  async startProcessing(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MediaPipe services not initialized');
    }

    try {
      console.log('Starting MediaPipe processing...');

      // Start face detection processing
      if (this.faceDetection) {
        await this.faceDetection.send({ image: videoElement });
      }

      // Start face mesh processing
      if (this.faceMesh) {
        await this.faceMesh.send({ image: videoElement });
      }

      console.log('MediaPipe processing started');
    } catch (error) {
      console.error('Failed to start MediaPipe processing:', error);
      throw error;
    }
  }

  /**
   * Process a single frame
   */
  async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Process with face detection
      if (this.faceDetection) {
        await this.faceDetection.send({ image: videoElement });
      }

      // Process with face mesh
      if (this.faceMesh) {
        await this.faceMesh.send({ image: videoElement });
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  /**
   * Handle face detection results
   */
  private handleFaceDetectionResults(results: any): void {
    const detection: FaceDetectionResult = {
      detected: results.detections.length > 0,
      confidence: results.detections[0]?.score || 0,
      timestamp: Date.now(),
    };

    if (results.detections.length > 0) {
      const detection = results.detections[0];
      const boundingBox = detection.boundingBox;
      
      detection.boundingBox = {
        x: boundingBox.xCenter,
        y: boundingBox.yCenter,
        width: boundingBox.width,
        height: boundingBox.height,
      };
    }

    console.log('Face detection:', detection);
    this.onDetectionCallback?.(detection);
  }

  /**
   * Handle face mesh results
   */
  private handleFaceMeshResults(results: any): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const landmarkPoints: LandmarkPoint[] = landmarks.map((point: any) => ({
      x: point.x,
      y: point.y,
      z: point.z,
      visibility: point.visibility,
    }));

    const facialLandmarks: FacialLandmarks = {
      landmarks: landmarkPoints,
      confidence: 1.0, // Face mesh doesn't provide confidence, assume high confidence if detected
      timestamp: Date.now(),
    };

    console.log('Facial landmarks detected:', facialLandmarks.landmarks.length, 'points');
    this.onLandmarksCallback?.(facialLandmarks);
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
  dispose(): void {
    console.log('Disposing MediaPipe services...');
    
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }

    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }

    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    this.isInitialized = false;
    console.log('MediaPipe services disposed');
  }
} 