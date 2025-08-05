/**
 * @fileoverview Web Worker service for managing background processing.
 *
 * Provides a clean interface for communicating with Web Workers
 * and managing worker lifecycle and message handling.
 */

import { MediaPipeOptions } from '@/types/tracking';

// Message types
export const WORKER_MESSAGE_TYPES = {
  INITIALIZE: 'INITIALIZE',
  PROCESS_FRAME: 'PROCESS_FRAME',
  START_PROCESSING: 'START_PROCESSING',
  STOP_PROCESSING: 'STOP_PROCESSING',
  DISPOSE: 'DISPOSE',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
} as const;

// Result types
export const WORKER_RESULT_TYPES = {
  INITIALIZED: 'INITIALIZED',
  FACE_DETECTION: 'FACE_DETECTION',
  FACE_MESH: 'FACE_MESH',
  PROCESSING_STARTED: 'PROCESSING_STARTED',
  PROCESSING_STOPPED: 'PROCESSING_STOPPED',
  DISPOSED: 'DISPOSED',
} as const;

// Worker types
export const WORKER_TYPES = {
  TRACKING: 'tracking',
  AUDIO: 'audio',
  EFFECTS: 'effects',
} as const;

/**
 * Worker message interface
 */
export interface WorkerMessage {
  type: keyof typeof WORKER_MESSAGE_TYPES;
  data?: any;
}

/**
 * Worker result interface
 */
export interface WorkerResult {
  type: keyof typeof WORKER_RESULT_TYPES;
  data: any;
}

/**
 * Worker error interface
 */
export interface WorkerError {
  type: 'error';
  error: string;
}

/**
 * Worker callback types
 */
export type WorkerCallback = (result: WorkerResult) => void;
export type WorkerErrorCallback = (error: string) => void;

/**
 * Web Worker service class
 */
export class WorkerService {
  private workers: Map<string, Worker> = new Map();
  private callbacks: Map<string, Set<WorkerCallback>> = new Map();
  private errorCallbacks: Map<string, Set<WorkerErrorCallback>> = new Map();
  private isInitialized = false;

  /**
   * Initialize the worker service
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('⚠️ Worker service already initialized');
      return;
    }

    this.isInitialized = true;
    console.log('🔄 Worker service initialized');
  }

  /**
   * Create a new worker
   */
  createWorker(type: keyof typeof WORKER_TYPES, workerPath: string): string {
    const workerId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const worker = new Worker(workerPath, { type: 'module' });
      
      // Set up message handler
      worker.onmessage = (event) => {
        this.handleWorkerMessage(workerId, event.data);
      };

      // Set up error handler
      worker.onerror = (error) => {
        console.error(`❌ Worker ${workerId} error:`, error);
        this.handleWorkerError(workerId, error.message || 'Worker error');
      };

      this.workers.set(workerId, worker);
      this.callbacks.set(workerId, new Set());
      this.errorCallbacks.set(workerId, new Set());

      console.log(`✅ Created worker: ${workerId}`);
      return workerId;
    } catch (error) {
      console.error(`❌ Failed to create worker ${type}:`, error);
      throw error;
    }
  }

  /**
   * Send message to worker
   */
  sendMessage(workerId: string, message: WorkerMessage): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    worker.postMessage(message);
  }

  /**
   * Add callback for worker results
   */
  onResult(workerId: string, callback: WorkerCallback): void {
    const callbacks = this.callbacks.get(workerId);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  /**
   * Remove callback for worker results
   */
  offResult(workerId: string, callback: WorkerCallback): void {
    const callbacks = this.callbacks.get(workerId);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Add error callback for worker
   */
  onError(workerId: string, callback: WorkerErrorCallback): void {
    const callbacks = this.errorCallbacks.get(workerId);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  /**
   * Remove error callback for worker
   */
  offError(workerId: string, callback: WorkerErrorCallback): void {
    const callbacks = this.errorCallbacks.get(workerId);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Initialize tracking worker
   */
  async initializeTrackingWorker(workerId: string, options: MediaPipeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const errorHandler = (error: string) => {
        this.offError(workerId, errorHandler);
        reject(new Error(error));
      };

      const resultHandler = (result: WorkerResult) => {
        if (result.type === WORKER_RESULT_TYPES.INITIALIZED) {
          this.offResult(workerId, resultHandler);
          this.offError(workerId, errorHandler);
          resolve();
        }
      };

      this.onResult(workerId, resultHandler);
      this.onError(workerId, errorHandler);

      this.sendMessage(workerId, {
        type: WORKER_MESSAGE_TYPES.INITIALIZE,
        data: options,
      });
    });
  }

  /**
   * Process frame with tracking worker
   */
  processFrame(workerId: string, imageData: ImageData): void {
    this.sendMessage(workerId, {
      type: WORKER_MESSAGE_TYPES.PROCESS_FRAME,
      data: imageData,
    });
  }

  /**
   * Start processing with worker
   */
  async startProcessing(workerId: string, data?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const errorHandler = (error: string) => {
        this.offError(workerId, errorHandler);
        reject(new Error(error));
      };

      const resultHandler = (result: WorkerResult) => {
        if (result.type === WORKER_RESULT_TYPES.PROCESSING_STARTED) {
          this.offResult(workerId, resultHandler);
          this.offError(workerId, errorHandler);
          resolve();
        }
      };

      this.onResult(workerId, resultHandler);
      this.onError(workerId, errorHandler);

      this.sendMessage(workerId, {
        type: WORKER_MESSAGE_TYPES.START_PROCESSING,
        data,
      });
    });
  }

  /**
   * Stop processing with worker
   */
  async stopProcessing(workerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const errorHandler = (error: string) => {
        this.offError(workerId, errorHandler);
        reject(new Error(error));
      };

      const resultHandler = (result: WorkerResult) => {
        if (result.type === WORKER_RESULT_TYPES.PROCESSING_STOPPED) {
          this.offResult(workerId, resultHandler);
          this.offError(workerId, errorHandler);
          resolve();
        }
      };

      this.onResult(workerId, resultHandler);
      this.onError(workerId, errorHandler);

      this.sendMessage(workerId, {
        type: WORKER_MESSAGE_TYPES.STOP_PROCESSING,
      });
    });
  }

  /**
   * Dispose of a worker
   */
  async disposeWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.warn(`⚠️ Worker ${workerId} not found for disposal`);
      return;
    }

    return new Promise((resolve, reject) => {
      const errorHandler = (error: string) => {
        this.offError(workerId, errorHandler);
        reject(new Error(error));
      };

      const resultHandler = (result: WorkerResult) => {
        if (result.type === WORKER_RESULT_TYPES.DISPOSED) {
          this.offResult(workerId, resultHandler);
          this.offError(workerId, errorHandler);
          
          // Clean up worker
          worker.terminate();
          this.workers.delete(workerId);
          this.callbacks.delete(workerId);
          this.errorCallbacks.delete(workerId);
          
          console.log(`🧹 Disposed worker: ${workerId}`);
          resolve();
        }
      };

      this.onResult(workerId, resultHandler);
      this.onError(workerId, errorHandler);

      this.sendMessage(workerId, {
        type: WORKER_MESSAGE_TYPES.DISPOSE,
      });
    });
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(workerId: string, data: WorkerResult | WorkerError): void {
    if (data.type === 'error') {
      this.handleWorkerError(workerId, (data as WorkerError).error);
      return;
    }

    const callbacks = this.callbacks.get(workerId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data as WorkerResult);
        } catch (error) {
          console.error(`❌ Error in worker callback:`, error);
        }
      });
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: string): void {
    console.error(`❌ Worker ${workerId} error:`, error);
    
    const callbacks = this.errorCallbacks.get(workerId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          console.error(`❌ Error in worker error callback:`, callbackError);
        }
      });
    }
  }

  /**
   * Get worker count
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  /**
   * Get all worker IDs
   */
  getWorkerIds(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Check if worker exists
   */
  hasWorker(workerId: string): boolean {
    return this.workers.has(workerId);
  }

  /**
   * Cleanup all workers
   */
  async cleanup(): Promise<void> {
    const workerIds = this.getWorkerIds();
    const disposePromises = workerIds.map(workerId => this.disposeWorker(workerId));
    
    await Promise.all(disposePromises);
    this.isInitialized = false;
    console.log('🧹 Worker service cleaned up');
  }
}

// Export singleton instance
export const workerService = new WorkerService(); 