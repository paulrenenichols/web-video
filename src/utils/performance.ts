/**
 * @fileoverview Performance utilities and helper functions.
 *
 * Provides utilities for measuring, monitoring, and optimizing
 * application performance including memory usage, frame rates,
 * and custom metrics.
 */

import { getPerformanceConfig, PERFORMANCE_METRICS } from '@/config/performance';

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata: Record<string, any> | undefined;
}

/**
 * Performance measurement result
 */
export interface PerformanceMeasurement {
  startTime: number;
  endTime: number;
  duration: number;
  label: string;
}

/**
 * Memory usage information
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedJSHeapSizeMB: number;
  totalJSHeapSizeMB: number;
  jsHeapSizeLimitMB: number;
}

/**
 * Frame rate measurement
 */
export interface FrameRateInfo {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  totalFrames: number;
}

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = <T>(
  fn: () => T,
  label: string
): { result: T; measurement: PerformanceMeasurement } => {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  const measurement: PerformanceMeasurement = {
    startTime,
    endTime,
    duration: endTime - startTime,
    label,
  };
  
  // Mark the measurement in performance timeline
  performance.mark(`${label}-start`);
  performance.mark(`${label}-end`);
  performance.measure(label, `${label}-start`, `${label}-end`);
  
  return { result, measurement };
};

/**
 * Measure execution time of an async function
 */
export const measureAsyncExecutionTime = async <T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; measurement: PerformanceMeasurement }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  const measurement: PerformanceMeasurement = {
    startTime,
    endTime,
    duration: endTime - startTime,
    label,
  };
  
  // Mark the measurement in performance timeline
  performance.mark(`${label}-start`);
  performance.mark(`${label}-end`);
  performance.measure(label, `${label}-start`, `${label}-end`);
  
  return { result, measurement };
};

/**
 * Get current memory usage information
 */
export const getMemoryInfo = (): MemoryInfo | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedJSHeapSizeMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSizeMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

/**
 * Check if memory usage exceeds threshold
 */
export const isMemoryUsageExceeded = (): boolean => {
  const config = getPerformanceConfig();
  const memoryInfo = getMemoryInfo();
  
  if (!memoryInfo) return false;
  
  return memoryInfo.usedJSHeapSizeMB > config.thresholds.maxMemoryUsage;
};

/**
 * Calculate frame rate from frame timestamps
 */
export const calculateFrameRate = (frameTimestamps: number[]): FrameRateInfo => {
  if (frameTimestamps.length < 2) {
    return {
      fps: 0,
      frameTime: 0,
      droppedFrames: 0,
      totalFrames: frameTimestamps.length,
    };
  }
  
  const intervals = [];
  for (let i = 1; i < frameTimestamps.length; i++) {
    intervals.push(frameTimestamps[i] - frameTimestamps[i - 1]);
  }
  
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const fps = 1000 / averageInterval;
  
  // Calculate dropped frames (frames that took longer than 16.67ms for 60fps)
  const targetFrameTime = 1000 / 60; // 16.67ms for 60fps
  const droppedFrames = intervals.filter(interval => interval > targetFrameTime * 1.5).length;
  
  return {
    fps: Math.round(fps * 100) / 100,
    frameTime: Math.round(averageInterval * 100) / 100,
    droppedFrames,
    totalFrames: frameTimestamps.length,
  };
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Create a performance observer for custom metrics
 */
export const createPerformanceObserver = (
  entryTypes: string[],
  callback: PerformanceObserverCallback
): PerformanceObserver | null => {
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported');
    return null;
  }
  
  try {
    const observer = new PerformanceObserver(callback);
    observer.observe({ entryTypes });
    return observer;
  } catch (error) {
    console.error('Failed to create PerformanceObserver:', error);
    return null;
  }
};

/**
 * Record a custom performance metric
 */
export const recordCustomMetric = (
  name: string,
  value: number,
  unit: string = 'ms',
  metadata?: Record<string, any>
): void => {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    metadata: metadata || undefined,
  };
  
  // Store metric in performance timeline
  performance.mark(`${name}-${value}`);
  
  // Dispatch custom event for metric recording
  const event = new CustomEvent('performance:metric-recorded', {
    detail: metric,
  });
  window.dispatchEvent(event);
  
  // Log in development
  if (import.meta.env.DEV) {
    console.log(`Performance Metric: ${name} = ${value}${unit}`, metadata);
  }
};

/**
 * Get bundle size information
 */
export const getBundleSize = async (): Promise<number | null> => {
  try {
    const response = await fetch('/dist/assets/');
    if (response.ok) {
      const text = await response.text();
      // This is a simplified approach - in production you'd want more sophisticated bundle analysis
      const scriptTags = text.match(/<script[^>]*src="[^"]*\.js"[^>]*>/g);
      return scriptTags ? scriptTags.length * 100 : null; // Rough estimate
    }
  } catch (error) {
    console.warn('Could not determine bundle size:', error);
  }
  return null;
};

/**
 * Check if performance monitoring should be enabled based on sampling
 */
export const shouldSamplePerformance = (): boolean => {
  const config = getPerformanceConfig();
  return Math.random() < config.monitoring.samplingRate;
};

/**
 * Performance monitoring decorator for class methods
 */
export const monitorPerformance = (label?: string) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const methodLabel = label || `${target.constructor.name}.${propertyKey}`;
      
      if (shouldSamplePerformance()) {
        const { result, measurement } = measureExecutionTime(
          () => originalMethod.apply(this, args),
          methodLabel
        );
        
        recordCustomMetric(
          PERFORMANCE_METRICS.UI_RESPONSIVENESS,
          measurement.duration,
          'ms',
          { method: methodLabel }
        );
        
        return result;
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}; 