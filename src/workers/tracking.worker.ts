/**
 * @fileoverview Web Worker for MediaPipe tracking processing.
 *
 * Handles facial tracking and landmark detection in a background thread
 * to keep the main UI thread responsive during heavy processing.
 */

// Import MediaPipe modules dynamically
let FaceDetection: any;
let FaceMesh: any;

// Worker state
let isInitialized = false;
let faceDetection: any = null;
let faceMesh: any = null;
let options: any = {};

// Message types
const MESSAGE_TYPES = {
  INITIALIZE: 'INITIALIZE',
  PROCESS_FRAME: 'PROCESS_FRAME',
  START_PROCESSING: 'START_PROCESSING',
  STOP_PROCESSING: 'STOP_PROCESSING',
  DISPOSE: 'DISPOSE',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
} as const;

/**
 * Load MediaPipe modules dynamically
 */
const loadMediaPipeModules = async () => {
  if (!FaceDetection) {
    const faceDetectionModule = await import('@mediapipe/face_detection');
    FaceDetection = faceDetectionModule.FaceDetection;
  }
  if (!FaceMesh) {
    const faceMeshModule = await import('@mediapipe/face_mesh');
    FaceMesh = faceMeshModule.FaceMesh;
  }
};

/**
 * Initialize MediaPipe services
 */
const initialize = async (initOptions: any) => {
  try {
    console.log('🔄 Worker: Initializing MediaPipe services...');
    
    options = initOptions;
    await loadMediaPipeModules();

    // Initialize face detection
    if (options.enableFaceDetection) {
      faceDetection = new FaceDetection({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        },
      });

      faceDetection.setOptions({
        minDetectionConfidence: options.minDetectionConfidence,
      });

      faceDetection.onResults((results: any) => {
        self.postMessage({
          type: MESSAGE_TYPES.RESULT,
          resultType: 'faceDetection',
          data: results,
        });
      });
    }

    // Initialize face mesh for landmarks
    if (options.enableFaceMesh) {
      faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: options.minDetectionConfidence,
        minTrackingConfidence: options.minTrackingConfidence,
      });

      faceMesh.onResults((results: any) => {
        self.postMessage({
          type: MESSAGE_TYPES.RESULT,
          resultType: 'faceMesh',
          data: results,
        });
      });
    }

    isInitialized = true;
    console.log('✅ Worker: MediaPipe services initialized successfully');
    
    self.postMessage({
      type: MESSAGE_TYPES.RESULT,
      resultType: 'initialized',
      data: { success: true },
    });
  } catch (error) {
    console.error('❌ Worker: Failed to initialize MediaPipe services:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Process a single frame
 */
const processFrame = async (imageData: ImageData) => {
  if (!isInitialized) {
    throw new Error('MediaPipe not initialized');
  }

  try {
    if (faceDetection) {
      await faceDetection.send({ image: imageData });
    }
    if (faceMesh) {
      await faceMesh.send({ image: imageData });
    }
  } catch (error) {
    console.error('❌ Worker: Error processing frame:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Frame processing error',
    });
  }
};

/**
 * Start continuous processing
 */
const startProcessing = async (_videoElement: any) => {
  if (!isInitialized) {
    throw new Error('MediaPipe not initialized');
  }

  try {
    if (faceDetection) {
      await faceDetection.start();
    }
    if (faceMesh) {
      await faceMesh.start();
    }
    
    self.postMessage({
      type: MESSAGE_TYPES.RESULT,
      resultType: 'processing_started',
      data: { success: true },
    });
  } catch (error) {
    console.error('❌ Worker: Error starting processing:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Start processing error',
    });
  }
};

/**
 * Stop continuous processing
 */
const stopProcessing = async () => {
  try {
    if (faceDetection) {
      await faceDetection.stop();
    }
    if (faceMesh) {
      await faceMesh.stop();
    }
    
    self.postMessage({
      type: MESSAGE_TYPES.RESULT,
      resultType: 'processing_stopped',
      data: { success: true },
    });
  } catch (error) {
    console.error('❌ Worker: Error stopping processing:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Stop processing error',
    });
  }
};

/**
 * Dispose of resources
 */
const dispose = () => {
  try {
    if (faceDetection) {
      faceDetection.close();
      faceDetection = null;
    }
    if (faceMesh) {
      faceMesh.close();
      faceMesh = null;
    }
    
    isInitialized = false;
    console.log('🧹 Worker: MediaPipe resources disposed');
    
    self.postMessage({
      type: MESSAGE_TYPES.RESULT,
      resultType: 'disposed',
      data: { success: true },
    });
  } catch (error) {
    console.error('❌ Worker: Error disposing resources:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Dispose error',
    });
  }
};

/**
 * Handle messages from main thread
 */
self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case MESSAGE_TYPES.INITIALIZE:
        await initialize(data);
        break;
        
      case MESSAGE_TYPES.PROCESS_FRAME:
        await processFrame(data);
        break;
        
      case MESSAGE_TYPES.START_PROCESSING:
        await startProcessing(data);
        break;
        
      case MESSAGE_TYPES.STOP_PROCESSING:
        await stopProcessing();
        break;
        
      case MESSAGE_TYPES.DISPOSE:
        dispose();
        break;
        
      default:
        console.warn('⚠️ Worker: Unknown message type:', type);
    }
  } catch (error) {
    console.error('❌ Worker: Error handling message:', error);
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      error: error instanceof Error ? error.message : 'Message handling error',
    });
  }
};

// Export for TypeScript
export {}; 