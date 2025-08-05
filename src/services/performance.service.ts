/**
 * @fileoverview Performance monitoring and optimization service.
 *
 * Provides centralized performance monitoring, optimization,
 * and reporting capabilities for the application.
 */

import { getPerformanceConfig, PERFORMANCE_METRICS, PERFORMANCE_EVENTS } from '@/config/performance';
import {
  getMemoryInfo,
  isMemoryUsageExceeded,
  recordCustomMetric,
  createPerformanceObserver,
  shouldSamplePerformance,
  measureExecutionTime,
  measureAsyncExecutionTime,
  PerformanceMetric,
  MemoryInfo,
  FrameRateInfo,
  calculateFrameRate,
} from '@/utils/performance';

/**
 * Performance monitoring service class
 */
export class PerformanceService {
  private static instance: PerformanceService;
  private config = getPerformanceConfig();
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private frameTimestamps: number[] = [];
  private memoryInterval: NodeJS.Timeout | null = null;
  private frameRateInterval: NodeJS.Timeout | null = null;

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (!this.config.monitoring.enabled) {
      console.log('Performance monitoring is disabled');
      return;
    }

    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
    this.setupEventListeners();
    this.isInitialized = true;

    console.log('Performance monitoring initialized');
  }

  /**
   * Cleanup performance monitoring
   */
  public cleanup(): void {
    this.stopMemoryMonitoring();
    this.stopFrameRateMonitoring();
    this.disconnectObservers();
    this.removeEventListeners();
    this.isInitialized = false;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ): void {
    if (!shouldSamplePerformance()) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata: metadata || undefined,
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    recordCustomMetric(name, value, unit, metadata);
  }

  /**
   * Get current memory information
   */
  public getMemoryInfo(): MemoryInfo | null {
    return getMemoryInfo();
  }

  /**
   * Check if memory usage exceeds threshold
   */
  public isMemoryExceeded(): boolean {
    return isMemoryUsageExceeded();
  }

  /**
   * Start frame rate monitoring
   */
  public startFrameRateMonitoring(): void {
    if (this.frameRateInterval) {
      this.stopFrameRateMonitoring();
    }

    this.frameRateInterval = setInterval(() => {
      this.recordFrame();
      this.updateFrameRate();
    }, 1000);
  }

  /**
   * Stop frame rate monitoring
   */
  public stopFrameRateMonitoring(): void {
    if (this.frameRateInterval) {
      clearInterval(this.frameRateInterval);
      this.frameRateInterval = null;
    }
  }

  /**
   * Record a frame for FPS calculation
   */
  public recordFrame(): void {
    if (shouldSamplePerformance()) {
      this.frameTimestamps.push(performance.now());
      
      // Keep only last 60 frames
      if (this.frameTimestamps.length > 60) {
        this.frameTimestamps = this.frameTimestamps.slice(-60);
      }
    }
  }

  /**
   * Get current frame rate information
   */
  public getFrameRateInfo(): FrameRateInfo {
    return calculateFrameRate(this.frameTimestamps);
  }

  /**
   * Measure execution time of a function
   */
  public measureExecution<T>(
    fn: () => T,
    label: string
  ): { result: T; duration: number } {
    const { result, measurement } = measureExecutionTime(fn, label);
    
    this.recordMetric(
      PERFORMANCE_METRICS.UI_RESPONSIVENESS,
      measurement.duration,
      'ms',
      { label }
    );

    return { result, duration: measurement.duration };
  }

  /**
   * Measure execution time of an async function
   */
  public async measureAsyncExecution<T>(
    fn: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const { result, measurement } = await measureAsyncExecutionTime(fn, label);
    
    this.recordMetric(
      PERFORMANCE_METRICS.UI_RESPONSIVENESS,
      measurement.duration,
      'ms',
      { label }
    );

    return { result, duration: measurement.duration };
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): PerformanceReport {
    const memoryMetrics = this.getMetricsByName(PERFORMANCE_METRICS.MEMORY_USAGE);
    const fpsMetrics = this.getMetricsByName(PERFORMANCE_METRICS.VIDEO_FPS);
    const loadTimeMetrics = this.getMetricsByName(PERFORMANCE_METRICS.INITIAL_LOAD_TIME);
    
    const averageMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0;
    
    const averageFrameRate = fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length
      : 0;
    
    const averageLoadTime = loadTimeMetrics.length > 0
      ? loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length
      : 0;

    const memoryWarnings = memoryMetrics.filter(m => 
      m.value > this.config.thresholds.maxMemoryUsage * 0.8
    ).length;
    
    const performanceIssues = fpsMetrics.filter(m => 
      m.value < this.config.thresholds.targetFrameRate * 0.9
    ).length;

    const suggestions = this.generateOptimizationSuggestions();

    return {
      summary: {
        averageMemoryUsage,
        averageFrameRate,
        averageLoadTime,
        totalMetrics: this.metrics.length,
        memoryWarnings,
        performanceIssues,
      },
      metrics: this.metrics,
      suggestions,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const memoryInfo = this.getMemoryInfo();
    const frameRateInfo = this.getFrameRateInfo();
    
    if (memoryInfo && memoryInfo.usedJSHeapSizeMB > this.config.thresholds.maxMemoryUsage * 0.8) {
      suggestions.push('Memory usage is approaching the limit. Consider optimizing memory usage.');
    }
    
    if (frameRateInfo && frameRateInfo.fps < this.config.thresholds.targetFrameRate * 0.9) {
      suggestions.push('Frame rate is below target. Consider optimizing rendering performance.');
    }
    
    if (frameRateInfo && frameRateInfo.droppedFrames > 0) {
      suggestions.push('Frames are being dropped. Consider reducing processing load.');
    }

    return suggestions;
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Navigation timing observer
      const navigationObserver = createPerformanceObserver(
        ['navigation'],
        (entries) => {
          entries.getEntries().forEach((entry: PerformanceEntry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric(
                PERFORMANCE_METRICS.INITIAL_LOAD_TIME,
                navEntry.loadEventEnd - navEntry.loadEventStart,
                'ms'
              );
            }
          });
        }
      );

      if (navigationObserver) {
        this.observers.push(navigationObserver);
      }

      // Paint timing observer
      const paintObserver = createPerformanceObserver(
        ['paint'],
        (entries) => {
          entries.getEntries().forEach((entry: PerformanceEntry) => {
            if (entry.entryType === 'paint') {
              this.recordMetric(
                `paint-${entry.name}`,
                entry.startTime,
                'ms'
              );
            }
          });
        }
      );

      if (paintObserver) {
        this.observers.push(paintObserver);
      }

    } catch (error) {
      console.error('Failed to set up performance observers:', error);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryInterval = setInterval(() => {
      const memoryInfo = this.getMemoryInfo();
      const isExceeded = this.isMemoryExceeded();
      
      if (memoryInfo) {
        this.recordMetric(
          PERFORMANCE_METRICS.MEMORY_USAGE,
          memoryInfo.usedJSHeapSizeMB,
          'MB',
          { total: memoryInfo.totalJSHeapSizeMB, limit: memoryInfo.jsHeapSizeLimitMB }
        );
      }

      if (isExceeded) {
        const event = new CustomEvent(PERFORMANCE_EVENTS.MEMORY_WARNING, {
          detail: { memoryInfo, threshold: this.config.thresholds.maxMemoryUsage },
        });
        window.dispatchEvent(event);
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  /**
   * Update frame rate information
   */
  private updateFrameRate(): void {
    const frameRateInfo = this.getFrameRateInfo();
    
    if (frameRateInfo.fps > 0) {
      this.recordMetric(
        PERFORMANCE_METRICS.VIDEO_FPS,
        frameRateInfo.fps,
        'fps',
        { droppedFrames: frameRateInfo.droppedFrames, totalFrames: frameRateInfo.totalFrames }
      );
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const handleMetricRecorded = (event: CustomEvent) => {
      const metric = event.detail as PerformanceMetric;
      this.metrics.push(metric);
    };

    window.addEventListener('performance:metric-recorded', handleMetricRecorded as EventListener);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('performance:metric-recorded', () => {});
  }

  /**
   * Disconnect all observers
   */
  private disconnectObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Performance report interface
 */
interface PerformanceReport {
  summary: {
    averageMemoryUsage: number;
    averageFrameRate: number;
    averageLoadTime: number;
    totalMetrics: number;
    memoryWarnings: number;
    performanceIssues: number;
  };
  metrics: PerformanceMetric[];
  suggestions: string[];
  timestamp: number;
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance(); 